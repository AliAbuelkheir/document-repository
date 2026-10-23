import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

const HEADER = 'x-request-id';
const VALID_ID = /^[\w-]{1,128}$/;

/** Reuses a well-formed incoming X-Request-Id or generates one, and echoes it on the response. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(HEADER);
  const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
};
