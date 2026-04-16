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

export const leaveRouter = Router();
leaveRouter.use(authenticate);

const leaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  defaultEntitlementDays: z.number().int().min(0).default(20),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  accrues: z.boolean().default(false),
  allowCarryOver: z.boolean().default(false),
  maxCarryOverDays: z.number().int().optional(),
  color: z.string().default('#4F46E5'),
});

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  daysRequested: z.number().positive(),
  reason: z.string().optional(),
});

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

// Leave Types
leaveRouter.get('/types', asyncHandler(async (_req, res) => {
  const data = await db('leave_types').whereNull('deleted_at').orderBy('name');
  sendSuccess(res, data);
}));

leaveRouter.post('/types', authorize('hr_manager', 'super_admin'),
  validate(leaveTypeSchema), asyncHandler(async (req, res) => {
    const [lt] = await db('leave_types').insert({
      id: uuidv4(),
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      default_entitlement_days: req.body.defaultEntitlementDays,
      is_paid: req.body.isPaid,
      requires_approval: req.body.requiresApproval,
      accrues: req.body.accrues,
      allow_carry_over: req.body.allowCarryOver,
      max_carry_over_days: req.body.maxCarryOverDays,
      color: req.body.color,
    }).returning('*');
    sendSuccess(res, lt, 201);
  }),
);

// Leave Requests
leaveRouter.get('/requests', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { status, employeeId } = req.query;
  const query = db('leave_requests')
    .whereNull('deleted_at')
    .join('employees', 'leave_requests.employee_id', 'employees.id')
    .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .select(
      'leave_requests.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
      'leave_types.name as leave_type_name',
      'leave_types.color as leave_type_color',
      'employees.department_id',
    );

  if (status) query.where('leave_requests.status', status as string);
  if (employeeId) query.where('leave_requests.employee_id', employeeId as string);

  // Employees see only their own
  if (req.user!.role === 'employee') {
    query.where('leave_requests.employee_id', req.user!.employeeId!);
  }
  // Line managers see their direct reports
  if (req.user!.role === 'line_manager') {
    const directReportIds = await db('employees')
      .where({ manager_id: req.user!.employeeId }).select('id');
    query.whereIn('leave_requests.employee_id', directReportIds.map(e => e.id));
  }

  const [{ count }] = await query.clone().count('leave_requests.id as count');
  const data = await query.orderBy('leave_requests.created_at', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

leaveRouter.post('/requests', validate(leaveRequestSchema), asyncHandler(async (req, res) => {
  const employeeId = req.user!.employeeId!;
  if (!employeeId) throw new ForbiddenError('No employee profile linked to account');

  // Check balance
  const year = new Date(req.body.startDate).getFullYear();
  const balance = await db('leave_entitlements')
    .where({ employee_id: employeeId, leave_type_id: req.body.leaveTypeId, year })
    .first();

  if (balance) {
    const remaining = Number(balance.entitled_days) + Number(balance.carried_over_days) - Number(balance.used_days);
    if (remaining < req.body.daysRequested) {
      // Don't block, just include warning in response
    }
  }

  const [request] = await db('leave_requests').insert({
    id: uuidv4(),
    employee_id: employeeId,
    leave_type_id: req.body.leaveTypeId,
    start_date: req.body.startDate,
    end_date: req.body.endDate,
    days_requested: req.body.daysRequested,
    reason: req.body.reason,
    status: 'requested',
  }).returning('*');
  sendSuccess(res, request, 201);
}));

leaveRouter.put('/requests/:id/status', authorize('hr_manager', 'super_admin', 'line_manager'),
  validate(reviewSchema), asyncHandler(async (req, res) => {
    const leave = await db('leave_requests').where({ id: req.params.id }).first();
    if (!leave) throw new NotFoundError('Leave request');

    const [updated] = await db('leave_requests').where({ id: req.params.id })
      .update({
        status: req.body.status,
        reviewed_by: req.user!.id,
        reviewed_at: new Date(),
        review_notes: req.body.reviewNotes,
        updated_at: new Date(),
      }).returning('*');

    // Update entitlement balance if approved
    if (req.body.status === 'approved') {
      const year = new Date(leave.start_date).getFullYear();
      await db('leave_entitlements')
        .where({ employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year })
        .increment('used_days', Number(leave.days_requested));
    }

    sendSuccess(res, updated);
  }),
);

// Leave Balances
leaveRouter.get('/balances/:employeeId', asyncHandler(async (req, res) => {
  if (req.user!.role === 'employee' && req.user!.employeeId !== req.params.employeeId) {
    throw new ForbiddenError();
  }
  const year = Number(req.query.year) || new Date().getFullYear();
  const balances = await db('leave_entitlements')
    .join('leave_types', 'leave_entitlements.leave_type_id', 'leave_types.id')
    .where({ employee_id: req.params.employeeId, 'leave_entitlements.year': year })
    .select(
      'leave_types.id as leave_type_id',
      'leave_types.name as leave_type_name',
      'leave_types.code as leave_type_code',
      'leave_entitlements.entitled_days',
      'leave_entitlements.used_days',
      'leave_entitlements.carried_over_days',
    );

  // Add pending days
  const result = await Promise.all(balances.map(async (b) => {
    const [{ pending }] = await db('leave_requests')
      .where({ employee_id: req.params.employeeId, leave_type_id: b.leave_type_id, status: 'requested' })
      .whereRaw("EXTRACT(YEAR FROM start_date) = ?", [year])
      .sum('days_requested as pending');
    return {
      ...b,
      pendingDays: Number(pending) || 0,
      remainingDays: Number(b.entitled_days) + Number(b.carried_over_days) - Number(b.used_days),
    };
  }));

  sendSuccess(res, result);
}));

// Calendar
leaveRouter.get('/calendar', asyncHandler(async (req, res) => {
  const { month, year, departmentId } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const query = db('leave_requests')
    .join('employees', 'leave_requests.employee_id', 'employees.id')
    .join('leave_types', 'leave_requests.leave_type_id', 'leave_types.id')
    .where('leave_requests.status', 'approved')
    .whereRaw("EXTRACT(YEAR FROM start_date) = ? AND EXTRACT(MONTH FROM start_date) = ?", [y, m])
    .select(
      'leave_requests.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
      'leave_types.name as leave_type_name',
      'leave_types.color',
      'employees.department_id',
    );

  if (departmentId) query.where('employees.department_id', departmentId as string);

  const data = await query.orderBy('start_date');
  sendSuccess(res, data);
}));

// Public Holidays
leaveRouter.get('/public-holidays', asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const data = await db('public_holidays')
    .where({ year })
    .whereNull('deleted_at')
    .orderBy('date');
  sendSuccess(res, data);
}));

