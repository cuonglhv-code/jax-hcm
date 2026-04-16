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

export const learningRouter = Router();
learningRouter.use(authenticate);

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['internal', 'external', 'online', 'certification']).default('internal'),
  durationHours: z.number().positive(),
  provider: z.string().max(150).optional(),
  isMandatory: z.boolean().default(false),
  expiresAfterMonths: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

const enrolSchema = z.object({ employeeId: z.string().uuid() });

const planSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  targetRole: z.string().max(150).optional(),
  courseIds: z.array(z.string().uuid()),
});

// Courses
learningRouter.get('/courses', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { type, isMandatory, search } = req.query;
  const query = db('courses').whereNull('deleted_at');
  if (type) query.where({ type });
  if (isMandatory !== undefined) query.where({ is_mandatory: isMandatory === 'true' });
  if (search) query.whereILike('title', `%${search}%`);
  const [{ count }] = await query.clone().count('id as count');
  const data = await query.orderBy('title').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

learningRouter.post('/courses', authorize('hr_manager', 'super_admin'),
  validate(courseSchema), asyncHandler(async (req, res) => {
    const [c] = await db('courses').insert({
      id: uuidv4(),
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      duration_hours: req.body.durationHours,
      provider: req.body.provider,
      is_mandatory: req.body.isMandatory,
      expires_after_months: req.body.expiresAfterMonths,
      tags: req.body.tags ? JSON.stringify(req.body.tags) : null,
    }).returning('*');
    sendSuccess(res, c, 201);
  }),
);

learningRouter.put('/courses/:id', authorize('hr_manager', 'super_admin'),
  validate(courseSchema.partial()), asyncHandler(async (req, res) => {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (req.body.title) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.type) updates.type = req.body.type;
    if (req.body.durationHours) updates.duration_hours = req.body.durationHours;
    if (req.body.provider !== undefined) updates.provider = req.body.provider;
    if (req.body.isMandatory !== undefined) updates.is_mandatory = req.body.isMandatory;
    if (req.body.expiresAfterMonths !== undefined) updates.expires_after_months = req.body.expiresAfterMonths;
    const [c] = await db('courses').where({ id: req.params.id }).update(updates).returning('*');
    if (!c) throw new NotFoundError('Course');
    sendSuccess(res, c);
  }),
);

// Enrolments
learningRouter.get('/courses/:id/enrolments', asyncHandler(async (req, res) => {
  const data = await db('course_enrolments')
    .join('employees', 'course_enrolments.employee_id', 'employees.id')
    .where({ course_id: req.params.id })
    .whereNull('deleted_at')
    .select('course_enrolments.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"));
  sendSuccess(res, data);
}));

learningRouter.post('/courses/:id/enrol', validate(enrolSchema),
  asyncHandler(async (req, res) => {
    const course = await db('courses').where({ id: req.params.id }).first();
    if (!course) throw new NotFoundError('Course');

    const [enrolment] = await db('course_enrolments').insert({
      id: uuidv4(),
      course_id: req.params.id,
      employee_id: req.body.employeeId,
      status: 'enrolled',
      enrolled_at: new Date(),
      expires_at: course.expires_after_months
        ? new Date(Date.now() + course.expires_after_months * 30 * 24 * 3600 * 1000)
        : null,
    }).returning('*').catch(() => {
      throw new Error('Employee already enrolled in this course');
    });
    sendSuccess(res, enrolment, 201);
  }),
);

learningRouter.put('/enrolments/:id/status', asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['enrolled', 'in_progress', 'completed', 'cancelled']),
    score: z.number().min(0).max(100).optional(),
  });
  const { status, score } = schema.parse(req.body);
  const enrolment = await db('course_enrolments').where({ id: req.params.id }).first();
  if (!enrolment) throw new NotFoundError('Enrolment');

  const updates: Record<string, unknown> = { status, updated_at: new Date() };
  if (status === 'in_progress') updates.started_at = new Date();
  if (status === 'completed') {
    updates.completed_at = new Date();
    if (score !== undefined) updates.score = score;

    // Issue certificate
    const course = await db('courses').where({ id: enrolment.course_id }).first();
    const [cert] = await db('training_certificates').insert({
      id: uuidv4(),
      enrolment_id: req.params.id,
      employee_id: enrolment.employee_id,
      course_id: enrolment.course_id,
      issued_at: new Date(),
      expires_at: course?.expires_after_months
        ? new Date(Date.now() + course.expires_after_months * 30 * 24 * 3600 * 1000)
        : null,
    }).returning('*');

    updates.certificate_id = cert.id;
  }

  const [updated] = await db('course_enrolments').where({ id: req.params.id }).update(updates).returning('*');
  sendSuccess(res, updated);
}));

