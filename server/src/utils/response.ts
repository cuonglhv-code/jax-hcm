import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PaginationMeta } from '@hcm/shared';

/**
 * Standardised success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

/**
 * Standardised error response
 */
export function sendError(res: Response, message: string, statusCode = 500): void {
  const response: ApiResponse = { success: false, data: null, error: message };
  res.status(statusCode).json(response);
}

/**
 * Async route wrapper — eliminates try/catch boilerplate
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
