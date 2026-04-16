import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', { error: err.message, stack: err.stack });
    }
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Handle Knex/PostgreSQL constraint errors
  const pgError = err as { code?: string; detail?: string };
  if (pgError.code === '23505') {
    sendError(res, `Duplicate entry: ${pgError.detail ?? 'record already exists'}`, 409);
    return;
  }
  if (pgError.code === '23503') {
    sendError(res, 'Referenced record not found', 404);
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  sendError(res, 'Internal server error', 500);
}