// Certificate endpoint
learningRouter.get('/enrolments/:id/certificate', asyncHandler(async (req, res) => {
  const cert = await db('training_certificates')
    .join('course_enrolments', 'training_certificates.enrolment_id', 'course_enrolments.id')
    .join('employees', 'training_certificates.employee_id', 'employees.id')
    .join('courses', 'training_certificates.course_id', 'courses.id')
    .where('training_certificates.enrolment_id', req.params.id)
    .select(
      'training_certificates.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
      'courses.title as course_title',
      'courses.provider',
      'courses.duration_hours',
    )
    .first();
  if (!cert) throw new NotFoundError('Certificate');
  sendSuccess(res, cert);
}));

// Learning Plans
learningRouter.get('/plans', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const query = db('learning_plans').whereNull('deleted_at');
  const [{ count }] = await query.clone().count('id as count');
  const plans = await query.orderBy('name').limit(limit).offset(offset);
  for (const p of plans) {
    p.courses = await db('learning_plan_courses')
      .join('courses', 'learning_plan_courses.course_id', 'courses.id')
      .where({ learning_plan_id: p.id })
      .select('courses.*', 'learning_plan_courses.order')
      .orderBy('learning_plan_courses.order');
  }
  sendSuccess(res, plans, 200, buildPaginationMeta(Number(count), page, limit));
}));

learningRouter.post('/plans', authorize('hr_manager', 'super_admin'),
  validate(planSchema), asyncHandler(async (req, res) => {
    const [plan] = await db('learning_plans').insert({
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description,
      target_role: req.body.targetRole,
      created_by: req.user!.id,
    }).returning('*');

    for (let i = 0; i < req.body.courseIds.length; i++) {
      await db('learning_plan_courses').insert({
        id: uuidv4(), learning_plan_id: plan.id,
        course_id: req.body.courseIds[i], order: i,
      });
    }
    sendSuccess(res, plan, 201);
  }),
);

learningRouter.post('/plans/:id/assign', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      employeeId: z.string().uuid(),
      dueDate: z.string().date().optional(),
    });
    const { employeeId, dueDate } = schema.parse(req.body);
    const [assign] = await db('learning_plan_assignments').insert({
      id: uuidv4(), learning_plan_id: req.params.id,
      employee_id: employeeId, assigned_by: req.user!.id,
      due_date: dueDate,
    }).returning('*');
    sendSuccess(res, assign, 201);
  }),
);

// Employee training history
learningRouter.get('/employees/:id/training-history', asyncHandler(async (req, res) => {
  const data = await db('course_enrolments')
    .join('courses', 'course_enrolments.course_id', 'courses.id')
    .leftJoin('training_certificates', 'course_enrolments.certificate_id', 'training_certificates.id')
    .where({ 'course_enrolments.employee_id': req.params.id })
    .whereNull('course_enrolments.deleted_at')
    .select(
      'course_enrolments.*',
      'courses.title as course_title',
      'courses.type as course_type',
      'courses.duration_hours',
      'courses.provider',
      'training_certificates.issued_at as certificate_issued_at',
      'training_certificates.expires_at as certificate_expires_at',
    )
    .orderBy('course_enrolments.enrolled_at', 'desc');
  sendSuccess(res, data);
}));

// Mandatory training alerts
learningRouter.get('/mandatory-training/alerts', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    const alerts = await db('courses')
      .where({ is_mandatory: true })
      .whereNull('deleted_at')
      .join('employees', (b) => b.whereNull('employees.deleted_at').where('employees.status', 'active'))
      .leftJoin('course_enrolments', function () {
        this.on('course_enrolments.course_id', '=', 'courses.id')
          .andOn('course_enrolments.employee_id', '=', 'employees.id')
          .andOnNull('course_enrolments.deleted_at');
      })
      .whereRaw('(course_enrolments.id IS NULL OR course_enrolments.status != ? OR course_enrolments.expires_at < ?)',
        ['completed', thirtyDaysFromNow])
      .select(
        'employees.id as employee_id',
        db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
        'courses.id as course_id',
        'courses.title as course_name',
        'course_enrolments.completed_at as last_completed_at',
        'course_enrolments.expires_at',
      );
    sendSuccess(res, alerts);
  }),
);
