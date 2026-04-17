import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { asyncHandler, sendSuccess } from '../../utils/response'
import { getPagination, buildMeta } from '../../utils/pagination'
import { adminService } from './admin.service'

export const adminRouter = Router()
adminRouter.use(authenticate, authorize('super_admin'))

const updateUserSchema = z.object({
  role: z.enum(['super_admin', 'hr_manager', 'line_manager', 'employee']).optional(),
  is_active: z.boolean().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})

adminRouter.get('/stats', asyncHandler(async (_req, res) => {
  const data = await adminService.getSystemStats()
  sendSuccess(res, data)
}))

adminRouter.get('/users', asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req)
  const search = req.query.search as string | undefined
  const { data, total } = await adminService.listUsers(page, limit, search)
  sendSuccess(res, data, 200, buildMeta(total, page, limit))
}))

adminRouter.get('/users/:id', asyncHandler(async (req, res) => {
  const data = await adminService.getUserById(req.params.id)
  sendSuccess(res, data)
}))

adminRouter.put('/users/:id', validate(updateUserSchema), asyncHandler(async (req, res) => {
  const data = await adminService.updateUser(req.params.id, req.user!.userId, req.body)
  sendSuccess(res, data)
}))

adminRouter.post('/users/:id/reset-password', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  await adminService.resetUserPassword(req.params.id, req.body.newPassword)
  sendSuccess(res, null)
}))

adminRouter.delete('/users/:id', asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user!.userId)
  sendSuccess(res, null)
}))

adminRouter.get('/activity-log', asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req)
  const filters = {
    action: req.query.action as string,
    entityType: req.query.entityType as string,
    performedBy: req.query.performedBy as string,
  }
  const { data, total } = await adminService.getActivityLog(page, limit, filters)
  sendSuccess(res, data, 200, buildMeta(total, page, limit))
}))

