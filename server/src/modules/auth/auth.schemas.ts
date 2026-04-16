import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8, 'Password must be at least 8 characters')
             .regex(/[A-Z]/, 'Must contain an uppercase letter')
             .regex(/[0-9]/, 'Must contain a number'),
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  role:      z.enum(['super_admin','hr_manager','line_manager','employee'])
             .default('employee'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8)
                   .regex(/[A-Z]/, 'Must contain an uppercase letter')
                   .regex(/[0-9]/, 'Must contain a number'),
})

export type LoginInput          = z.infer<typeof loginSchema>
export type RegisterInput       = z.infer<typeof registerSchema>
export type RefreshInput        = z.infer<typeof refreshSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
