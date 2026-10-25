import type { RequestHandler } from 'express';

import { ForbiddenError } from '../errors/app-error.js';
import type { Role } from '../generated/prisma/enums.js';
import { currentUser } from './auth.middleware.js';

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (currentUser(req).role !== role) {
      throw new ForbiddenError();
    }
    next();
  };
}
