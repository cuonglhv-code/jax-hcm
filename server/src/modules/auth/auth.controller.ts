import type { Request, Response, NextFunction } from 'express'
import * as svc from './auth.service'
import { success } from '../../utils/responseEnvelope'
import type { LoginInput, RefreshInput, ChangePasswordInput } from './auth.schemas'
import { env } from '../../config/env'

const isProd = env.NODE_ENV === 'production'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput
    const { user, accessToken, refreshToken } = await svc.login(email, password)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      path:     '/api/auth/refresh',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    res.json(success({ user, accessToken }))
  } catch (err) { next(err) }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken
    if (token) await svc.revokeRefreshToken(token)
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' })
    res.json(success({ message: 'Logged out' }))
  } catch (err) { next(err) }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies.refreshToken || (req.body as RefreshInput).refreshToken
    if (!oldToken) return res.status(401).json({ success: false, error: 'Refresh token missing' })
    const payload  = await svc.verifyRefreshToken(oldToken)
    
    const accessToken = svc.signAccessToken(payload)
    const { raw, hash } = svc.signRefreshToken()
    
    await svc.revokeRefreshToken(oldToken)
    await svc.storeRefreshToken(payload.userId, hash)

    res.cookie('refreshToken', raw, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      path:     '/api/auth/refresh',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    res.json(success({ accessToken }))
  } catch (err) { next(err) }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await svc.getMe(req.user!.userId)
    res.json(success(user))
  } catch (err) { next(err) }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput
    await svc.changePassword(req.user!.userId, currentPassword, newPassword)
    res.json(success({ message: 'Password changed' }))
  } catch (err) { next(err) }
}
