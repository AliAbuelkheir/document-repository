import type { ListResponse } from '../types/api.js';
import type { ListResult, PageWindow } from '../types/common.js';

export interface PageQuery {
  page: number;
  pageSize: number;
}

export function toPageWindow({ page, pageSize }: PageQuery): PageWindow {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function toListResponse<T>(result: ListResult<T>, query: PageQuery): ListResponse<T> {
  return {
    data: result.items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    },
  };
}
