import { Request, Response } from 'express';
import { learningService } from './learning.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';

export const learningController = {
  // ─── Courses ─────────────────────────────────────────────────────────
  listCourses: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const filters = {
      type: req.query.type as string,
      isMandatory: req.query.isMandatory as string,
      search: req.query.search as string,
    };
    const { data, total } = await learningService.listCourses(filters, page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getCourse: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.getCourse(req.params.id);
    sendSuccess(res, data);
  }),

  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.createCourse(req.body);
    sendSuccess(res, data, 201);
  }),

  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.updateCourse(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  deleteCourse: asyncHandler(async (req: Request, res: Response) => {
    await learningService.deleteCourse(req.params.id);
    sendSuccess(res, { message: 'Course deleted successfully' });
  }),

  // ─── Enrolments ──────────────────────────────────────────────────────
  enrolEmployee: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.enrolEmployee(req.body);
    sendSuccess(res, data, 201);
  }),

  listEnrolmentsByEmployee: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.listEnrolmentsByEmployee(req.params.employeeId, req.query.status as string);
    sendSuccess(res, data);
  }),

  listEnrolmentsByCourse: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { data, total } = await learningService.listEnrolmentsByCourse(req.params.courseId, page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  updateEnrolmentStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.updateEnrolmentStatus(req.params.id, req.body.status);
    sendSuccess(res, data);
  }),

  // ─── Certificates ────────────────────────────────────────────────────
  getCertificate: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.getCertificate(req.params.id);
    sendSuccess(res, data);
  }),

  getCertificateDataForPdf: async (certId: string) => {
    return await learningService.getCertificateDataForPdf(certId);
  },

  // ─── Learning Plans ──────────────────────────────────────────────────
  listPlans: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { data, total } = await learningService.listPlans(page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getPlan: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.getPlan(req.params.id);
    sendSuccess(res, data);
  }),

  createPlan: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.createPlan(req.body, req.user!.userId);
    sendSuccess(res, data, 201);
  }),

  updatePlanItems: asyncHandler(async (req: Request, res: Response) => {
    await learningService.updatePlanItems(req.params.id, req.body);
    sendSuccess(res, { message: 'Plan items updated successfully' });
  }),

  // ─── Mandatory Training ──────────────────────────────────────────────
  listMandatoryTraining: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.listMandatoryTraining();
    sendSuccess(res, data);
  }),

  createMandatoryTraining: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.createMandatoryTraining(req.body);
    sendSuccess(res, data, 201);
  }),

  deleteMandatoryTraining: asyncHandler(async (req: Request, res: Response) => {
    await learningService.deleteMandatoryTraining(req.params.id);
    sendSuccess(res, { message: 'Mandatory training rule deleted successfully' });
  }),

  getMandatoryTrainingStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await learningService.getMandatoryTrainingStatus(req.params.employeeId);
    sendSuccess(res, data);
  }),
};
