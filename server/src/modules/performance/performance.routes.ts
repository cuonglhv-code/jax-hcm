import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const performanceRouter = Router();
performanceRouter.use(authenticate);

const cycleSchema = z.object({
  name: z.string().min(1).max(200),
  frequency: z.enum(['annual', 'bi_annual', 'quarterly']).default('annual'),
  startDate: z.string().date(),
  endDate: z.string().date(),
  selfAssessmentDeadline: z.string().date(),
  managerReviewDeadline: z.string().date(),
});

const goalSchema = z.object({
  objective: z.string().min(1).max(300),
  description: z.string().optional(),
  dueDate: z.string().date().optional(),
  cycleId: z.string().uuid().optional(),
});

const keyResultSchema = z.object({
  description: z.string().min(1).max(300),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(50).optional(),
});

const appraisalStatusSchema = z.object({
  status: z.enum(['submitted', 'reviewed', 'acknowledged']),
});

const responseSchema = z.object({
  questionId: z.string().uuid(),
  responderType: z.enum(['self', 'manager']),
  textResponse: z.string().optional(),
  numericResponse: z.number().optional(),
});

// Cycles
performanceRouter.get('/cycles', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const query = db('appraisal_cycles').whereNull('deleted_at');
  const [{ count }] = await query.clone().count('id as count');
  const data = await query.orderBy('start_date', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

performanceRouter.post('/cycles', authorize('hr_manager', 'super_admin'),
  validate(cycleSchema), asyncHandler(async (req, res) => {
    const [cycle] = await db('appraisal_cycles').insert({
      id: uuidv4(),
      name: req.body.name,
      frequency: req.body.frequency,
      start_date: req.body.startDate,
      end_date: req.body.endDate,
      self_assessment_deadline: req.body.selfAssessmentDeadline,
      manager_review_deadline: req.body.managerReviewDeadline,
      is_active: false,
    }).returning('*');
    sendSuccess(res, cycle, 201);
  }),
);

performanceRouter.put('/cycles/:id', authorize('hr_manager', 'super_admin'),
  validate(cycleSchema.partial()), asyncHandler(async (req, res) => {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (req.body.name) updates.name = req.body.name;
    if (req.body.startDate) updates.start_date = req.body.startDate;
    if (req.body.endDate) updates.end_date = req.body.endDate;
    if (req.body.selfAssessmentDeadline) updates.self_assessment_deadline = req.body.selfAssessmentDeadline;
    if (req.body.managerReviewDeadline) updates.manager_review_deadline = req.body.managerReviewDeadline;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;
    const [c] = await db('appraisal_cycles').where({ id: req.params.id }).update(updates).returning('*');
    if (!c) throw new NotFoundError('Appraisal cycle');
    sendSuccess(res, c);
  }),
);

// Appraisals
performanceRouter.get('/appraisals', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { cycleId, employeeId, status } = req.query;
  const query = db('appraisals')
    .whereNull('deleted_at')
    .join('employees', 'appraisals.employee_id', 'employees.id')
    .join('appraisal_cycles', 'appraisals.cycle_id', 'appraisal_cycles.id')
    .select(
      'appraisals.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
      'appraisal_cycles.name as cycle_name',
    );
  if (cycleId) query.where('appraisals.cycle_id', cycleId as string);
  if (employeeId) query.where('appraisals.employee_id', employeeId as string);
  if (status) query.where('appraisals.status', status as string);
  // Line managers see only their team
  if (req.user!.role === 'line_manager') {
    query.where('appraisals.manager_id', req.user!.employeeId!);
  }
  if (req.user!.role === 'employee') {
    query.where('appraisals.employee_id', req.user!.employeeId!);
  }
  const [{ count }] = await query.clone().count('appraisals.id as count');
  const data = await query.orderBy('appraisals.created_at', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

performanceRouter.post('/appraisals', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      cycleId: z.string().uuid(),
      employeeId: z.string().uuid(),
      managerId: z.string().uuid(),
    });
    const body = schema.parse(req.body);
    const [a] = await db('appraisals').insert({
      id: uuidv4(), cycle_id: body.cycleId,
      employee_id: body.employeeId, manager_id: body.managerId,
      status: 'draft',
    }).returning('*');
    sendSuccess(res, a, 201);
  }),
);

