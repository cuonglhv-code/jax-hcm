import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../../config/database'
import { env } from '../../config/env'
import { AppError } from '../../middleware/errorHandler'
import type { JwtPayload, AuthUser, Role } from '@hcm/shared'

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function signRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

export async function storeRefreshToken(userId: string, hash: string): Promise<void> {
  await db('refresh_tokens')
    .update({ revoked_at: db.fn.now() })
    .where({ user_id: userId })
    .andWhere('expires_at', '>', db.fn.now())
    .andWhere({ revoked_at: null })

  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: hash,
    expires_at: db.raw(`NOW() + INTERVAL '${env.REFRESH_TOKEN_EXPIRES_DAYS} days'`),
  })
}

export async function verifyRefreshToken(raw: string): Promise<JwtPayload> {
  const hash = crypto.createHash('sha256').update(raw).digest('hex')

  const stored = await db('refresh_tokens')
    .select('users.id', 'users.email', 'users.role')
    .join('users', 'users.id', 'refresh_tokens.user_id')
    .where({ token_hash: hash })
    .andWhere('refresh_tokens.expires_at', '>', db.fn.now())
    .andWhere({ 'refresh_tokens.revoked_at': null })
    .first()

  if (!stored) {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  return { userId: stored.id, email: stored.email, role: stored.role as Role }
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  await db('refresh_tokens').update({ revoked_at: db.fn.now() }).where({ token_hash: hash })
}

export async function login(
  email: string,
  pass: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const user = await db('users')
    .leftJoin('employees', 'users.id', 'employees.user_id')
    .select('users.*', 'employees.first_name', 'employees.last_name', 'employees.id as employee_id')
    .where({
      'users.email': email.toLowerCase(),
      'users.is_active': true,
      'users.deleted_at': null,
    })
    .first()

  if (!user || !(await bcrypt.compare(pass, user.password_hash))) {
    throw new AppError(401, 'Invalid credentials')
  }

  await db('users').update({ last_login_at: db.fn.now() }).where({ id: user.id })

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role as Role }
  const accessToken = signAccessToken(payload)
  const { raw, hash } = signRefreshToken()
  await storeRefreshToken(user.id, hash)

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    firstName: user.first_name ?? 'User',
    lastName: user.last_name ?? '',
    employeeId: user.employee_id,
  }

  return { user: authUser, accessToken, refreshToken: raw }
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await db('users')
    .select(
      'users.id',
      'users.email',
      'users.role',
      'employees.first_name',
      'employees.last_name',
      'employees.id as employee_id'
    )
    .leftJoin('employees', 'employees.user_id', 'users.id')
    .where({ 'users.id': userId })
    .first()

  if (!user) throw new AppError(404, 'User not found')

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    firstName: user.first_name ?? 'User',
    lastName: user.last_name ?? '',
    employeeId: user.employee_id,
  }
}

export async function changePassword(userId: string, current: string, next: string): Promise<void> {
  const user = await db('users').where({ id: userId }).first()
  if (!user || !(await bcrypt.compare(current, user.password_hash))) {
    throw new AppError(400, 'Current password is incorrect')
  }

  const hash = await bcrypt.hash(next, env.BCRYPT_ROUNDS)
  await db('users').update({ password_hash: hash, updated_at: db.fn.now() }).where({ id: userId })
  await db('refresh_tokens').update({ revoked_at: db.fn.now() }).where({ user_id: userId })
}
