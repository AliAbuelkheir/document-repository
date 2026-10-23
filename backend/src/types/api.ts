import type { ErrorCode } from '../errors/error-codes.js';

export interface DataResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}
