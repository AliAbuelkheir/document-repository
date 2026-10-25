import type { AuthUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      /** The signed-in user. The `authenticate` middleware sets it. */
      user?: AuthUser;
    }
  }
}

export {};
