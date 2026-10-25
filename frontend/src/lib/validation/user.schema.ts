import { z } from 'zod';

import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(100, 'The name can have at most 100 characters');
const emailSchema = z.email('Enter a valid email address').max(254);
const roleSchema = z.enum(['ADMIN', 'USER']);
const departmentIdsSchema = z.array(z.string()).min(1, 'Select at least one department');

export const createUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z
    .string()
    .min(8, 'The password must have at least 8 characters')
    .max(72, 'The password can have at most 72 characters'),
  role: roleSchema,
  departmentIds: departmentIdsSchema,
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  // Empty means: keep the current password.
  password: z
    .string()
    .max(72, 'The password can have at most 72 characters')
    .refine(
      (password) => password === '' || password.length >= 8,
      'The password must have at least 8 characters',
    ),
  role: roleSchema,
  isActive: z.boolean(),
  departmentIds: departmentIdsSchema,
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

// ---- The query string of the users tab ----

const userSortSchema = z.enum([
  'relevance',
  'name',
  'email',
  'department',
  'role',
  'isActive',
  'createdAt',
]);

export const userStatusSchema = z.enum(['active', 'inactive']);

/** Each value that is not valid gets its default, so a bad link still opens the page. */
export const userListQuerySchema = z.object({
  search: z.string().trim().max(200).optional().catch(undefined),
  departmentIds: z.array(z.uuid()).max(100).catch([]),
  role: roleSchema.optional().catch(undefined),
  status: userStatusSchema.optional().catch(undefined),
  sort: userSortSchema.optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(DEFAULT_PAGE_SIZE),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export function parseUserListQuery(searchParams: URLSearchParams): UserListQuery {
  return userListQuerySchema.parse({
    search: searchParams.get('search') ?? undefined,
    departmentIds: searchParams.getAll('departmentIds'),
    role: searchParams.get('role') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    order: searchParams.get('order') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
}
