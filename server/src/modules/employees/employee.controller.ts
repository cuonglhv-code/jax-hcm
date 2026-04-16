import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { sendSuccess, asyncHandler } from '../../utils/response';
import path from 'path';
import { env } from '../../config/env';

export const employeeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await employeeService.list(req);
    sendSuccess(res, data, 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.getById(req.params.id);
    sendSuccess(res, employee);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.create(req.body, req.user!);
    sendSuccess(res, employee, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.update(req.params.id, req.body, req.user!);
    sendSuccess(res, employee);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await employeeService.softDelete(req.params.id, req.user!);
    sendSuccess(res, { message: 'Employee deleted' });
  }),

  orgChart: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.getOrgChart();
    sendSuccess(res, data);
  }),

  getDocuments: asyncHandler(async (req: Request, res: Response) => {
    const docs = await employeeService.getDocuments(req.params.id);
    sendSuccess(res, docs);
  }),

  uploadDocument: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, data: null, error: 'No file uploaded' });
      return;
    }
    const docType = (req.body.documentType as string) || 'other';
    const docName = (req.body.name as string) || file.originalname;
    const relativePath = path.relative(
      path.join(__dirname, '../../../'),
      file.path,
    );

    const doc = await employeeService.addDocument(
      req.params.id,
      {
        name: docName,
        type: docType,
        path: relativePath,
        size: file.size,
        mimeType: file.mimetype,
      },
      req.user!,
    );
    sendSuccess(res, doc, 201);
  }),

  getAuditLog: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await employeeService.getAuditLog(req.params.id, req);
    sendSuccess(res, data, 200, meta);
  }),

  getDepartments: asyncHandler(async (_req: Request, res: Response) => {
    const data = await employeeService.getDepartments();
    sendSuccess(res, data);
  }),

  getJobTitles: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.getJobTitles(req.query.departmentId as string);
    sendSuccess(res, data);
  }),
};
