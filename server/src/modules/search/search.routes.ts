import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate'
import { asyncHandler, sendSuccess } from '../../utils/response'
import { searchService } from './search.service'

export const searchRouter = Router()
searchRouter.use(authenticate)

searchRouter.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q as string) ?? ''
  const results = await searchService.globalSearch(q, req.user!.id, req.user!.role as any)
  sendSuccess(res, results)
}))
