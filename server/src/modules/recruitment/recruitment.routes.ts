import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const recruitmentRouter = Router();
recruitmentRouter.use(authenticate);

const requisitionSchema = z.object({
  title: z.string().min(1).max(200),
  departmentId: z.string().uuid(),
  headcount: z.number().int().min(1).default(1),
  closingDate: z.string().date().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
});

const candidateSchema = z.object({
  requisitionId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  source: z.string().max(50).optional(),
  notes: z.string().optional(),
});

const stageSchema = z.object({
  stage: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
  outcome: z.string().optional(),
});

const interviewSchema = z.object({
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).default(60),
  interviewers: z.array(z.string().uuid()),
  type: z.enum(['phone', 'video', 'in_person', 'technical']).default('video'),
  notes: z.string().optional(),
});

const offerSchema = z.object({
  salary: z.number().positive(),
  currency: z.string().default('GBP'),
  startDate: z.string().date(),
  expiresAt: z.string().date().optional(),
  content: z.string().min(1),
});

// Requisitions
recruitmentRouter.get('/requisitions', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const query = db('job_requisitions')
    .whereNull('deleted_at')
    .join('departments', 'job_requisitions.department_id', 'departments.id')
    .select('job_requisitions.*', 'departments.name as department_name');
  const [{ count }] = await query.clone().count('job_requisitions.id as count');
  const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

recruitmentRouter.post('/requisitions', authorize('hr_manager', 'super_admin'),
  validate(requisitionSchema), asyncHandler(async (req, res) => {
    const [r] = await db('job_requisitions').insert({
      id: uuidv4(), ...req.body,
      department_id: req.body.departmentId,
      closing_date: req.body.closingDate,
      created_by: req.user!.id, status: 'open',
    }).returning('*');
    sendSuccess(res, r, 201);
  }),
);

recruitmentRouter.put('/requisitions/:id', authorize('hr_manager', 'super_admin'),
  validate(requisitionSchema.partial()), asyncHandler(async (req, res) => {
    const [r] = await db('job_requisitions').where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() }).returning('*');
    if (!r) throw new NotFoundError('Requisition');
    sendSuccess(res, r);
  }),
);

// Candidates
recruitmentRouter.get('/candidates', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { requisitionId, stage } = req.query;
  const query = db('candidates').whereNull('deleted_at')
    .join('job_requisitions', 'candidates.requisition_id', 'job_requisitions.id')
    .select('candidates.*', 'job_requisitions.title as requisition_title');
  if (requisitionId) query.where('candidates.requisition_id', requisitionId as string);
  if (stage) query.where('candidates.current_stage', stage as string);
  const [{ count }] = await query.clone().count('candidates.id as count');
  const data = await query.orderBy('candidates.created_at', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

recruitmentRouter.post('/candidates', authorize('hr_manager', 'super_admin'),
  validate(candidateSchema), asyncHandler(async (req, res) => {
    const [c] = await db('candidates').insert({
      id: uuidv4(),
      requisition_id: req.body.requisitionId,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      source: req.body.source,
      notes: req.body.notes,
      current_stage: 'applied',
    }).returning('*');

    // Record initial stage
    await db('candidate_pipeline_stages').insert({
      id: uuidv4(), candidate_id: c.id,
      stage: 'applied', changed_by: req.user!.id,
    });

    sendSuccess(res, c, 201);
  }),
);

recruitmentRouter.get('/candidates/:id', asyncHandler(async (req, res) => {
  const candidate = await db('candidates').where({ id: req.params.id })
    .whereNull('deleted_at').first();
  if (!candidate) throw new NotFoundError('Candidate');
  const stages = await db('candidate_pipeline_stages')
    .where({ candidate_id: req.params.id }).orderBy('entered_at');
  const interviews = await db('interviews')
    .where({ candidate_id: req.params.id }).whereNull('deleted_at');
  sendSuccess(res, { ...candidate, stages, interviews });
}));

recruitmentRouter.put('/candidates/:id/stage', authorize('hr_manager', 'super_admin'),
  validate(stageSchema), asyncHandler(async (req, res) => {
    const { stage, notes, outcome } = req.body;
    // Exit current stage
    await db('candidate_pipeline_stages')
      .where({ candidate_id: req.params.id }).whereNull('exited_at')
      .update({ exited_at: new Date(), outcome, notes });
    // Enter new stage
    await db('candidate_pipeline_stages').insert({
      id: uuidv4(), candidate_id: req.params.id,
      stage, notes, changed_by: req.user!.id,
    });
    const [c] = await db('candidates').where({ id: req.params.id })
      .update({ current_stage: stage, updated_at: new Date() }).returning('*');
    sendSuccess(res, c);
  }),
);

// Interviews
recruitmentRouter.post('/candidates/:id/interviews', authorize('hr_manager', 'super_admin', 'line_manager'),
  validate(interviewSchema), asyncHandler(async (req, res) => {
    const [i] = await db('interviews').insert({
      id: uuidv4(),
      candidate_id: req.params.id,
      scheduled_at: req.body.scheduledAt,
      duration_minutes: req.body.durationMinutes,
      interviewers: req.body.interviewers,
      type: req.body.type,
      notes: req.body.notes,
      outcome: 'pending',
    }).returning('*');
    sendSuccess(res, i, 201);
  }),
);

recruitmentRouter.put('/candidates/:id/interviews/:interviewId',
  authorize('hr_manager', 'super_admin', 'line_manager'),
  asyncHandler(async (req, res) => {
    const [i] = await db('interviews').where({ id: req.params.interviewId })
      .update({ ...req.body, updated_at: new Date() }).returning('*');
    if (!i) throw new NotFoundError('Interview');
    sendSuccess(res, i);
  }),
);

// Offer Letters  
recruitmentRouter.post('/candidates/:id/offer', authorize('hr_manager', 'super_admin'),
  validate(offerSchema), asyncHandler(async (req, res) => {
    const [offer] = await db('offer_letters').insert({
      id: uuidv4(),
      candidate_id: req.params.id,
      content: req.body.content,
      salary: req.body.salary,
      currency: req.body.currency,
      start_date: req.body.startDate,
      expires_at: req.body.expiresAt,
      status: 'draft',
    }).returning('*');
    sendSuccess(res, offer, 201);
  }),
);

// Convert candidate to employee (hire)
recruitmentRouter.post('/candidates/:id/convert', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const candidate = await db('candidates').where({ id: req.params.id }).first();
    if (!candidate) throw new NotFoundError('Candidate');
    // Mark candidate as hired
    await db('candidates').where({ id: req.params.id })
      .update({ current_stage: 'hired', updated_at: new Date() });
    // Stub: actual employee creation should be called via employee service
    sendSuccess(res, { message: 'Candidate marked as hired. Create employee record to complete onboarding.', candidateId: req.params.id });
  }),
);
