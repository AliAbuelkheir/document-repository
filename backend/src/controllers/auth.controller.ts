import type { CookieOptions, RequestHandler } from 'express';

import { AUTH_COOKIE, SESSION_DURATION_SECONDS } from '../config/auth.js';
import { currentUser } from '../middlewares/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { loginBodySchema } from '../validators/auth.schema.js';

// The app runs on plain HTTP in Docker Compose, so the cookie is not `secure`.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginBodySchema.parse(req.body);
  const { user, token } = await authService.login(email, password);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DURATION_SECONDS * 1000 });
  res.json({ data: user });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).end();
};

export const getMe: RequestHandler = async (req, res) => {
  res.json({ data: await userService.getUser(currentUser(req).id) });
};
