import type { ErrorCode } from '../errors/error-codes.js';

export interface DataResponse<T> {
  data: T;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: PageMeta;
}

/** One validation problem. `path` is the dotted path of the field, such as `viewers.0.id`. */
export interface FieldIssue {
  path: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}
