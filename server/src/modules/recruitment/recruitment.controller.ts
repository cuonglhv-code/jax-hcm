import { Request, Response } from 'express';
import { recruitmentService } from './recruitment.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';

export const recruitmentController = {
  // ─── Requisitions ────────────────────────────────────────────────────
  listRequisitions: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const filters = { status: req.query.status as string };
    const { data, total } = await recruitmentService.listRequisitions(filters, page, limit);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getRequisition: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.getRequisition(req.params.id);
    sendSuccess(res, data);
  }),

  createRequisition: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.createRequisition(req.body, req.user!.userId);
    sendSuccess(res, data, 201);
  }),

  updateRequisition: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.updateRequisition(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  closeRequisition: asyncHandler(async (req: Request, res: Response) => {
    await recruitmentService.closeRequisition(req.params.id);
    sendSuccess(res, { message: 'Requisition closed' });
  }),

  // ─── Candidates ──────────────────────────────────────────────────────
  listCandidates: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const search = req.query.search as string;
    const { data, total } = await recruitmentService.listCandidates(page, limit, search);
    sendSuccess(res, data, 200, buildMeta(total, page, limit));
  }),

  getCandidate: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.getCandidate(req.params.id);
    sendSuccess(res, data);
  }),

  createCandidate: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.createCandidate(req.body);
    sendSuccess(res, data, 201);
  }),

  updateCandidate: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.updateCandidate(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  // ─── Applications / Pipeline ─────────────────────────────────────────
  createApplication: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.createApplication(req.body);
    sendSuccess(res, data, 201);
  }),

  getApplicationsByRequisition: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.getApplicationsByRequisition(req.params.requisitionId);
    sendSuccess(res, data);
  }),

  getApplicationsByCandidate: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.getApplicationsByCandidate(req.params.candidateId);
    sendSuccess(res, data);
  }),

  advanceStage: asyncHandler(async (req: Request, res: Response) => {
    const { stage, notes } = req.body;
    const data = await recruitmentService.advanceStage(req.params.id, stage, notes);
    sendSuccess(res, data);
  }),

  convertToEmployee: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.convertToEmployee(req.params.id, req.body, req.user!.userId);
    sendSuccess(res, data, 201);
  }),

  // ─── Interviews ──────────────────────────────────────────────────────
  listInterviews: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.listInterviews(req.params.id);
    sendSuccess(res, data);
  }),

  createInterview: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.createInterview(req.params.id, req.body);
    sendSuccess(res, data, 201);
  }),

  updateInterview: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.updateInterview(req.params.id, req.body);
    sendSuccess(res, data);
  }),

  // ─── Offer Letters ───────────────────────────────────────────────────
  createOffer: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.createOfferLetter(req.params.id, req.body);
    sendSuccess(res, data, 201);
  }),

  updateOfferStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.updateOfferStatus(req.params.id, req.body.status);
    sendSuccess(res, data);
  }),

  getOfferDataForPdf: async (offerId: string) => {
    return await recruitmentService.getOfferDataForPdf(offerId);
  },

  // ─── Onboarding ──────────────────────────────────────────────────────
  getOnboardingChecklist: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.getOnboardingChecklist(req.params.employeeId);
    sendSuccess(res, data);
  }),

  updateTaskCompletion: asyncHandler(async (req: Request, res: Response) => {
    const data = await recruitmentService.updateTaskCompletion(req.params.taskId, req.body.completed);
    sendSuccess(res, data);
  }),
};
