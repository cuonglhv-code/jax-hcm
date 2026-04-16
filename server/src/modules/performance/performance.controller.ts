import { Request, Response } from 'express';
import { performanceService } from './performance.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';

export const performanceController = {
  // ─── Cycles ─────────────────────────────────────────────────────────
  listCycles: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { data, total } = await performanceService.listCycles(page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getCycle: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.getCycle(req.params.id);
    sendSuccess(res, data);
  }),

  createCycle: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.createCycle(req.body);
    sendSuccess(res, data, 201);
  }),

  activateCycle: asyncHandler(async (req: Request, res: Response) => {
    await performanceService.activateCycle(req.params.id);
    sendSuccess(res, { message: 'Cycle activated successfully' });
  }),

  // ─── Appraisals ──────────────────────────────────────────────────────
  listAppraisals: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const filters = {
      cycleId: req.query.cycleId as string,
      employeeId: req.query.employeeId as string,
      managerId: req.query.managerId as string,
      status: req.query.status as string,
    };
    const { data, total } = await performanceService.listAppraisals(filters, page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getAppraisal: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.getAppraisal(req.params.id);
    sendSuccess(res, data);
  }),

  createAppraisal: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.createAppraisal(req.body);
    sendSuccess(res, data, 201);
  }),

  advanceAppraisal: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.advanceAppraisal(req.params.id, req.body.action, req.user!.userId);
    sendSuccess(res, data);
  }),

  saveResponses: asyncHandler(async (req: Request, res: Response) => {
    const role = req.user!.role === 'employee' ? 'self' : 'manager'; // simplified
    await performanceService.saveResponses(req.params.id, req.body.responses, req.user!.userId, role);
    sendSuccess(res, { message: 'Responses saved successfully' });
  }),

  // ─── Goals & Key Results ─────────────────────────────────────────────
  listGoals: asyncHandler(async (req: Request, res: Response) => {
    // Assuming employee views their own goals if not hr/manager querying
    const employeeId = req.query.employeeId as string || req.user!.employeeId!;
    const data = await performanceService.listGoals(employeeId, req.query.cycleId as string);
    sendSuccess(res, data);
  }),

  getGoal: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.getGoal(req.params.id);
    sendSuccess(res, data);
  }),

  createGoal: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.body.employeeId || req.user!.employeeId!;
    const data = await performanceService.createGoal(req.body, employeeId);
    sendSuccess(res, data, 201);
  }),

  updateGoal: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.updateGoal(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  deleteGoal: asyncHandler(async (req: Request, res: Response) => {
    await performanceService.deleteGoal(req.params.id);
    sendSuccess(res, { message: 'Goal deleted successfully' });
  }),

  createKeyResult: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.createKeyResult(req.body);
    sendSuccess(res, data, 201);
  }),

  updateKeyResult: asyncHandler(async (req: Request, res: Response) => {
    const data = await performanceService.updateKeyResult(req.params.id, req.body.currentValue);
    sendSuccess(res, data);
  }),

  deleteKeyResult: asyncHandler(async (req: Request, res: Response) => {
    await performanceService.deleteKeyResult(req.params.id);
    sendSuccess(res, { message: 'Key Result deleted successfully' });
  }),

  // ─── Dashboard ───────────────────────────────────────────────────────
  getDepartmentDashboard: asyncHandler(async (req: Request, res: Response) => {
    const cycleId = req.query.cycleId as string;
    const data = await performanceService.getDepartmentDashboard(cycleId);
    sendSuccess(res, data);
  }),
};
