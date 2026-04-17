import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { payrollService } from './payroll.service';
import { generatePayslipPDF } from './payslipPdf';
import { z } from 'zod';

export const payrollRouter = Router();
payrollRouter.use(authenticate);

const setSalarySchema = z.object({
  baseSalary: z.number().positive(),
  currency: z.string().default('GBP'),
  payFrequency: z.enum(['monthly', 'bi_weekly', 'weekly']).default('monthly'),
  effectiveDate: z.string().date(),
  reason: z.string().optional(),
});

const allowanceSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  isPercentage: z.boolean().default(false),
  recurring: z.boolean().default(true),
});

const createRunSchema = z.object({
  name: z.string().min(1),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
});

const statusSchema = z.object({
  status: z.enum(['reviewed', 'approved', 'paid']),
});

// Salary
payrollRouter.get('/employees/:id/salary', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const data = await payrollService.getSalary(req.params.id);
    sendSuccess(res, data);
  }),
);

payrollRouter.post('/employees/:id/salary', authorize('hr_manager', 'super_admin'),
  validate(setSalarySchema),
  asyncHandler(async (req, res) => {
    const record = await payrollService.setSalary(req.params.id, req.body, req.user as unknown as import('@hcm/shared').AuthUser);
    sendSuccess(res, record, 201);
  }),
);

payrollRouter.get('/employees/:id/compensation-history', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { data, meta } = await payrollService.getCompensationHistory(req.params.id, req);
    sendSuccess(res, data, 200, meta);
  }),
);

payrollRouter.get('/employees/:id/payslips',
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'employee' && req.user!.employeeId !== req.params.id) {
      res.status(403).json({ success: false, data: null, error: 'Forbidden' });
      return;
    }
    const { data, meta } = await payrollService.getEmployeePayslips(req.params.id, req);
    sendSuccess(res, data, 200, meta);
  }),
);

// Allowances / Deductions
payrollRouter.post('/employees/:id/allowances', authorize('hr_manager', 'super_admin'),
  validate(allowanceSchema),
  asyncHandler(async (req, res) => {
    const data = await payrollService.addAllowance(req.params.id, req.body);
    sendSuccess(res, data, 201);
  }),
);

payrollRouter.post('/employees/:id/deductions', authorize('hr_manager', 'super_admin'),
  validate(allowanceSchema),
  asyncHandler(async (req, res) => {
    const data = await payrollService.addDeduction(req.params.id, req.body);
    sendSuccess(res, data, 201);
  }),
);

// Tax Rules
payrollRouter.get('/tax-rules', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const data = await payrollService.listTaxRules(req.query.jurisdiction as string | undefined);
    sendSuccess(res, data);
  }),
);

payrollRouter.post('/tax-rules', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const data = await payrollService.createTaxRule(req.body);
    sendSuccess(res, data, 201);
  }),
);

payrollRouter.put('/tax-rules/:id', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const data = await payrollService.updateTaxRule(req.params.id, req.body);
    sendSuccess(res, data);
  }),
);

payrollRouter.delete('/tax-rules/:id', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    await payrollService.deleteTaxRule(req.params.id);
    sendSuccess(res, null, 204);
  }),
);

// Payroll Runs
payrollRouter.get('/runs', authorize('hr_manager', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { data, meta } = await payrollService.listRuns(req);
    sendSuccess(res, data, 200, meta);
  }),
);

payrollRouter.post('/runs', authorize('hr_manager', 'super_admin'),
  validate(createRunSchema),
  asyncHandler(async (req, res) => {
    const record = await payrollService.createRun(req.body, req.user as unknown as import('@hcm/shared').AuthUser);
    sendSuccess(res, record, 201);
  }),
);

payrollRouter.put('/runs/:id/status', authorize('hr_manager', 'super_admin'),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const run = await payrollService.advanceRunStatus(req.params.id, req.body.status, req.user as unknown as import('@hcm/shared').AuthUser);
    sendSuccess(res, run);
  }),
);

payrollRouter.get('/runs/:runId/payslips/:employeeId',
  asyncHandler(async (req, res) => {
    const data = await payrollService.getPayslip(req.params.runId, req.params.employeeId);
    sendSuccess(res, data);
  }),
);

// Payslips by ID
payrollRouter.get('/payslips/:id',
  asyncHandler(async (req, res) => {
    const data = await payrollService.getPayslipById(req.params.id);
    sendSuccess(res, data);
  }),
);

// PDF Download — PHASE-7-02/03
payrollRouter.get('/payslips/:id/pdf',
  asyncHandler(async (req, res) => {
    const payslip = await payrollService.getPayslipById(req.params.id);
    const buffer = await generatePayslipPDF(payslip as any);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${req.params.id}.pdf"`);
    res.send(buffer);
  }),
);
