import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';
import { Prisma } from '../generated/prisma/client.js';
import type { ErrorResponse, FieldIssue } from '../types/api.js';

interface ErrorDescription {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

const INTERNAL_ERROR: ErrorDescription = {
  status: 500,
  code: ErrorCode.INTERNAL_ERROR,
  message: 'Something went wrong',
};

/** Errors from `express.json()` have a `type`, such as `entity.parse.failed`. */
function bodyParserErrorType(err: unknown): unknown {
  if (err instanceof Error && 'type' in err) {
    return err.type;
  }
  return undefined;
}

function toFieldIssues(err: ZodError): FieldIssue[] {
  return err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

const MULTER_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_COUNT: 'Send only one file',
  LIMIT_UNEXPECTED_FILE: 'Send the file in the "file" field',
  LIMIT_FIELD_COUNT: 'The form has too many fields',
  LIMIT_FIELD_VALUE: 'A form field is too long',
};

function describeMulterError(err: multer.MulterError): ErrorDescription {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return {
      status: 413,
      code: ErrorCode.PAYLOAD_TOO_LARGE,
      message: 'The file is too large. The maximum size is 25 MB.',
    };
  }
  return {
    status: 400,
    code: ErrorCode.VALIDATION_ERROR,
    message: MULTER_MESSAGES[err.code] ?? 'The multipart form is not valid',
  };
}

function describePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorDescription {
  if (err.code === 'P2002') {
    return {
      status: 409,
      code: ErrorCode.CONFLICT,
      message: 'A record with the same unique value exists. Refresh and try again.',
    };
  }
  // A foreign key stops the write, for example a user was added to a department during its delete.
  if (err.code === 'P2003') {
    return {
      status: 409,
      code: ErrorCode.CONFLICT,
      message: 'Other data uses this record. Refresh and try again.',
    };
  }
  if (err.code === 'P2025') {
    return { status: 404, code: ErrorCode.NOT_FOUND, message: 'Resource not found' };
  }
  return INTERNAL_ERROR;
}

function describeError(err: unknown): ErrorDescription {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: toFieldIssues(err),
    };
  }
  if (err instanceof multer.MulterError) {
    return describeMulterError(err);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return describePrismaError(err);
  }
  return describeBodyParserError(bodyParserErrorType(err));
}

function describeBodyParserError(type: unknown): ErrorDescription {
  if (type === 'entity.parse.failed') {
    return { status: 400, code: ErrorCode.MALFORMED_JSON, message: 'Malformed JSON body' };
  }
  if (type === 'entity.too.large') {
    return { status: 413, code: ErrorCode.PAYLOAD_TOO_LARGE, message: 'The body is too large' };
  }
  if (type === 'charset.unsupported' || type === 'encoding.unsupported') {
    return {
      status: 415,
      code: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
      message: 'Send the body as UTF-8 JSON without content encoding',
    };
  }
  return INTERNAL_ERROR;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  // The response has started (for example, a file download), so it cannot change to JSON.
  // Express closes the connection. Usually the client stopped the download.
  if (res.headersSent) {
    req.log.warn({ err }, 'The response stopped before the end');
    next(err);
    return;
  }

  const requestId = typeof req.id === 'string' ? req.id : 'unknown';
  const { status, code, message, details } = describeError(err);

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.warn({ code, status }, message);
  }

  const body: ErrorResponse = { error: { code, message, requestId } };
  if (details !== undefined) {
    body.error.details = details;
  }
  res.status(status).json(body);
};
