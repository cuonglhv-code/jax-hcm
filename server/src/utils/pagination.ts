import { Request } from 'express';
import { PaginationMeta } from '@hcm/shared';

export interface PaginatedQuery {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination(req: Request): PaginatedQuery {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
