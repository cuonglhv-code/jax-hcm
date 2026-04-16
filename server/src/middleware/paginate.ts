import type { Request, Response, NextFunction } from 'express'
import { getPagination } from '../utils/pagination'

export function paginate(req: Request, _res: Response, next: NextFunction): void {
  const { page, limit, offset } = getPagination(req.query)
  req.query.page   = String(page)
  req.query.limit  = String(limit)
  req.query.offset = String(offset)
  next()
}
