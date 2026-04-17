import jwt from 'jsonwebtoken';
import { ROLES } from '@hcm/shared';

export function getTestToken(role: typeof ROLES[keyof typeof ROLES], overrides?: { userId?: string; email?: string }) {
  const payload = {
    userId: overrides?.userId || 'uuid-admin-123',
    email: overrides?.email || 'admin@jaxtina.com',
    role: role
  };

  const secret = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here';
  const token = jwt.sign(payload, secret, { expiresIn: '15m' });

  return `Bearer ${token}`;
}
