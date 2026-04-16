import { Request, Response, NextFunction } from 'express';
import { Role } from '@hcm/shared';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

/**
 * Role-based access control middleware.
 * Usage: router.get('/', authenticate, authorize('hr_manager', 'super_admin'), controller)
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role as Role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
      );
    }
    next();
  };
}

/**
 * Allows access if user is the resource owner OR has elevated role.
 * Usage: authorizeOwnerOrRole('hr_manager', 'super_admin')
 */
export function authorizeOwnerOrRole(employeeIdParam: string, ...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const paramId = req.params[employeeIdParam];
    const isOwner = req.user.employeeId === paramId;
    const hasRole = roles.includes(req.user.role as Role);

    if (!isOwner && !hasRole) {
      throw new ForbiddenError();
    }
    next();
  };
}
