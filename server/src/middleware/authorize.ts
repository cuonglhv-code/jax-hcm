import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@hcm/shared'
import { ROLE_HIERARCHY } from '@hcm/shared'
import { AppError } from './errorHandler'

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'))
    }

    const userLevel    = ROLE_HIERARCHY[req.user.role] ?? 0
    const minRequired  = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r] ?? 0))

    if (userLevel < minRequired) {
      return next(new AppError(403, 'Insufficient permissions'))
    }

    next()
  }
}
