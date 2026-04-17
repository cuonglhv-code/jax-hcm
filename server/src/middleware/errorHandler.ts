import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { error as envelope } from '../utils/responseEnvelope'
import { env } from '../config/env'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error, _req: Request, res: Response, _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      fields: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json(envelope('Token expired'))
    return
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json(envelope('Invalid token'))
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(envelope(err.message))
    return
  }

  const isDev = env.NODE_ENV === 'development'
  logger.error({ err }, 'Unhandled error')
  res.status(500).json(
    envelope(isDev ? err.message : 'Internal server error')
  )
}
