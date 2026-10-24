import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import type { Visibility } from '../generated/prisma/enums.js';
import { containsPattern, orderKeyword, whereAll } from '../utils/search.js';
import type { AuthUser } from '../types/auth.js';
import type { ListResult, PageWindow } from '../types/common.js';
import type {
  DocumentListItem,
  DocumentSearchFilters,
  DocumentSortField,
} from '../types/document.js';

const documentDetailSelect = {
  id: true,
  title: true,
  description: true,
  visibility: true,
  lastVersionAt: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  currentVersion: {
    select: {
      id: true,
      versionNumber: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      checksumSha256: true,
      changeNote: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  },
  tags: true,
  permissions: {
    select: {
      level: true,
      user: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.DocumentSelect;

export type DocumentDetailRecord = Prisma.DocumentGetPayload<{
  select: typeof documentDetailSelect;
}>;

interface DocumentCreate {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  visibility: Visibility;
  tags: string[];
}

type DocumentUpdate = Partial<{
  title: string;
  description: string | null;
  visibility: Visibility;
  tags: string[];
  currentVersionId: string;
  lastVersionAt: Date;
}>;

export async function findById(
  id: string,
  db: DbClient = prisma,
): Promise<DocumentDetailRecord | null> {
  return db.document.findFirst({ where: { id, deletedAt: null }, select: documentDetailSelect });
}

export async function create(data: DocumentCreate, db: DbClient = prisma): Promise<void> {
  await db.document.create({ data });
}

export async function update(
  id: string,
  data: DocumentUpdate,
  db: DbClient = prisma,
): Promise<void> {
  await db.document.update({ where: { id }, data });
}

export async function softDelete(id: string, db: DbClient = prisma): Promise<void> {
  await db.document.update({ where: { id }, data: { deletedAt: new Date() } });
}

interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  ownerId: string;
  ownerName: string;
  tags: string[];
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  lastVersionAt: Date;
  createdAt: Date;
  canWrite: boolean;
  canManage: boolean;
}

export async function search(
  viewer: AuthUser,
  filters: DocumentSearchFilters,
  page: PageWindow,
  db: DbClient = prisma,
): Promise<ListResult<DocumentListItem>> {
  const isAdmin = viewer.role === 'ADMIN';
  const grantedToViewer = Prisma.sql`(
    p.user_id = ${viewer.id}::uuid
    OR p.department_id = ANY(${viewer.departmentIds}::uuid[])
  )`;
  const term = filters.search?.trim();

  const conditions: Prisma.Sql[] = [Prisma.sql`d.deleted_at IS NULL`];

  if (!isAdmin) {
    conditions.push(Prisma.sql`(
      d.owner_id = ${viewer.id}::uuid
      OR d.visibility = 'PUBLIC'
      OR EXISTS (
        SELECT 1 FROM document_permissions p
        WHERE p.document_id = d.id AND ${grantedToViewer}
      )
    )`);
  }
  if (filters.ownerIds?.length) {
    conditions.push(Prisma.sql`d.owner_id = ANY(${filters.ownerIds}::uuid[])`);
  }
  if (filters.tags?.length) {
    conditions.push(Prisma.sql`d.tags && ${filters.tags}::text[]`);
  }
  if (term) {
    const pattern = containsPattern(term);
    conditions.push(Prisma.sql`(
      d.title ILIKE ${pattern} OR d.description ILIKE ${pattern}
      OR v.original_filename ILIKE ${pattern} OR o.name ILIKE ${pattern}
      OR ${term} <% d.title OR ${term} <% d.description
      OR ${term} <% v.original_filename OR ${term} <% o.name
      OR EXISTS (
        SELECT 1 FROM unnest(d.tags) AS t(name)
        WHERE t.name ILIKE ${pattern} OR ${term} <% t.name
      )
    )`);
  }

  const where = whereAll(conditions);
  const direction = orderKeyword(filters.order);
  const sortColumns: Record<Exclude<DocumentSortField, 'relevance'>, Prisma.Sql> = {
    lastVersionAt: Prisma.sql`d.last_version_at`,
    title: Prisma.sql`lower(d.title)`,
    owner: Prisma.sql`lower(o.name)`,
    size: Prisma.sql`v.size_bytes`,
    createdAt: Prisma.sql`d.created_at`,
  };
  const sortField = filters.sort === 'relevance' ? 'lastVersionAt' : filters.sort;
  let orderBy = Prisma.sql`${sortColumns[sortField]} ${direction}`;
  if (filters.sort === 'relevance' && term) {
    // A title that contains the exact term comes first. Then the best fuzzy score sorts the rest.
    // Tags and description have a lower weight.
    orderBy = Prisma.sql`(d.title ILIKE ${containsPattern(term)})::int + GREATEST(
      word_similarity(${term}, d.title),
      word_similarity(${term}, v.original_filename),
      word_similarity(${term}, o.name),
      0.8 * word_similarity(${term}, coalesce(d.description, '')),
      0.9 * (SELECT coalesce(max(word_similarity(${term}, t.name)), 0)
       FROM unnest(d.tags) AS t(name))
    ) DESC, d.last_version_at DESC`;
  }

  const from = Prisma.sql`
    FROM documents d
    JOIN users o ON o.id = d.owner_id
    JOIN document_versions v ON v.id = d.current_version_id`;

  const [rows, countRows] = await Promise.all([
    db.$queryRaw<DocumentRow[]>`
      SELECT d.id, d.title, d.description, d.visibility,
             o.id AS "ownerId", o.name AS "ownerName", d.tags,
             v.version_number AS "versionNumber", v.original_filename AS "originalFilename",
             v.mime_type AS "mimeType", v.size_bytes AS "sizeBytes",
             d.last_version_at AS "lastVersionAt", d.created_at AS "createdAt",
             (${isAdmin} OR d.owner_id = ${viewer.id}::uuid OR EXISTS (
               SELECT 1 FROM document_permissions p
               WHERE p.document_id = d.id AND p.level = 'EDIT' AND ${grantedToViewer}
             )) AS "canWrite",
             (${isAdmin} OR d.owner_id = ${viewer.id}::uuid) AS "canManage"
      ${from}
      WHERE ${where}
      ORDER BY ${orderBy}, d.id
      LIMIT ${page.take} OFFSET ${page.skip}`,
    db.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      ${from}
      WHERE ${where}`,
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      visibility: row.visibility,
      owner: { id: row.ownerId, name: row.ownerName },
      tags: row.tags,
      currentVersion: {
        versionNumber: row.versionNumber,
        originalFilename: row.originalFilename,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
      },
      lastVersionAt: row.lastVersionAt,
      createdAt: row.createdAt,
      canWrite: row.canWrite,
      canManage: row.canManage,
    })),
    total: countRows[0]?.total ?? 0,
  };
}
