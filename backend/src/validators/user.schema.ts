import { z } from 'zod';

import { registry, signedIn } from '../docs/openapi.js';
import type { NonEmptyArray } from '../types/common.js';
import {
  dataResponse,
  dateTimeSchema,
  errorResponses,
  idParamsSchema,
  idSchema,
  jsonContent,
  listResponse,
  namedRefSchema,
  pageQueryShape,
  repeatedParam,
  sortOrderSchema,
} from './common.schema.js';

const roleSchema = z.enum(['ADMIN', 'USER']);
const emailSchema = z.email().max(254).toLowerCase();
const nameSchema = z.string().trim().min(1).max(100);
// bcrypt uses only the first 72 bytes of a password.
const passwordSchema = z.string().min(8).max(72);

function toNonEmptyArray(ids: string[]): NonEmptyArray<string> {
  const [first, ...rest] = ids;
  if (first === undefined) {
    throw new Error('The schema must check that the list is not empty');
  }
  return [first, ...rest];
}

const departmentIdsSchema = z
  .array(idSchema)
  .min(1, 'Select at least one department')
  .refine((ids) => new Set(ids).size === ids.length, 'Each department can appear only one time')
  .transform(toNonEmptyArray);

export const createUserBodySchema = registry.register(
  'CreateUserBody',
  z.object({
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    role: roleSchema.default('USER'),
    departmentIds: departmentIdsSchema,
  }),
);

export const updateUserBodySchema = registry.register(
  'UpdateUserBody',
  z.object({
    email: emailSchema.optional(),
    name: nameSchema.optional(),
    password: passwordSchema.optional().meta({ description: 'Set to reset the password.' }),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
    departmentIds: departmentIdsSchema.optional(),
  }),
);

// Strict, so that a wrong parameter name such as `departmentIds[]` gives 400.
export const listUsersQuerySchema = z.strictObject({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .meta({ description: 'Fuzzy match on name and email' }),
  departmentIds: repeatedParam(idSchema).optional(),
  role: roleSchema.optional(),
  isActive: z.stringbool().optional(),
  sort: z
    .enum(['relevance', 'name', 'email', 'department', 'role', 'isActive', 'createdAt'])
    .optional()
    .meta({ description: 'Default: relevance with `search`, else name' }),
  order: sortOrderSchema.optional().meta({ description: 'Default: asc (desc for createdAt)' }),
  ...pageQueryShape,
});

export type CreateUserInput = z.infer<typeof createUserBodySchema>;
export type UpdateUserInput = z.infer<typeof updateUserBodySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// ---- OpenAPI ----

const userListItemSchema = z.object({
  id: idSchema,
  email: z.string(),
  name: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  departments: z.array(namedRefSchema),
  createdAt: dateTimeSchema,
});

export const userSchema = registry.register(
  'User',
  userListItemSchema.extend({ updatedAt: dateTimeSchema }),
);

registry.registerPath({
  method: 'get',
  path: '/users',
  tags: ['Users'],
  summary: 'Search users',
  security: signedIn,
  request: { query: listUsersQuerySchema },
  responses: {
    200: listResponse('A page of users', userListItemSchema),
    ...errorResponses([400, 401]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  summary: 'Create a user (admin)',
  security: signedIn,
  request: { body: { content: jsonContent(createUserBodySchema) } },
  responses: {
    201: dataResponse('The new user', userSchema),
    ...errorResponses([400, 401, 403, 409]),
  },
});

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  summary: 'Get a user',
  security: signedIn,
  request: { params: idParamsSchema },
  responses: {
    200: dataResponse('The user', userSchema),
    ...errorResponses([400, 401, 404]),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/users/{id}',
  tags: ['Users'],
  summary: 'Update a user (admin)',
  description: 'Users are never deleted. Set `isActive` to false to deactivate a user.',
  security: signedIn,
  request: { params: idParamsSchema, body: { content: jsonContent(updateUserBodySchema) } },
  responses: {
    200: dataResponse('The updated user', userSchema),
    ...errorResponses([400, 401, 403, 404, 409]),
  },
});
