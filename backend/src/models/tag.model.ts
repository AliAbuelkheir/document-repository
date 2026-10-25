import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';

export interface TagRecord {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagSummary {
  id: string;
  name: string;
  isActive: boolean;
}

const tagSelect = { id: true, name: true, isActive: true, createdAt: true, updatedAt: true };

export async function findAll(
  filters: { search?: string; isActive?: boolean } = {},
  db: DbClient = prisma,
): Promise<TagRecord[]> {
  return db.tag.findMany({
    where: {
      ...(filters.search && { name: { contains: filters.search, mode: 'insensitive' } }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    },
    select: tagSelect,
    orderBy: { name: 'asc' },
  });
}

export async function findById(id: string, db: DbClient = prisma): Promise<TagRecord | null> {
  return db.tag.findUnique({ where: { id }, select: tagSelect });
}

export async function create(name: string, db: DbClient = prisma): Promise<TagRecord> {
  return db.tag.create({ data: { name }, select: tagSelect });
}

export async function setActive(
  id: string,
  isActive: boolean,
  db: DbClient = prisma,
): Promise<TagRecord> {
  return db.tag.update({ where: { id }, data: { isActive }, select: tagSelect });
}

export async function findByNames(names: string[], db: DbClient = prisma): Promise<TagSummary[]> {
  if (names.length === 0) return [];
  return db.tag.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, isActive: true },
  });
}