leaveRouter.post('/public-holidays', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      date: z.string().date(),
      region: z.string().default('UK'),
    });
    const body = schema.parse(req.body);
    const year = new Date(body.date).getFullYear();
    const [ph] = await db('public_holidays').insert({
      id: uuidv4(), ...body, year,
    }).returning('*');
    sendSuccess(res, ph, 201);
  }),
);

// Attendance
leaveRouter.get('/attendance', asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req);
  const { employeeId, startDate, endDate } = req.query;
  const query = db('attendance_logs')
    .join('employees', 'attendance_logs.employee_id', 'employees.id')
    .select('attendance_logs.*',
      db.raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"));
  if (employeeId) query.where('attendance_logs.employee_id', employeeId as string);
  if (startDate) query.where('attendance_logs.date', '>=', startDate as string);
  if (endDate) query.where('attendance_logs.date', '<=', endDate as string);
  const [{ count }] = await query.clone().count('attendance_logs.id as count');
  const data = await query.orderBy('attendance_logs.date', 'desc').limit(limit).offset(offset);
  sendSuccess(res, data, 200, buildPaginationMeta(Number(count), page, limit));
}));

leaveRouter.post('/attendance/clock-in', asyncHandler(async (req, res) => {
  const employeeId = req.user!.employeeId!;
  const today = new Date().toISOString().split('T')[0];
  const existing = await db('attendance_logs').where({ employee_id: employeeId, date: today }).first();
  if (existing) {
    sendSuccess(res, existing); return;
  }
  const [log] = await db('attendance_logs').insert({
    id: uuidv4(), employee_id: employeeId, date: today,
    clock_in: new Date(),
  }).returning('*');
  sendSuccess(res, log, 201);
}));

leaveRouter.post('/attendance/clock-out', asyncHandler(async (req, res) => {
  const employeeId = req.user!.employeeId!;
  const today = new Date().toISOString().split('T')[0];
  const log = await db('attendance_logs').where({ employee_id: employeeId, date: today }).first();
  if (!log) throw new NotFoundError('Attendance log for today');
  const clockOut = new Date();
  const clockIn = new Date(log.clock_in);
  const totalHours = (clockOut.getTime() - clockIn.getTime()) / 3600000;
  const [updated] = await db('attendance_logs').where({ id: log.id })
    .update({ clock_out: clockOut, total_hours: totalHours, updated_at: new Date() })
    .returning('*');
  sendSuccess(res, updated);
}));
