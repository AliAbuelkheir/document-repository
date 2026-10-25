import { z } from 'zod';

import { registry, signedIn } from '../docs/openapi.js';
import {
  dataResponse,
  dateTimeSchema,
  errorResponses,
  idParamsSchema,
  idSchema,
  jsonContent,
} from './common.schema.js';

const nameSchema = z.string().trim().min(1).max(100);
const descriptionSchema = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((text) => (text === '' ? null : text));

export const createDepartmentBodySchema = registry.register(
  'CreateDepartmentBody',
  z.object({
    name: nameSchema,
    description: descriptionSchema.optional(),
  }),
);

export const updateDepartmentBodySchema = registry.register(
  'UpdateDepartmentBody',
  z.object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  }),
);

export type CreateDepartmentInput = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentBodySchema>;

// ---- OpenAPI ----

const departmentSchema = registry.register(
  'Department',
  z.object({
    id: idSchema,
    name: z.string(),
    description: z.string().nullable(),
    userCount: z.number().int(),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  }),
);

registry.registerPath({
  method: 'get',
  path: '/departments',
  tags: ['Departments'],
  summary: 'List all departments',
  security: signedIn,
  responses: {
    200: dataResponse('All departments, sorted by name', z.array(departmentSchema)),
    ...errorResponses([401]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/departments',
  tags: ['Departments'],
  summary: 'Create a department (admin)',
  security: signedIn,
  request: { body: { content: jsonContent(createDepartmentBodySchema) } },
  responses: {
    201: dataResponse('The new department', departmentSchema),
    ...errorResponses([400, 401, 403, 409]),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/departments/{id}',
  tags: ['Departments'],
  summary: 'Update a department (admin)',
  security: signedIn,
  request: { params: idParamsSchema, body: { content: jsonContent(updateDepartmentBodySchema) } },
  responses: {
    200: dataResponse('The updated department', departmentSchema),
    ...errorResponses([400, 401, 403, 404, 409]),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/departments/{id}',
  tags: ['Departments'],
  summary: 'Delete a department (admin)',
  description: 'Gives 409 if users are in the department. Deletes the document grants of it.',
  security: signedIn,
  request: { params: idParamsSchema },
  responses: {
    204: { description: 'Deleted' },
    ...errorResponses([400, 401, 403, 404, 409]),
  },
});
