import type { Role } from '../constants/roles'

export interface JwtPayload {
  userId: string
  employeeId?: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

export interface AuthUser {
  id: string
  employeeId?: string
  email: string
  role: Role
  firstName: string
  lastName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}
