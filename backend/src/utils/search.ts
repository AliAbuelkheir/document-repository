import { Prisma } from '../generated/prisma/client.js';
import type { SortOrder } from '../types/common.js';

/** `%term%` with LIKE wildcards in the user's input escaped. */
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function orderKeyword(order: SortOrder): Prisma.Sql {
  return Prisma.raw(order === 'asc' ? 'ASC' : 'DESC');
}

export function whereAll(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length > 0 ? Prisma.join(conditions, ' AND ') : Prisma.sql`TRUE`;
}
