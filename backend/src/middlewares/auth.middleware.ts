import type { Request, RequestHandler } from 'express';
import { z } from 'zod';

import { AUTH_COOKIE } from '../config/auth.js';
import { UnauthorizedError } from '../errors/app-error.js';
import * as authService from '../services/auth.service.js';
import type { AuthUser } from '../types/auth.js';

const cookiesSchema = z.object({ [AUTH_COOKIE]: z.string().min(1) });

/** Reads the session cookie and sets `req.user`. Sends 401 if the session is not valid. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const cookies = cookiesSchema.safeParse(req.cookies);
  if (!cookies.success) {
    throw new UnauthorizedError();
  }
  req.user = await authService.verifySession(cookies.data[AUTH_COOKIE]);
  next();
};

/** The signed-in user. Use it only in routes after `authenticate`. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}
