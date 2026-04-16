import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(mySchema), controller)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error as ZodError).errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      sendError(res, `Validation error: ${errors}`, 422);
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate query string parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = (result.error as ZodError).errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      sendError(res, `Query validation error: ${errors}`, 422);
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
