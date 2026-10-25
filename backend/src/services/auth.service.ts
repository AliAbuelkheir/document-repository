import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { PASSWORD_HASH_ROUNDS, SESSION_DURATION_SECONDS } from '../config/auth.js';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import * as userModel from '../models/user.model.js';
import type { UserRecord } from '../models/user.model.js';
import type { AuthUser } from '../types/auth.js';
import { cached } from '../utils/cache.js';

// Login compares the password with this hash when the email is unknown.
// The response time is then the same, so it does not show which emails exist.
const UNKNOWN_USER_HASH = bcrypt.hashSync('unknown-user-password', PASSWORD_HASH_ROUNDS);

const tokenPayloadSchema = z.object({ sub: z.uuid() });

export interface LoginResult {
  user: UserRecord;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const account = await userModel.findByEmailWithPassword(email);
  const isPasswordCorrect = await bcrypt.compare(password, account?.password ?? UNKNOWN_USER_HASH);
  if (!account || !account.isActive || !isPasswordCorrect) {
    throw new UnauthorizedError(
      'The email or password is not correct, or the account is not active',
    );
  }

  const user = await userModel.findById(account.id);
  if (!user) {
    throw new UnauthorizedError();
  }
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: SESSION_DURATION_SECONDS,
    algorithm: 'HS256',
  });
  return { user, token };
}

function readUserId(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return tokenPayloadSchema.parse(payload).sub;
  } catch {
    throw new UnauthorizedError('The session is not valid. Sign in again.');
  }
}

/**
 * Returns the user of a session token. The user comes from the database (through the cache),
 * so a change to the role, departments or status applies to the next request.
 */
export async function verifySession(token: string): Promise<AuthUser> {
  const userId = readUserId(token);
  const user = await cached({ group: 'users', name: 'session', key: userId }, () =>
    userModel.findById(userId),
  );
  if (!user?.isActive) {
    throw new UnauthorizedError('The session is not valid. Sign in again.');
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    departmentIds: user.departments.map((department) => department.id),
  };
}
