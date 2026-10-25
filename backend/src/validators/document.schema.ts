import { z } from 'zod';

import { registry, signedIn } from '../docs/openapi.js';
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
import { tagNameSchema } from './tag.schema.js';

const MAX_TAGS = 10;
const TOO_MANY_TAGS = `A document can have at most ${MAX_TAGS} tags`;
const MAX_PRINCIPALS = 200;

const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .transform((text) => (text === '' ? null : text));
const tagsSchema = repeatedParam(tagNameSchema, MAX_TAGS, TOO_MANY_TAGS);

const principalSchema = z.object({
  type: z.enum(['USER', 'DEPARTMENT']),
  id: idSchema,
});

interface PermissionsBody {
  visibility: 'PUBLIC' | 'RESTRICTED';
  viewers: z.infer<typeof principalSchema>[];
  editors: z.infer<typeof principalSchema>[];
}

/** Adds an issue for viewers on a public document, and for each principal that repeats. */
function checkPermissions(body: PermissionsBody, context: z.RefinementCtx): void {
  if (body.visibility === 'PUBLIC' && body.viewers.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['viewers'],
      message: 'A public document cannot have viewers. Remove the viewers or make it restricted.',
    });
  }

  const seen = new Set<string>();
  const lists = [
    { name: 'viewers', principals: body.viewers },
    { name: 'editors', principals: body.editors },
  ];
  for (const list of lists) {
    list.principals.forEach((principal, index) => {
      const key = `${principal.type}:${principal.id}`;
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: [list.name, index],
          message: 'A user or department can appear only one time, as a viewer or an editor',
        });
      }
      seen.add(key);
    });
  }
}

export const permissionsBodySchema = registry.register(
  'PermissionsBody',
  z
    .object({
      visibility: z.enum(['PUBLIC', 'RESTRICTED']),
      viewers: z.array(principalSchema).max(MAX_PRINCIPALS).default([]),
      editors: z.array(principalSchema).max(MAX_PRINCIPALS).default([]),
    })
    .superRefine(checkPermissions),
);

/** The `permissions` field of a multipart form is a JSON string. */
const permissionsFieldSchema = z
  .string()
  .transform((text, context): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      context.addIssue({ code: 'custom', message: 'The permissions field must be valid JSON' });
      return z.NEVER;
    }
  })
  .pipe(permissionsBodySchema);

const DEFAULT_PERMISSIONS: PermissionsBody = { visibility: 'PUBLIC', viewers: [], editors: [] };

/** The text fields of the multipart upload form. */
export const createDocumentBodySchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  tags: tagsSchema.default([]),
  permissions: permissionsFieldSchema.default(DEFAULT_PERMISSIONS),
});

export const updateDocumentBodySchema = registry.register(
  'UpdateDocumentBody',
  z.object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    tags: z.array(tagNameSchema).max(MAX_TAGS, TOO_MANY_TAGS).optional(),
  }),
);

export const createVersionBodySchema = z.object({
  changeNote: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((text) => (text === '' ? undefined : text)),
});

// Strict, so that a wrong parameter name such as `tags[]` gives 400.
export const listDocumentsQuerySchema = z.strictObject({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .meta({ description: 'Fuzzy match on title, description, file name, tags and owner' }),
  tags: repeatedParam(tagNameSchema)
    .optional()
    .meta({
      description: 'Repeat the parameter for more tags. A document must have all the tags.',
    }),
  ownerIds: repeatedParam(idSchema)
    .optional()
    .meta({ description: 'Repeat the parameter for more owners. A document matches any owner.' }),
  sort: z
    .enum(['relevance', 'lastVersionAt', 'title', 'owner', 'size', 'createdAt'])
    .optional()
    .meta({ description: 'Default: relevance with `search`, else lastVersionAt' }),
  order: sortOrderSchema
    .optional()
    .meta({ description: 'Default: desc for dates, size and relevance, else asc' }),
  ...pageQueryShape,
});

export const versionParamsSchema = z.object({ id: idSchema, versionId: idSchema });

export const contentQuerySchema = z.object({
  disposition: z
    .enum(['inline', 'attachment'])
    .default('attachment')
    .meta({ description: 'Only PDF files and images can open inline' }),
});

export type PermissionsInput = z.infer<typeof permissionsBodySchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentBodySchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;

// ---- OpenAPI ----

const binaryFileSchema = z.string().meta({ type: 'string', format: 'binary' });

const createDocumentFormSchema = z.object({
  file: binaryFileSchema.meta({
    description: 'pdf, png, jpg, jpeg, webp, docx, xlsx, pptx, txt or csv. Maximum 25 MB.',
  }),
  title: z.string().meta({ example: 'Travel Policy' }),
  description: z.string().optional(),
  tags: z
    .array(z.string())
    .optional()
    .meta({ description: 'Repeat the field for more tags. Maximum 10.' }),
  permissions: z
    .string()
    .optional()
    .meta({
      description: 'JSON of PermissionsBody. Default: public, no viewers, no editors.',
      example: '{"visibility":"PUBLIC","viewers":[],"editors":[]}',
    }),
});

