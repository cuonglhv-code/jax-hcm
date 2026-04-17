import jwt from 'jsonwebtoken';
import { ROLES, JwtPayload } from '@hcm/shared';

export function getTestToken(
  role: typeof ROLES[keyof typeof ROLES], 
  overrides?: { userId?: string; email?: string; employeeId?: string }
) {
  const payload: any = {
    userId: overrides?.userId || 'uuid-admin-123',
    email: overrides?.email || 'admin@jaxtina.com',
    role: role
  };

  if (overrides?.employeeId) {
    payload.employeeId = overrides.employeeId;
  }

  const secret = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here';
  const token = jwt.sign(payload, secret, { expiresIn: '15m' });

  return `Bearer ${token}`;
}
