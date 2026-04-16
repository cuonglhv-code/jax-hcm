import type { Request } from 'express'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function getPagination(reqOrQuery: any): PaginationParams {
  const query = reqOrQuery.query || reqOrQuery;
  const page  = Math.max(1, parseInt(String(query.page  ?? '1'),  10) || 1)
  const limit = Math.min(100, Math.max(1,
                  parseInt(String(query.limit ?? '20'), 10) || 20))
  return { page, limit, offset: (page - 1) * limit }
}

export function buildMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}
