import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { employeeController } from './employee.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from './employee.schemas';
import { env } from '../../config/env';

export const employeeRouter = Router();

// File upload config
const storage = multer.diskStorage({
  destination: path.join(env.FILE_STORAGE_PATH, 'documents'),
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// All routes require authentication
employeeRouter.use(authenticate);

// Lookup routes
employeeRouter.get('/departments', employeeController.getDepartments);
employeeRouter.get('/job-titles', employeeController.getJobTitles);
employeeRouter.get('/org-chart', employeeController.orgChart);

// Employee CRUD
employeeRouter.get('/', validate(employeeQuerySchema, 'query'), employeeController.list);
employeeRouter.post(
  '/',
  authorize('hr_manager', 'super_admin'),
  validate(createEmployeeSchema),
  employeeController.create,
);
employeeRouter.get('/:id', employeeController.getById);
employeeRouter.put(
  '/:id',
  authorize('hr_manager', 'super_admin'),
  validate(updateEmployeeSchema),
  employeeController.update,
);
employeeRouter.delete('/:id', authorize('super_admin'), employeeController.delete);

// Documents
employeeRouter.get('/:id/documents', employeeController.getDocuments);
employeeRouter.post(
  '/:id/documents',
  authorize('hr_manager', 'super_admin'),
  upload.single('file'),
  employeeController.uploadDocument,
);

// Audit log
employeeRouter.get(
  '/:id/audit-log',
  authorize('hr_manager', 'super_admin'),
  employeeController.getAuditLog,
);
