import { z } from 'zod';

import { registry, signedIn } from '../docs/openapi.js';
import { dataResponse, errorResponses, jsonContent } from './common.schema.js';
import { userSchema } from './user.schema.js';

export const loginBodySchema = registry.register(
  'LoginBody',
  z.object({
    email: z.string().trim().toLowerCase().min(1).max(254).meta({ example: 'admin@docrepo.local' }),
    password: z.string().min(1).max(72).meta({ example: 'Password123!' }),
  }),
);

// ---- OpenAPI ----

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Sign in',
  description: 'Sets the session cookie (8 hours).',
  request: { body: { content: jsonContent(loginBodySchema) } },
  responses: {
    200: dataResponse('The signed-in user', userSchema),
    ...errorResponses([400, 401]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Sign out',
  description: 'Clears the session cookie.',
  responses: { 204: { description: 'Signed out' } },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Get the signed-in user',
  security: signedIn,
  responses: {
    200: dataResponse('The signed-in user', userSchema),
    ...errorResponses([401]),
  },
});
