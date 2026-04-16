import { db } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
// Note: Some models need proper types, using any/implicit where not available
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

const DEFAULT_ONBOARDING_TASKS = [
  'Complete employment contract signing',
  'Submit ID and right-to-work documents',
  'IT equipment and system access setup',
  'Complete company induction training',
  'Meet with line manager for role briefing',
  'Set up payroll and bank details',
  'Review and sign company policies',
];

export const recruitmentService = {
  // ─── Requisitions ────────────────────────────────────────────────────
  async listRequisitions(filters: { status?: string }, page = 1, limit = 20) {
    const query = db('job_requisitions')
      .join('departments', 'job_requisitions.department_id', 'departments.id')
      .select('job_requisitions.*', 'departments.name as department_name')
      .whereNull('job_requisitions.deleted_at')
      .orderBy('job_requisitions.created_at', 'desc');

    if (filters.status) {
      query.where('job_requisitions.status', filters.status);
    }

    const { data, pagination } = await paginateQuery(query, page, limit);
    return { data, total: pagination.total };
  },

  async getRequisition(id: string) {
    const req = await db('job_requisitions')
      .join('departments', 'job_requisitions.department_id', 'departments.id')
      .select('job_requisitions.*', 'departments.name as department_name')
      .where('job_requisitions.id', id)
      .whereNull('job_requisitions.deleted_at')
      .first();
    if (!req) throw new AppError(404, 'Requisition not found');
    return req;
  },

  async createRequisition(data: any, createdById: string) {
    const [req] = await db('job_requisitions')
      .insert({
        title: data.title,
        department_id: data.departmentId,
        headcount: data.headcount,
        description: data.description,
        closing_date: data.closingDate,
        status: data.status,
        created_by_id: createdById,
      })
      .returning('*');
    return req;
  },

  async updateRequisition(id: string, data: any) {
    const [req] = await db('job_requisitions')
      .where({ id })
      .update({
        title: data.title,
        department_id: data.departmentId,
        headcount: data.headcount,
        description: data.description,
        closing_date: data.closingDate,
        status: data.status,
        updated_at: db.fn.now(),
      })
      .returning('*');
    if (!req) throw new AppError(404, 'Requisition not found');
    return req;
  },

  async closeRequisition(id: string) {
    const updated = await db('job_requisitions')
      .where({ id })
      .update({ status: 'closed', updated_at: db.fn.now() });
    if (!updated) throw new AppError(404, 'Requisition not found');
  },

  // ─── Candidates ──────────────────────────────────────────────────────
  async listCandidates(page = 1, limit = 20, search?: string) {
    const query = db('candidates')
      .select('*')
      .orderBy('created_at', 'desc');

    if (search) {
      query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    const { data, pagination } = await paginateQuery(query, page, limit);
    return { data, total: pagination.total };
  },

  async getCandidate(id: string) {
    const candidate = await db('candidates').where({ id }).first();
    if (!candidate) throw new AppError(404, 'Candidate not found');
    return candidate;
  },

  async createCandidate(data: any) {
    const [candidate] = await db('candidates')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      })
      .returning('*');
    return candidate;
  },

  async updateCandidate(id: string, data: any) {
    const [candidate] = await db('candidates')
      .where({ id })
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        updated_at: db.fn.now(),
      })
      .returning('*');
    if (!candidate) throw new AppError(404, 'Candidate not found');
    return candidate;
  },

  // ─── Applications / Pipeline ─────────────────────────────────────────
  async getApplicationsByRequisition(requisitionId: string) {
    const apps = await db('applications')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .select('applications.*', 'candidates.first_name', 'candidates.last_name', 'candidates.email')
      .where('applications.requisition_id', requisitionId)
      .orderBy('applications.created_at', 'asc');
    
    // Group by stage for Kanban
    const grouped: any = {
      applied: [], screening: [], interview: [], offer: [], hired: [], rejected: []
    };
    for (const app of apps) {
      if (grouped[app.stage]) {
        grouped[app.stage].push(app);
      }
    }
    return grouped;
  },

  async getApplicationsByCandidate(candidateId: string) {
    return db('applications')
      .join('job_requisitions', 'applications.requisition_id', 'job_requisitions.id')
      .select('applications.*', 'job_requisitions.title as requisition_title')
      .where('applications.candidate_id', candidateId);
  },

  async createApplication(data: any) {
    const [app] = await db('applications')
      .insert({
        candidate_id: data.candidateId,
        requisition_id: data.requisitionId,
        notes: data.notes,
      })
      .returning('*');
    return app;
  },

  async advanceStage(applicationId: string, stage: string, notes?: string) {
    const stages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    
    return await db.transaction(async (trx) => {
      const app = await trx('applications').where({ id: applicationId }).first();
      if (!app) throw new AppError(404, 'Application not found');

      if (stage !== 'rejected') {
        const currentIndex = stages.indexOf(app.stage);
        const nextIndex = stages.indexOf(stage);
        if (nextIndex <= currentIndex && app.stage !== 'rejected' && stage !== 'rejected') {
           throw new AppError(400, 'Applications can only advance forward');
        }
      }

      const [updatedApp] = await trx('applications')
        .where({ id: applicationId })
        .update({
          stage,
          notes: notes || app.notes,
          updated_at: db.fn.now(),
        })
        .returning('*');

      if (stage === 'hired') {
        const reqStats = await trx('applications')
          .where({ requisition_id: updatedApp.requisition_id, stage: 'hired' })
          .count('id as hired_count')
          .first();
          
        const req = await trx('job_requisitions')
          .where({ id: updatedApp.requisition_id })
          .first();
          
        if (req && reqStats && parseInt(reqStats.hired_count as string, 10) >= req.headcount) {
          await trx('job_requisitions')
            .where({ id: req.id })
            .update({ status: 'closed', updated_at: db.fn.now() });
        }
      }

      return updatedApp;
    });
  },

  // ─── Interviews ──────────────────────────────────────────────────────
  async listInterviews(applicationId: string) {
    return db('interviews')
      .join('users', 'interviews.interviewer_id', 'users.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .select('interviews.*', 'employees.first_name as interviewer_first_name', 'employees.last_name as interviewer_last_name')
      .where('interviews.application_id', applicationId);
  },

  async createInterview(applicationId: string, data: any) {
    const [interview] = await db('interviews')
      .insert({
        application_id: applicationId,
        scheduled_at: data.scheduledAt,
        interviewer_id: data.interviewerId,
        notes: data.notes,
      })
      .returning('*');
    return interview;
  },

  async updateInterview(id: string, data: any) {
    const [interview] = await db('interviews')
      .where({ id })
      .update({
        scheduled_at: data.scheduledAt,
        interviewer_id: data.interviewerId,
        notes: data.notes,
        outcome: data.outcome,
        updated_at: db.fn.now(),
      })
      .returning('*');
    if (!interview) throw new AppError(404, 'Interview not found');
    return interview;
  },

  // ─── Offer Letters ───────────────────────────────────────────────────
  async createOfferLetter(applicationId: string, data: any) {
    const app = await db('applications').where({ id: applicationId }).first();
    if (!app) throw new AppError(404, 'Application not found');
    if (app.stage !== 'offer' && app.stage !== 'hired') {
      throw new AppError(400, 'Application must be in offer stage to create an offer letter');
    }

    const [offer] = await db('offer_letters')
      .insert({
        application_id: applicationId,
        salary: data.salary,
        currency: data.currency,
        start_date: data.startDate,
        expiry_date: data.expiryDate,
      })
      .returning('*');
    return offer;
  },

  async updateOfferStatus(id: string, status: string) {
    const offer = await db('offer_letters').where({ id }).first();
    if (!offer) throw new AppError(404, 'Offer letter not found');

    const validTransitions: Record<string, string[]> = {
      'draft': ['sent'],
      'sent': ['accepted', 'declined'],
    };

    if (!validTransitions[offer.status]?.includes(status)) {
      throw new AppError(400, `Cannot transition offer from ${offer.status} to ${status}`);
    }

    const [updated] = await db('offer_letters')
      .where({ id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');
    return updated;
  },

  // ─── Onboarding ──────────────────────────────────────────────────────
  async createOnboardingChecklist(employeeId: string) {
    return await db.transaction(async (trx) => {
      const [checklist] = await trx('onboarding_checklists')
        .insert({ employee_id: employeeId })
        .returning('*');

      const tasksToInsert = DEFAULT_ONBOARDING_TASKS.map(title => ({
        id: uuidv4(),
        checklist_id: checklist.id,
        title,
      }));

      await trx('onboarding_tasks').insert(tasksToInsert);

      const tasks = await trx('onboarding_tasks').where('checklist_id', checklist.id);
      return { ...checklist, tasks };
    });
  },

  async getOnboardingChecklist(employeeId: string) {
    const checklist = await db('onboarding_checklists')
      .where({ employee_id: employeeId })
      .first();
    if (!checklist) throw new AppError(404, 'Onboarding checklist not found');

    const tasks = await db('onboarding_tasks').where('checklist_id', checklist.id);
    return { ...checklist, tasks };
  },

  async updateTaskCompletion(taskId: string, completed: boolean) {
    const [task] = await db('onboarding_tasks')
      .where({ id: taskId })
      .update({ completed_at: completed ? db.fn.now() : null })
      .returning('*');
    if (!task) throw new AppError(404, 'Onboarding task not found');
    return task;
  },

  // ─── Convert candidate to employee ───────────────────────────────────
  async convertToEmployee(applicationId: string, data: any, _actorId: string) {
    return await db.transaction(async (trx) => {
      const app = await trx('applications').where({ id: applicationId }).first();
      if (!app) throw new AppError(404, 'Application not found');
      if (app.stage !== 'hired') throw new AppError(400, 'Application must be hired to convert');

      const candidate = await trx('candidates').where({ id: app.candidate_id }).first();
      if (!candidate) throw new AppError(404, 'Candidate not found');

      const randomPassword = Math.random().toString(36).slice(-8) + 'A1';
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const [user] = await trx('users')
        .insert({
          email: candidate.email,
          password_hash: passwordHash,
          role: 'employee',
          is_active: true,
        })
        .returning('*');

      const [employee] = await trx('employees')
        .insert({
          user_id: user.id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          phone: candidate.phone,
          department_id: data.departmentId,
          job_title_id: data.jobTitleId,
          manager_id: data.managerId || null,
          employment_type: data.employmentType,
          status: 'active',
          hire_date: data.hireDate, // CANONICAL: hire_date not start_date
        })
        .returning('*');

      await trx('offer_letters')
        .where({ application_id: applicationId, status: 'accepted' })
        .update({ employee_id: employee.id, updated_at: db.fn.now() });

      // Create onboarding checklist
      const [checklist] = await trx('onboarding_checklists')
        .insert({ employee_id: employee.id })
        .returning('*');

      const tasksToInsert = DEFAULT_ONBOARDING_TASKS.map(title => ({
        checklist_id: checklist.id,
        title,
      }));
      await trx('onboarding_tasks').insert(tasksToInsert);

      return employee;
    });
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
