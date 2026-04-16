import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '@hcm/shared'
import { AppError } from './errorHandler'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'No token provided'))
  }

  const token  = header.slice(7)
  const secret = process.env.JWT_SECRET

  if (!secret || secret === 'CHANGE_ME_IN_PRODUCTION_USE_32_CHAR_MIN') {
    return next(new AppError(500, 'JWT_SECRET is not configured'))
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    req.user = payload
    next()
  } catch (err) {
    next(err)
  }
}