performanceRouter.put('/appraisals/:id/status', validate(appraisalStatusSchema),
  asyncHandler(async (req, res) => {
    const appraisal = await db('appraisals').where({ id: req.params.id }).first();
    if (!appraisal) throw new NotFoundError('Appraisal');
    const { status } = req.body;
    const updates: Record<string, unknown> = { status, updated_at: new Date() };
    if (status === 'submitted') updates.self_assessment_submitted_at = new Date();
    if (status === 'reviewed') updates.manager_review_submitted_at = new Date();
    if (status === 'acknowledged') updates.acknowledged_at = new Date();
    const [updated] = await db('appraisals').where({ id: req.params.id }).update(updates).returning('*');
    sendSuccess(res, updated);
  }),
);

// Assessment responses
performanceRouter.post('/appraisals/:id/responses', validate(z.array(responseSchema)),
  asyncHandler(async (req, res) => {
    const responses = req.body.map((r: Record<string, unknown>) => ({
      id: uuidv4(),
      appraisal_id: req.params.id,
      question_id: r.questionId,
      responder_type: r.responderType,
      text_response: r.textResponse,
      numeric_response: r.numericResponse,
    }));
    await db('assessment_responses').insert(responses)
      .onConflict(['appraisal_id', 'question_id', 'responder_type'])
      .merge();
    sendSuccess(res, { message: 'Responses saved', count: responses.length });
  }),
);

// Goals
performanceRouter.get('/goals', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  let employeeId = req.query.employeeId as string;
  if (req.user!.role === 'employee') employeeId = req.user!.employeeId!;
  const query = db('goals').whereNull('deleted_at');
  if (employeeId) query.where({ employee_id: employeeId });
  const [{ count }] = await query.clone().count('id as count');
  const goals = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
  for (const g of goals) {
    g.keyResults = await db('key_results').where({ goal_id: g.id });
  }
  sendSuccess(res, goals, 200, buildPaginationMeta(Number(count), page, limit));
}));

performanceRouter.post('/goals', validate(goalSchema.extend({ employeeId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const [g] = await db('goals').insert({
      id: uuidv4(),
      employee_id: req.body.employeeId,
      cycle_id: req.body.cycleId,
      objective: req.body.objective,
      description: req.body.description,
      due_date: req.body.dueDate,
      progress: 0,
      status: 'not_started',
    }).returning('*');
    sendSuccess(res, g, 201);
  }),
);

performanceRouter.put('/goals/:id', validate(goalSchema.partial().extend({
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).optional(),
})), asyncHandler(async (req, res) => {
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (req.body.objective) updates.objective = req.body.objective;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.dueDate !== undefined) updates.due_date = req.body.dueDate;
  if (req.body.progress !== undefined) updates.progress = req.body.progress;
  if (req.body.status !== undefined) updates.status = req.body.status;
  const [g] = await db('goals').where({ id: req.params.id }).update(updates).returning('*');
  if (!g) throw new NotFoundError('Goal');
  sendSuccess(res, g);
}));

performanceRouter.post('/goals/:id/key-results', validate(keyResultSchema),
  asyncHandler(async (req, res) => {
    const [kr] = await db('key_results').insert({
      id: uuidv4(), goal_id: req.params.id, ...req.body,
      target_value: req.body.targetValue, current_value: req.body.currentValue,
    }).returning('*');
    sendSuccess(res, kr, 201);
  }),
);

performanceRouter.put('/goals/:id/key-results/:krId',
  asyncHandler(async (req, res) => {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (req.body.currentValue !== undefined) updates.current_value = req.body.currentValue;
    if (req.body.description) updates.description = req.body.description;
    if (req.body.completedAt) updates.completed_at = req.body.completedAt;
    const [kr] = await db('key_results').where({ id: req.params.krId }).update(updates).returning('*');
    if (!kr) throw new NotFoundError('Key result');
    sendSuccess(res, kr);
  }),
);

// Department performance dashboard
performanceRouter.get('/dashboard/:departmentId', authorize('hr_manager', 'super_admin', 'line_manager'),
  asyncHandler(async (req, res) => {
    const stats = await db('appraisals')
      .join('employees', 'appraisals.employee_id', 'employees.id')
      .where('employees.department_id', req.params.departmentId)
      .whereNull('appraisals.deleted_at')
      .groupBy('appraisals.status')
      .select('appraisals.status', db.raw('count(*) as count'), db.raw('avg(appraisals.overall_rating) as avg_rating'));
    sendSuccess(res, stats);
  }),
);
