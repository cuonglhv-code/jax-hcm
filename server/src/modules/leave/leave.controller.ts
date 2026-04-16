import { Request, Response } from 'express';
import { leaveService } from './leave.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';

export const leaveController = {
  // ─── Leave Types & Entitlements ──────────────────────────────────────
  listLeaveTypes: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.listLeaveTypes();
    sendSuccess(res, data);
  }),

  createLeaveType: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.createLeaveType(req.body);
    sendSuccess(res, data, 201);
  }),

  updateLeaveType: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.updateLeaveType(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  getEntitlements: asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await leaveService.getEntitlements(req.params.employeeId, year);
    sendSuccess(res, data);
  }),

  createEntitlement: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.createEntitlement(req.body);
    sendSuccess(res, data, 201);
  }),

  getLeaveBalance: asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await leaveService.getLeaveBalance(req.params.employeeId, year);
    sendSuccess(res, data);
  }),

  // ─── Leave Requests ──────────────────────────────────────────────────
  listLeaveRequests: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const filters = {
      employeeId: req.query.employeeId as string,
      status: req.query.status as string,
      year: req.query.year as string,
    };
    const { data, total } = await leaveService.listLeaveRequests(filters, page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getLeaveRequest: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.getLeaveRequest(req.params.id);
    sendSuccess(res, data);
  }),

  createLeaveRequest: asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.body.employeeId || req.user!.employeeId!;
    const data = await leaveService.createLeaveRequest(employeeId, req.body);
    sendSuccess(res, data, 201);
  }),

  reviewLeaveRequest: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.reviewLeaveRequest(req.params.id, req.body.action, req.user!.userId);
    sendSuccess(res, data);
  }),

  cancelLeaveRequest: asyncHandler(async (req: Request, res: Response) => {
    await leaveService.cancelLeaveRequest(req.params.id, req.user!.employeeId!);
    sendSuccess(res, { message: 'Leave request cancelled' });
  }),

  // ─── Calendar ────────────────────────────────────────────────────────
  getTeamCalendar: asyncHandler(async (req: Request, res: Response) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await leaveService.getTeamCalendar(req.user!.employeeId!, month, year);
    sendSuccess(res, data);
  }),

  // ─── Public Holidays ─────────────────────────────────────────────────
  listPublicHolidays: asyncHandler(async (req: Request, res: Response) => {
    const region = (req.query.region as string) || 'GB';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await leaveService.listPublicHolidays(region, year);
    sendSuccess(res, data);
  }),

  createPublicHoliday: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.createPublicHoliday(req.body);
    sendSuccess(res, data, 201);
  }),

  deletePublicHoliday: asyncHandler(async (req: Request, res: Response) => {
    await leaveService.deletePublicHoliday(req.params.id);
    sendSuccess(res, { message: 'Holiday deleted' });
  }),

  // ─── Attendance ──────────────────────────────────────────────────────
  clockIn: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.clockIn(req.user!.employeeId!, req.body.date, req.body.notes);
    sendSuccess(res, data, 201);
  }),

  clockOut: asyncHandler(async (req: Request, res: Response) => {
    const data = await leaveService.clockOut(req.user!.employeeId!);
    sendSuccess(res, data);
  }),

  listAttendance: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { data, total } = await leaveService.listAttendance(
      req.user!.employeeId!, req.query.from as string, req.query.to as string, page, limit
    );
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  exportAttendanceCSV: asyncHandler(async (req: Request, res: Response) => {
    const csv = await leaveService.exportAttendanceCSV(
       req.user!.employeeId!, req.query.from as string, req.query.to as string
    );
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance.csv');
    res.send(csv);
  }),
};
