import db from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthUser } from '@hcm/shared';
import { UnauthorizedError, NotFoundError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<{ tokens: TokenPair; user: AuthUser }> {
    const user = await db('users')
      .join('employees', 'users.employee_id', 'employees.id')
      .where('users.email', email.toLowerCase())
      .whereNull('users.deleted_at')
      .select(
        'users.id',
        'users.email',
        'users.password_hash',
        'users.role',
        'users.employee_id',
        'employees.first_name',
        'employees.last_name',
      )
      .first();

    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    const tokens = authService.generateTokens(authUser);

    // Store refresh token
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { tokens, user: authUser };
  },

  generateTokens(user: AuthUser): TokenPair {
    const accessToken = jwt.sign(user, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    const refreshToken = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const stored = await db('refresh_tokens')
      .where({ token: refreshToken })
      .where('expires_at', '>', new Date())
      .whereNull('revoked_at')
      .first();

    if (!stored) throw new UnauthorizedError('Invalid or expired refresh token');

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { id: string };

    const user = await db('users')
      .join('employees', 'users.employee_id', 'employees.id')
      .where('users.id', decoded.id)
      .whereNull('users.deleted_at')
      .select(
        'users.id',
        'users.email',
        'users.role',
        'users.employee_id',
        'employees.first_name',
        'employees.last_name',
      )
      .first();

    if (!user) throw new NotFoundError('User');

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    // Revoke old token and issue new pair
    await db('refresh_tokens').where({ token: refreshToken }).update({ revoked_at: new Date() });

    const tokens = authService.generateTokens(authUser);
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return tokens;
  },

  async logout(refreshToken: string): Promise<void> {
    await db('refresh_tokens').where({ token: refreshToken }).update({ revoked_at: new Date() });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await db('users').where({ id: userId }).first();
    if (!user) throw new NotFoundError('User');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await db('users').where({ id: userId }).update({ password_hash: hash, updated_at: new Date() });
  },
};
