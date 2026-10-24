import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

const versionSelect = {
  id: true,
  documentId: true,
  versionNumber: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  checksumSha256: true,
  changeNote: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} satisfies Prisma.DocumentVersionSelect;

export type DocumentVersionRecord = Prisma.DocumentVersionGetPayload<{
  select: typeof versionSelect;
}>;

export interface DocumentVersionCreate {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  changeNote?: string | null;
  uploadedById: string;
}

export async function listByDocument(
  documentId: string,
  db: DbClient = prisma,
): Promise<DocumentVersionRecord[]> {
  return db.documentVersion.findMany({
    where: { documentId },
    select: versionSelect,
    orderBy: { versionNumber: 'desc' },
  });
}

export async function findById(
  documentId: string,
  versionId: string,
  db: DbClient = prisma,
): Promise<DocumentVersionRecord | null> {
  return db.documentVersion.findFirst({
    where: { id: versionId, documentId },
    select: versionSelect,
  });
}

/**
 * Highest version number of the document, or 0 if it has no versions.
 * Call it inside the transaction that inserts the next version.
 */
export async function findLatestNumber(documentId: string, db: DbClient = prisma): Promise<number> {
  const result = await db.documentVersion.aggregate({
    where: { documentId },
    _max: { versionNumber: true },
  });
  return result._max.versionNumber ?? 0;
}

export async function create(
  data: DocumentVersionCreate,
  db: DbClient = prisma,
): Promise<DocumentVersionRecord> {
  return db.documentVersion.create({ data, select: versionSelect });
}