const createVersionFormSchema = z.object({
  file: binaryFileSchema,
  changeNote: z.string().optional(),
});

const principalResponseSchema = principalSchema.extend({ name: z.string() });

const versionSchema = registry.register(
  'DocumentVersion',
  z.object({
    id: idSchema,
    documentId: idSchema,
    versionNumber: z.number().int(),
    originalFilename: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    checksumSha256: z.string(),
    changeNote: z.string().nullable(),
    createdAt: dateTimeSchema,
    uploadedBy: namedRefSchema,
  }),
);

const documentListItemSchema = registry.register(
  'DocumentListItem',
  z.object({
    id: idSchema,
    title: z.string(),
    description: z.string().nullable(),
    visibility: z.enum(['PUBLIC', 'RESTRICTED']),
    owner: namedRefSchema,
    tags: z.array(z.string()),
    currentVersion: z.object({
      versionNumber: z.number().int(),
      originalFilename: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number().int(),
    }),
    lastVersionAt: dateTimeSchema,
    createdAt: dateTimeSchema,
    canWrite: z.boolean(),
    canManage: z.boolean(),
  }),
);

const documentSchema = registry.register(
  'Document',
  z.object({
    id: idSchema,
    title: z.string(),
    description: z.string().nullable(),
    visibility: z.enum(['PUBLIC', 'RESTRICTED']),
    tags: z.array(z.string()),
    owner: namedRefSchema.extend({ email: z.string() }),
    currentVersion: versionSchema.omit({ documentId: true }),
    viewers: z.array(principalResponseSchema),
    editors: z.array(principalResponseSchema),
    lastVersionAt: dateTimeSchema,
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
    canWrite: z.boolean(),
    canManage: z.boolean(),
  }),
);

const documentParams = { params: idParamsSchema };

registry.registerPath({
  method: 'get',
  path: '/documents',
  tags: ['Documents'],
  summary: 'Search documents',
  description: 'Returns only the documents that you can read.',
  security: signedIn,
  request: { query: listDocumentsQuerySchema },
  responses: {
    200: listResponse('A page of documents', documentListItemSchema),
    ...errorResponses([400, 401]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/documents',
  tags: ['Documents'],
  summary: 'Upload a new document',
  security: signedIn,
  request: { body: { content: { 'multipart/form-data': { schema: createDocumentFormSchema } } } },
  responses: {
    201: dataResponse('The new document', documentSchema),
    ...errorResponses([400, 401, 413, 415]),
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents/{id}',
  tags: ['Documents'],
  summary: 'Get a document',
  security: signedIn,
  request: documentParams,
  responses: {
    200: dataResponse('The document', documentSchema),
    ...errorResponses([400, 401, 404]),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/documents/{id}',
  tags: ['Documents'],
  summary: 'Edit the title, description and tags',
  description: 'Needs write access: admin, owner or editor.',
  security: signedIn,
  request: { ...documentParams, body: { content: jsonContent(updateDocumentBodySchema) } },
  responses: {
    200: dataResponse('The updated document', documentSchema),
    ...errorResponses([400, 401, 403, 404]),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/documents/{id}',
  tags: ['Documents'],
  summary: 'Delete a document',
  description: 'Needs manage access: admin or owner.',
  security: signedIn,
  request: documentParams,
  responses: {
    204: { description: 'Deleted' },
    ...errorResponses([400, 401, 403, 404]),
  },
});

registry.registerPath({
  method: 'put',
  path: '/documents/{id}/permissions',
  tags: ['Documents'],
  summary: 'Set the visibility, viewers and editors',
  description:
    'Needs manage access: admin or owner. Replaces all grants, so send the editors again ' +
    'to keep them. A public document cannot have viewers.',
  security: signedIn,
  request: { ...documentParams, body: { content: jsonContent(permissionsBodySchema) } },
  responses: {
    200: dataResponse('The updated document', documentSchema),
    ...errorResponses([400, 401, 403, 404]),
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents/{id}/versions',
  tags: ['Versions'],
  summary: 'List the versions of a document',
  security: signedIn,
  request: documentParams,
  responses: {
    200: dataResponse('All versions, newest first', z.array(versionSchema)),
    ...errorResponses([400, 401, 404]),
  },
});

registry.registerPath({
  method: 'post',
  path: '/documents/{id}/versions',
  tags: ['Versions'],
  summary: 'Upload a new version',
  description: 'Needs write access: admin, owner or editor. The new version becomes current.',
  security: signedIn,
  request: {
    ...documentParams,
    body: { content: { 'multipart/form-data': { schema: createVersionFormSchema } } },
  },
  responses: {
    201: dataResponse('The new version', versionSchema),
    ...errorResponses([400, 401, 403, 404, 409, 413, 415]),
  },
});

registry.registerPath({
  method: 'get',
  path: '/documents/{id}/versions/{versionId}/content',
  tags: ['Versions'],
  summary: 'Download or view the file of a version',
  security: signedIn,
  request: { params: versionParamsSchema, query: contentQuerySchema },
  responses: {
    200: {
      description: 'The file',
      content: { 'application/octet-stream': { schema: binaryFileSchema } },
    },
    ...errorResponses([400, 401, 404]),
  },
});
