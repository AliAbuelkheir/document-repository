import { z } from 'zod';

import { registry } from '../docs/openapi.js';

export const idSchema = z.uuid().meta({ example: '019a1b2c-3d4e-7f60-8a9b-0c1d2e3f4a5b' });

export const idParamsSchema = z.object({ id: idSchema });

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const pageQueryShape = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

function toArray(value: unknown): unknown {
  if (value === undefined || Array.isArray(value)) {
    return value;
  }
  return [value];
}

/** A query parameter that can repeat, such as `?tags=a&tags=b`. One value also gives an array. */
export function repeatedParam<Item extends z.ZodType>(
  item: Item,
  maxItems = 100,
  tooManyMessage = `Send at most ${maxItems} values`,
) {
  return z.preprocess(toArray, z.array(item).max(maxItems, tooManyMessage));
}

// ---- Shapes for the OpenAPI document only ----

export const dateTimeSchema = z.iso.datetime();

export const namedRefSchema = z.object({ id: idSchema, name: z.string() });

const pageMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.object({
      code: z.string().meta({ example: 'VALIDATION_ERROR' }),
      message: z.string(),
      details: z
        .array(z.object({ path: z.string(), message: z.string() }))
        .optional()
        .meta({ description: 'Field problems. Only some errors have details.' }),
      requestId: z.string(),
    }),
  }),
);

export function jsonContent(schema: z.ZodType) {
  return { 'application/json': { schema } };
}

export function dataResponse(description: string, schema: z.ZodType) {
  return { description, content: jsonContent(z.object({ data: schema })) };
}

export function listResponse(description: string, schema: z.ZodType) {
  return {
    description,
    content: jsonContent(z.object({ data: z.array(schema), meta: pageMetaSchema })),
  };
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'The request is not valid',
  401: 'You are not signed in',
  403: 'You do not have permission',
  404: 'Not found, or you do not have access',
  409: 'Conflict with existing data',
  413: 'The file or body is too large',
  415: 'The file type is not allowed',
};

/** Error responses for the OpenAPI document. */
export function errorResponses(statuses: number[]) {
  const responses: Record<number, { description: string; content: object }> = {};
  for (const status of statuses) {
    responses[status] = {
      description: ERROR_DESCRIPTIONS[status] ?? 'Error',
      content: jsonContent(errorResponseSchema),
    };
  }
  return responses;
}
