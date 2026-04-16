import { db } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const performanceService = {
  // ─── Cycles ─────────────────────────────────────────────────────────
  async listCycles(page = 1, limit = 20) {
    const query = db('appraisal_cycles').orderBy('created_at', 'desc');
    const { data, pagination } = await paginateQuery(query, page, limit);
    return { data, total: pagination.total };
  },

  async getCycle(id: string) {
    const cycle = await db('appraisal_cycles').where({ id }).first();
    if (!cycle) throw new AppError(404, 'Appraisal cycle not found');
    return cycle;
  },

  async createCycle(data: any) {
    const [cycle] = await db('appraisal_cycles')
      .insert({
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        is_active: data.isActive,
      })
      .returning('*');
    return cycle;
  },

  async activateCycle(id: string) {
    return await db.transaction(async (trx) => {
      await trx('appraisal_cycles').update({ is_active: false, updated_at: db.fn.now() });
      const [cycle] = await trx('appraisal_cycles')
        .where({ id })
        .update({ is_active: true, updated_at: db.fn.now() })
        .returning('*');
      if (!cycle) throw new AppError(404, 'Appraisal cycle not found');
    });
  },

  // ─── Appraisals ──────────────────────────────────────────────────────
  async listAppraisals(filters: { cycleId?: string, employeeId?: string, managerId?: string, status?: string }, page = 1, limit = 20) {
    const query = db('appraisals')
      .join('employees as emp', 'appraisals.employee_id', 'emp.id')
      .join('employees as mgr', 'appraisals.manager_id', 'mgr.id')
      .join('appraisal_cycles as cyc', 'appraisals.cycle_id', 'cyc.id')
      .select(
        'appraisals.*', 
        'emp.first_name as employee_first_name', 'emp.last_name as employee_last_name',
        'mgr.first_name as manager_first_name', 'mgr.last_name as manager_last_name',
        'cyc.name as cycle_name'
      )
      .orderBy('appraisals.created_at', 'desc');

    if (filters.cycleId) query.where('appraisals.cycle_id', filters.cycleId);
    if (filters.employeeId) query.where('appraisals.employee_id', filters.employeeId);
    if (filters.managerId) query.where('appraisals.manager_id', filters.managerId);
    if (filters.status) query.where('appraisals.status', filters.status);

    const { data, pagination } = await paginateQuery(query, page, limit);
    return { data, total: pagination.total };
  },

  async getAppraisal(id: string) {
    const appraisal = await db('appraisals')
      .join('employees as emp', 'appraisals.employee_id', 'emp.id')
      .join('employees as mgr', 'appraisals.manager_id', 'mgr.id')
      .select(
        'appraisals.*',
        'emp.first_name as employee_first_name', 'emp.last_name as employee_last_name',
        'mgr.first_name as manager_first_name', 'mgr.last_name as manager_last_name'
      )
      .where('appraisals.id', id).first();
    
    if (!appraisal) throw new AppError(404, 'Appraisal not found');

    const responses = await db('appraisal_responses')
      .join('appraisal_questions', 'appraisal_responses.question_id', 'appraisal_questions.id')
      .select('appraisal_responses.*', 'appraisal_questions.text as question_text', 'appraisal_questions.rating_type')
      .where('appraisal_responses.appraisal_id', id);

    return { ...appraisal, responses };
  },

  async createAppraisal(data: any) {
    const existing = await db('appraisals')
      .where({ cycle_id: data.cycleId, employee_id: data.employeeId })
      .first();
    if (existing) throw new AppError(409, 'Appraisal already exists for this cycle and employee');

    const [appraisal] = await db('appraisals')
      .insert({
        cycle_id: data.cycleId,
        employee_id: data.employeeId,
        manager_id: data.managerId,
        status: 'draft',
      })
      .returning('*');
    return appraisal;
  },

  async advanceAppraisal(id: string, action: string, responderUserId: string) {
    const appraisal = await db('appraisals').where({ id }).first();
    if (!appraisal) throw new AppError(404, 'Appraisal not found');

    const updates: any = { updated_at: db.fn.now() };

    if (action === 'submit_self') {
      if (appraisal.status !== 'draft') throw new AppError(400, 'Appraisal must be in draft to self-submit');
      const emp = await db('employees').where({ id: appraisal.employee_id }).first();
      if (emp?.user_id !== responderUserId) throw new AppError(403, 'Not authorized to submit self appraisal');
      updates.status = 'submitted';
      updates.self_submitted_at = db.fn.now();
    } else if (action === 'submit_manager') {
      if (appraisal.status !== 'submitted') throw new AppError(400, 'Appraisal must be submitted to review');
      const mgr = await db('employees').where({ id: appraisal.manager_id }).first();
      if (mgr?.user_id !== responderUserId) throw new AppError(403, 'Not authorized to submit manager review');
      updates.status = 'reviewed';
      updates.manager_submitted_at = db.fn.now();
    } else if (action === 'acknowledge') {
      if (appraisal.status !== 'reviewed') throw new AppError(400, 'Appraisal must be reviewed to acknowledge');
      const emp = await db('employees').where({ id: appraisal.employee_id }).first();
      if (emp?.user_id !== responderUserId) throw new AppError(403, 'Not authorized to acknowledge appraisal');
      updates.status = 'acknowledged';
      updates.acknowledged_at = db.fn.now();
    } else {
      throw new AppError(400, 'Invalid action');
    }

    const [updated] = await db('appraisals').where({ id }).update(updates).returning('*');
    return updated;
  },

  async saveResponses(appraisalId: string, responses: any[], responderId: string, responderRole: string) {
    const appraisal = await db('appraisals').where({ id: appraisalId }).first();
    if (!appraisal) throw new AppError(404, 'Appraisal not found');
    
    // Only allow edit in draft if self, or submitted if manager
    if (responderRole === 'self' && appraisal.status !== 'draft') {
       throw new AppError(400, 'Cannot edit self responses after submission');
    }
    if (responderRole === 'manager' && appraisal.status !== 'submitted') {
       throw new AppError(400, 'Cannot edit manager responses outside review phase');
    }

    const rows = responses.map(r => ({
      appraisal_id: appraisalId,
      question_id: r.questionId,
      responder_id: responderId,
      responder_role: responderRole,
      rating_value: r.ratingValue,
      text_value: r.textValue,
    }));

    await db('appraisal_responses')
      .insert(rows)
      .onConflict(['appraisal_id', 'question_id', 'responder_role'])
      .merge(['rating_value', 'text_value']);
  },

  // ─── Goals & Key Results ─────────────────────────────────────────────
  async listGoals(employeeId: string, cycleId?: string) {
    const query = db('goals')
      .where({ employee_id: employeeId })
      .orderBy('created_at', 'desc');
    if (cycleId) query.where({ cycle_id: cycleId });
    
    const goals = await query;
    const goalIds = goals.map(g => g.id);
    const krMap = new Map();
    
    if (goalIds.length > 0) {
      const krs = await db('key_results').whereIn('goal_id', goalIds);
      for (const kr of krs) {
         if (!krMap.has(kr.goal_id)) krMap.set(kr.goal_id, []);
         krMap.get(kr.goal_id).push(kr);
      }
    }
    
    return goals.map(g => ({ ...g, keyResults: krMap.get(g.id) || [] }));
  },

  async getGoal(id: string) {
    const goal = await db('goals').where({ id }).first();
    if (!goal) throw new AppError(404, 'Goal not found');
    const keyResults = await db('key_results').where({ goal_id: id });
    return { ...goal, keyResults };
  },

  async createGoal(data: any, employeeId: string) {
    const [goal] = await db('goals')
      .insert({
        employee_id: employeeId,
        cycle_id: data.cycleId || null,
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
      })
      .returning('*');
    return goal;
  },

  async updateGoal(id: string, data: any) {
    const [goal] = await db('goals')
      .where({ id })
      .update({
        cycle_id: data.cycleId,
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        updated_at: db.fn.now(),
      })
      .returning('*');
    if (!goal) throw new AppError(404, 'Goal not found');
    return goal;
  },

  async deleteGoal(id: string) {
    const deleted = await db('goals').where({ id }).del();
    if (!deleted) throw new AppError(404, 'Goal not found');
  },

  async createKeyResult(data: any) {
    const [kr] = await db('key_results')
      .insert({
        goal_id: data.goalId,
        title: data.title,
        target_value: data.targetValue,
        current_value: data.currentValue,
        unit: data.unit,
      })
      .returning('*');
    await performanceService._recalculateGoalCompletion(data.goalId);
    return kr;
  },

  async updateKeyResult(id: string, currentValue: number) {
    return await db.transaction(async (trx) => {
      const [kr] = await trx('key_results')
        .where({ id })
        .update({ current_value: currentValue, updated_at: db.fn.now() })
        .returning('*');
      if (!kr) throw new AppError(404, 'Key Result not found');
      
      const krs = await trx('key_results').where({ goal_id: kr.goal_id });
      let completion = 0;
      if (krs.length > 0) {
        let sum = 0;
        krs.forEach(k => {
          sum += Math.min(100, Math.max(0, (k.current_value / k.target_value) * 100));
        });
        completion = sum / krs.length;
      }
      
      await trx('goals')
        .where({ id: kr.goal_id })
        .update({ completion_percentage: completion, updated_at: db.fn.now() });
        
      return kr;
    });
  },

  async deleteKeyResult(id: string) {
    const kr = await db('key_results').where({ id }).first();
    if (!kr) throw new AppError(404, 'Key Result not found');
    await db('key_results').where({ id }).del();
    await performanceService._recalculateGoalCompletion(kr.goal_id);
  },

  async _recalculateGoalCompletion(goalId: string) {
    const krs = await db('key_results').where({ goal_id: goalId });
    let completion = 0;
    if (krs.length > 0) {
      let sum = 0;
      krs.forEach(k => {
        sum += Math.min(100, Math.max(0, (k.current_value / k.target_value) * 100));
      });
      completion = sum / krs.length;
    }
    await db('goals')
      .where({ id: goalId })
      .update({ completion_percentage: completion, updated_at: db.fn.now() });
  },

  // ─── Dashboard ───────────────────────────────────────────────────────
  async getDepartmentDashboard(cycleId: string) {
    // Return array grouped by department name
    const query = `
      SELECT 
        d.name as department_name,
        COUNT(a.id) as total_appraisals,
        SUM(CASE WHEN a.status = 'acknowledged' THEN 1 ELSE 0 END) as completed_appraisals,
        AVG(g.completion_percentage) as avg_goal_completion
      FROM departments d
      JOIN employees e ON e.department_id = d.id
      LEFT JOIN appraisals a ON a.employee_id = e.id AND a.cycle_id = ?
      LEFT JOIN goals g ON g.employee_id = e.id AND (g.cycle_id = ? OR g.cycle_id IS NULL)
      GROUP BY d.name
    `;

    const result = await db.raw(query, [cycleId, cycleId]);
    return result.rows.map((r: any) => ({
      departmentName: r.department_name,
      totalAppraisals: parseInt(r.total_appraisals),
      completedAppraisals: parseInt(r.completed_appraisals),
      avgGoalCompletion: parseFloat(r.avg_goal_completion || '0')
    }));
  }
};

async function paginateQuery(query: any, page: number, limit: number) {
  const result = await query.clone().clearSelect().count('* as total').first();
  const totalItems = parseInt((result as any).total);
  const data = await query.offset((page - 1) * limit).limit(limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}
