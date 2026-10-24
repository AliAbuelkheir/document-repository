import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';

export interface DepartmentRecord {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DepartmentWrite {
  name: string;
  description?: string | null;
}

const withUserCount = { _count: { select: { users: true } } } as const;

function toRecord(row: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { users: number };
}): DepartmentRecord {
  const { _count, ...department } = row;
  return { ...department, userCount: _count.users };
}

export async function findAll(db: DbClient = prisma): Promise<DepartmentRecord[]> {
  const rows = await db.department.findMany({
    include: withUserCount,
    orderBy: { name: 'asc' },
  });
  return rows.map(toRecord);
}

export async function findById(
  id: string,
  db: DbClient = prisma,
): Promise<DepartmentRecord | null> {
  const row = await db.department.findUnique({ where: { id }, include: withUserCount });
  return row ? toRecord(row) : null;
}

export async function findExistingIds(ids: string[], db: DbClient = prisma): Promise<string[]> {
  const rows = await db.department.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((row) => row.id);
}

export async function create(
  data: DepartmentWrite,
  db: DbClient = prisma,
): Promise<DepartmentRecord> {
  return toRecord(await db.department.create({ data, include: withUserCount }));
}

export async function update(
  id: string,
  data: Partial<DepartmentWrite>,
  db: DbClient = prisma,
): Promise<DepartmentRecord> {
  return toRecord(await db.department.update({ where: { id }, data, include: withUserCount }));
}

export async function remove(id: string, db: DbClient = prisma): Promise<void> {
  await db.department.delete({ where: { id } });
}
