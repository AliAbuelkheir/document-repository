import { z } from 'zod';

import {
  ALLOWED_EXTENSIONS,
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE_BYTES,
  MAX_TAG_LENGTH,
  MAX_TAGS,
} from '@/lib/constants';

function hasAllowedExtension(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return file.name.includes('.') && ALLOWED_EXTENSIONS.includes(extension);
}

/** The same extension and size checks as the API, so the user sees mistakes before the upload. */
function findFileProblem(file: File | undefined): string | undefined {
  if (file === undefined) {
    return 'Select a file';
  }
  if (!hasAllowedExtension(file)) {
    return `Use one of these file types: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size === 0) {
    return 'The file is empty';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'The file is too large. The maximum size is 25 MB.';
  }
  return undefined;
}

/** The form keeps `undefined` until the user selects a file. A valid value is a `File`. */
export const fileSchema = z
  .custom<File | undefined>((value) => value === undefined || value instanceof File)
  .transform((file, context): File => {
    const problem = findFileProblem(file);
    if (file === undefined || problem !== undefined) {
      context.addIssue({ code: 'custom', message: problem ?? 'Select a file' });
      return z.NEVER;
    }
    return file;
  });

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Enter a title')
  .max(200, 'The title can have at most 200 characters');

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'The description can have at most 2000 characters');

export const tagsSchema = z
  .array(z.string().trim().min(1).max(MAX_TAG_LENGTH))
  .max(MAX_TAGS, `A document can have at most ${MAX_TAGS} tags`);

const principalSchema = z.object({
  type: z.enum(['USER', 'DEPARTMENT']),
  id: z.string(),
  name: z.string(),
});

const visibilitySchema = z.enum(['PUBLIC', 'RESTRICTED']);

interface AccessValues {
  visibility: 'PUBLIC' | 'RESTRICTED';
  viewers: unknown[];
}

function checkPublicHasNoViewers(values: AccessValues, context: z.RefinementCtx): void {
  if (values.visibility === 'PUBLIC' && values.viewers.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['viewers'],
      message: 'A public document cannot have viewers',
    });
  }
}

export const accessFormSchema = z
  .object({
    visibility: visibilitySchema,
    viewers: z.array(principalSchema),
    editors: z.array(principalSchema),
  })
  .superRefine(checkPublicHasNoViewers);

export type AccessFormValues = z.infer<typeof accessFormSchema>;

export const uploadFormSchema = z
  .object({
    file: fileSchema,
    title: titleSchema,
    description: descriptionSchema,
    tags: tagsSchema,
    visibility: visibilitySchema,
    viewers: z.array(principalSchema),
    editors: z.array(principalSchema),
  })
  .superRefine(checkPublicHasNoViewers);

export type UploadFormInput = z.input<typeof uploadFormSchema>;
export type UploadFormValues = z.output<typeof uploadFormSchema>;

export const editDocumentFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  tags: tagsSchema,
});

export type EditDocumentFormValues = z.infer<typeof editDocumentFormSchema>;

export const newVersionFormSchema = z.object({
  file: fileSchema,
  changeNote: z.string().trim().max(500, 'The note can have at most 500 characters'),
});

export type NewVersionFormInput = z.input<typeof newVersionFormSchema>;
export type NewVersionFormValues = z.output<typeof newVersionFormSchema>;

// ---- The query string of the documents page ----

const documentSortSchema = z.enum([
  'relevance',
  'lastVersionAt',
  'title',
  'owner',
  'size',
  'createdAt',
]);

/** Each value that is not valid gets its default, so a bad link still opens the page. */
export const documentListQuerySchema = z.object({
  search: z.string().trim().max(200).optional().catch(undefined),
  tags: z.array(z.string().trim().min(1).max(MAX_TAG_LENGTH)).max(100).catch([]),
  ownerIds: z.array(z.uuid()).max(100).catch([]),
  fileTypes: z.array(z.enum(ALLOWED_EXTENSIONS)).max(100).catch([]),
  sort: documentSortSchema.optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(DEFAULT_PAGE_SIZE),
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

export function parseDocumentListQuery(searchParams: URLSearchParams): DocumentListQuery {
  return documentListQuerySchema.parse({
    search: searchParams.get('search') ?? undefined,
    tags: searchParams.getAll('tags'),
    ownerIds: searchParams.getAll('ownerIds'),
    fileTypes: searchParams.getAll('fileTypes'),
    sort: searchParams.get('sort') ?? undefined,
    order: searchParams.get('order') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
}

/** The version number in `?version=N` of the document page, or undefined for the current one. */
export function parseVersionNumber(searchParams: URLSearchParams): number | undefined {
  return z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .catch(undefined)
    .parse(searchParams.get('version') ?? undefined);
}
