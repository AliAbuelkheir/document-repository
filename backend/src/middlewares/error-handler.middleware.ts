import type { ErrorRequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';
import type { ErrorResponse } from '../types/api.js';

function isMalformedJson(err: unknown): boolean {
  return err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed';
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const requestId = typeof req.id === 'string' ? req.id : 'unknown';

  let status = 500;
  let body: ErrorResponse['error'] = {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Something went wrong',
    requestId,
  };

  if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, requestId };
    if (err.details !== undefined) body.details = err.details;
  } else if (isMalformedJson(err)) {
    status = 400;
    body = { code: ErrorCode.MALFORMED_JSON, message: 'Malformed JSON body', requestId };
  }

  if (status >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.warn({ code: body.code, status }, body.message);
  }

  res.status(status).json({ error: body } satisfies ErrorResponse);
};
