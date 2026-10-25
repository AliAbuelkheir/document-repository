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

export const tagNameSchema = z.string().trim().min(1).max(30);

export const listTagsQuerySchema = z.strictObject({
  search: z.string().trim().max(30).optional(),
  isActive: z.stringbool().optional(),
});

export const createTagBodySchema = registry.register(
  'CreateTagBody',
  z.object({ name: tagNameSchema }),
);

export const updateTagBodySchema = registry.register(
  'UpdateTagBody',
  // Strict, so that a request to change the name gives 400.
  z.strictObject({ isActive: z.boolean() }).meta({ description: 'Tag names cannot change.' }),
);

export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

// ---- OpenAPI ----

const tagSchema = registry.register(
  'Tag',
  z.object({
    id: idSchema,
    name: z.string(),
    isActive: z.boolean(),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  }),
);

registry.registerPath({
  method: 'get',
  path: '/tags',
  tags: ['Tags'],
  summary: 'List the default tags',
  security: signedIn,
  request: { query: listTagsQuerySchema },
  responses: {
    200: dataResponse('Default tags, sorted by name', z.array(tagSchema)),
    ...errorResponses([400, 401]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/tags',
  tags: ['Tags'],
  summary: 'Create a default tag (admin)',
  security: signedIn,
  request: { body: { content: jsonContent(createTagBodySchema) } },
  responses: {
    201: dataResponse('The new tag', tagSchema),
    ...errorResponses([400, 401, 403, 409]),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/tags/{id}',
  tags: ['Tags'],
  summary: 'Activate or deactivate a default tag (admin)',
  security: signedIn,
  request: { params: idParamsSchema, body: { content: jsonContent(updateTagBodySchema) } },
  responses: {
    200: dataResponse('The updated tag', tagSchema),
    ...errorResponses([400, 401, 403, 404]),
  },
});
