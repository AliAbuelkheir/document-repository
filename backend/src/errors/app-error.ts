import { ErrorCode } from './error-codes.js';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, ErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, ErrorCode.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, ErrorCode.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, ErrorCode.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(409, ErrorCode.CONFLICT, message, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload too large') {
    super(413, ErrorCode.PAYLOAD_TOO_LARGE, message);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported media type') {
    super(415, ErrorCode.UNSUPPORTED_MEDIA_TYPE, message);
  }
}
