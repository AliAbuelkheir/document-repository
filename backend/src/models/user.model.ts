import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Role } from '../generated/prisma/enums.js';
import { containsPattern, orderKeyword, whereAll } from '../utils/search.js';
import type { ListResult, NamedRef, NonEmptyArray, PageWindow } from '../types/common.js';
import type { UserListItem, UserSearchFilters, UserSortField } from '../types/user.js';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  departments: {
    select: { department: { select: { id: true, name: true } } },
    orderBy: { department: { name: 'asc' } },
  },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export type UserRecord = Omit<UserRow, 'departments'> & {
  departments: NamedRef[];
};

function toRecord({ departments, ...user }: UserRow): UserRecord {
  return { ...user, departments: departments.map(({ department }) => department) };
}

export interface UserWithPassword {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentIds: string[];
  isActive: boolean;
  password: string;
}

interface UserCreate {
  email: string;
  name: string;
  password: string;
  role: Role;
  departmentIds: NonEmptyArray<string>;
}

type UserUpdate = Partial<UserCreate & { isActive: boolean }>;

export async function findById(id: string, db: DbClient = prisma): Promise<UserRecord | null> {
  const row = await db.user.findUnique({ where: { id }, select: userSelect });
  return row ? toRecord(row) : null;
}

export async function findByEmailWithPassword(
  email: string,
  db: DbClient = prisma,
): Promise<UserWithPassword | null> {
  const row = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      password: true,
      departments: { select: { departmentId: true } },
    },
  });
  if (!row) return null;
  const { departments, ...user } = row;
  return { ...user, departmentIds: departments.map(({ departmentId }) => departmentId) };
}

export async function findIdByEmail(email: string, db: DbClient = prisma): Promise<string | null> {
  const row = await db.user.findUnique({ where: { email }, select: { id: true } });
  return row?.id ?? null;
}

export async function findActiveIds(ids: string[], db: DbClient = prisma): Promise<string[]> {
  const rows = await db.user.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

const departmentLinks = (departmentIds: NonEmptyArray<string>) =>
  departmentIds.map((departmentId) => ({ departmentId }));

export async function create(
  { departmentIds, ...data }: UserCreate,
  db: DbClient = prisma,
): Promise<UserRecord> {
  const row = await db.user.create({
    data: { ...data, departments: { create: departmentLinks(departmentIds) } },
    select: userSelect,
  });
  return toRecord(row);
}

export async function update(
  id: string,
  { departmentIds, ...data }: UserUpdate,
  db: DbClient = prisma,
): Promise<UserRecord> {
  const row = await db.user.update({
    where: { id },
    data: {
      ...data,
      ...(departmentIds && {
        departments: { deleteMany: {}, create: departmentLinks(departmentIds) },
      }),
    },
    select: userSelect,
  });
  return toRecord(row);
}

export async function search(
  filters: UserSearchFilters,
  page: PageWindow,
  db: DbClient = prisma,
): Promise<ListResult<UserListItem>> {
  const term = filters.search?.trim();
  const conditions: Prisma.Sql[] = [];

  if (term) {
    const pattern = containsPattern(term);
    conditions.push(Prisma.sql`(
      u.name ILIKE ${pattern} OR u.email ILIKE ${pattern}
      OR ${term} <% u.name OR ${term} <% u.email
    )`);
  }
  if (filters.departmentIds?.length) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM user_departments ud
      WHERE ud.user_id = u.id AND ud.department_id = ANY(${filters.departmentIds}::uuid[])
    )`);
  }
  if (filters.role) {
    conditions.push(Prisma.sql`u.role = ${filters.role}::user_role`);
  }
  if (filters.isActive !== undefined) {
    conditions.push(Prisma.sql`u.is_active = ${filters.isActive}`);
  }

  const where = whereAll(conditions);
  const direction = orderKeyword(filters.order);
  const sortColumns: Record<Exclude<UserSortField, 'relevance'>, Prisma.Sql> = {
    name: Prisma.sql`lower(u.name)`,
    email: Prisma.sql`u.email`,
    // A user can have many departments. Sort by the first department name in alphabetical order.
    department: Prisma.sql`(
      SELECT min(lower(d.name)) FROM user_departments ud
      JOIN departments d ON d.id = ud.department_id WHERE ud.user_id = u.id
    )`,
    role: Prisma.sql`u.role`,
    createdAt: Prisma.sql`u.created_at`,
  };
  const sortField = filters.sort === 'relevance' ? 'name' : filters.sort;
  let orderBy = Prisma.sql`${sortColumns[sortField]} ${direction}`;
  if (filters.sort === 'relevance' && term) {
    orderBy = Prisma.sql`
      GREATEST(word_similarity(${term}, u.name), word_similarity(${term}, u.email)) DESC,
      lower(u.name) ASC`;
  }

  const [rows, countRows] = await Promise.all([
    db.$queryRaw<UserListItem[]>`
      SELECT u.id, u.email, u.name, u.role,
             u.is_active AS "isActive", u.created_at AS "createdAt",
             coalesce((
               SELECT json_agg(
                 json_build_object('id', d.id, 'name', d.name::text) ORDER BY d.name
               )
               FROM user_departments ud JOIN departments d ON d.id = ud.department_id
               WHERE ud.user_id = u.id
             ), '[]'::json) AS departments
      FROM users u
      WHERE ${where}
      ORDER BY ${orderBy}, u.id
      LIMIT ${page.take} OFFSET ${page.skip}`,
    db.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM users u
      WHERE ${where}`,
  ]);

  return {
    items: rows,
    total: countRows[0]?.total ?? 0,
  };
}
