import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { asyncHandler, sendSuccess } from '../../utils/response'
import { notificationService } from './notification.service'
import { getPagination, buildMeta } from '../../utils/pagination'

export const notificationRouter = Router()
notificationRouter.use(authenticate)

notificationRouter.get('/', asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req)
  const unreadOnly = req.query.unreadOnly === 'true'
  const result = await notificationService.getNotifications(req.user!.userId, unreadOnly, page, limit)
  sendSuccess(res, result.data, 200, buildMeta(result.total, page, limit))
}))

notificationRouter.patch('/read-all', asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user!.userId)
  sendSuccess(res, null)
}))

notificationRouter.patch('/:id/read', asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user!.userId)
  sendSuccess(res, null)
}))

notificationRouter.delete('/:id', asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user!.userId)
  sendSuccess(res, null)
}))

