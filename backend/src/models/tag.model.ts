import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';

export interface TagRecord {
  id: string;
  name: string;
  isActive: boolean;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagSummary {
  id: string;
  name: string;
  isActive: boolean;
}

async function withDocumentCounts(
  rows: Omit<TagRecord, 'documentCount'>[],
  db: DbClient,
): Promise<TagRecord[]> {
  if (rows.length === 0) return [];
  const counts = await db.$queryRaw<{ name: string; count: number }[]>`
    SELECT n.name, COUNT(d.id)::int AS count
    FROM unnest(${rows.map((row) => row.name)}::text[]) AS n(name)
    LEFT JOIN documents d ON d.deleted_at IS NULL AND d.tags @> ARRAY[n.name]
    GROUP BY n.name`;
  const byName = new Map(counts.map((row) => [row.name, row.count]));
  return rows.map((row) => ({ ...row, documentCount: byName.get(row.name) ?? 0 }));
}

async function withDocumentCount(
  row: Omit<TagRecord, 'documentCount'>,
  db: DbClient,
): Promise<TagRecord> {
  const [tag] = await withDocumentCounts([row], db);
  return tag ?? { ...row, documentCount: 0 };
}

const tagSelect = { id: true, name: true, isActive: true, createdAt: true, updatedAt: true };

export async function findAll(
  filters: { search?: string; isActive?: boolean } = {},
  db: DbClient = prisma,
): Promise<TagRecord[]> {
  const rows = await db.tag.findMany({
    where: {
      ...(filters.search && { name: { contains: filters.search, mode: 'insensitive' } }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    },
    select: tagSelect,
    orderBy: { name: 'asc' },
  });
  return withDocumentCounts(rows, db);
}

export async function findById(id: string, db: DbClient = prisma): Promise<TagRecord | null> {
  const row = await db.tag.findUnique({ where: { id }, select: tagSelect });
  if (!row) return null;
  return withDocumentCount(row, db);
}

export async function create(name: string, db: DbClient = prisma): Promise<TagRecord> {
  const row = await db.tag.create({ data: { name }, select: tagSelect });
  return { ...row, documentCount: 0 };
}

export async function setActive(
  id: string,
  isActive: boolean,
  db: DbClient = prisma,
): Promise<TagRecord> {
  const row = await db.tag.update({ where: { id }, data: { isActive }, select: tagSelect });
  return withDocumentCount(row, db);
}

export async function findByNames(names: string[], db: DbClient = prisma): Promise<TagSummary[]> {
  if (names.length === 0) return [];
  return db.tag.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, isActive: true },
  });
}
