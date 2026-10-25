import { randomUUIDv7 } from 'node:crypto';
import type { Readable } from 'node:stream';

import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../errors/app-error.js';
import { ErrorCode } from '../errors/error-codes.js';
import type { PermissionLevel } from '../generated/prisma/enums.js';
import * as departmentModel from '../models/department.model.js';
import * as documentPermissionModel from '../models/document-permission.model.js';
import type { PermissionGrant } from '../models/document-permission.model.js';
import * as documentVersionModel from '../models/document-version.model.js';
import type { DocumentVersionRecord } from '../models/document-version.model.js';
import * as documentModel from '../models/document.model.js';
import type { DocumentDetailRecord } from '../models/document.model.js';
import * as tagModel from '../models/tag.model.js';
import * as userModel from '../models/user.model.js';
import type { FieldIssue, ListResponse } from '../types/api.js';
import type { AuthUser } from '../types/auth.js';
import type { Json, SortOrder } from '../types/common.js';
import type {
  DocumentDetail,
  DocumentListItem,
  DocumentSearchFilters,
  DocumentSortField,
  Principal,
  UploadedFile,
} from '../types/document.js';
import { SEARCH_TTL_SECONDS, cached, hashParams, invalidate } from '../utils/cache.js';
import { detectMimeType } from '../utils/file-types.js';
import { toListResponse, toPageWindow } from '../utils/pagination.js';
import { canManage, canRead, canWrite } from '../utils/permissions.js';
import type { DocumentAccess } from '../utils/permissions.js';
import {
  hashFile,
  openVersionFile,
  removeVersionFile,
  storeVersionFile,
} from '../utils/storage.js';
import type {
  CreateDocumentInput,
  ListDocumentsQuery,
  PermissionsInput,
  UpdateDocumentInput,
} from '../validators/document.schema.js';

type CachedDocument = Json<DocumentDetailRecord>;
type CachedPermission = CachedDocument['permissions'][number];

// ---- Read and access checks ----

function loadDocument(id: string): Promise<CachedDocument | null> {
  return cached({ group: 'documents', name: 'doc', key: id }, () => documentModel.findById(id));
}

function toAccess(document: CachedDocument): DocumentAccess {
  return {
    ownerId: document.owner.id,
    visibility: document.visibility,
    grants: document.permissions.map((permission) => ({
      level: permission.level,
      userId: permission.user?.id ?? null,
      departmentId: permission.department?.id ?? null,
    })),
  };
}

/** Sends 404 if the user cannot read the document, so the response does not show that it exists. */
async function findReadableDocument(user: AuthUser, id: string): Promise<CachedDocument> {
  const document = await loadDocument(id);
  if (!document || !canRead(user, toAccess(document))) {
    throw new NotFoundError('Document not found');
  }
  return document;
}

async function findWritableDocument(user: AuthUser, id: string): Promise<CachedDocument> {
  const document = await findReadableDocument(user, id);
  if (!canWrite(user, toAccess(document))) {
    throw new ForbiddenError('Only the owner, an editor or an admin can change this document');
  }
  return document;
}

async function findManageableDocument(user: AuthUser, id: string): Promise<CachedDocument> {
  const document = await findReadableDocument(user, id);
  if (!canManage(user, toAccess(document))) {
    throw new ForbiddenError('Only the owner or an admin can do this');
  }
  return document;
}

function toPrincipal(permission: CachedPermission): Principal {
  if (permission.user) {
    return { type: 'USER', id: permission.user.id, name: permission.user.name };
  }
  if (permission.department) {
    return { type: 'DEPARTMENT', id: permission.department.id, name: permission.department.name };
  }
  throw new Error('A document permission has no user and no department');
}

function principalsWithLevel(document: CachedDocument, level: PermissionLevel): Principal[] {
  return document.permissions
    .filter((permission) => permission.level === level)
    .map(toPrincipal);
}

function toDetail(user: AuthUser, document: CachedDocument): DocumentDetail {
  const access = toAccess(document);
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    visibility: document.visibility,
    tags: document.tags,
    owner: document.owner,
    currentVersion: document.currentVersion,
    lastVersionAt: document.lastVersionAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    viewers: principalsWithLevel(document, 'VIEW'),
    editors: principalsWithLevel(document, 'EDIT'),
    canWrite: canWrite(user, access),
    canManage: canManage(user, access),
  };
}

export async function getDocument(user: AuthUser, id: string): Promise<DocumentDetail> {
  return toDetail(user, await findReadableDocument(user, id));
}

function defaultSort(search: string | undefined): DocumentSortField {
  if (search) {
    return 'relevance';
  }
  return 'lastVersionAt';
}

function defaultOrder(sort: DocumentSortField): SortOrder {
  if (sort === 'title' || sort === 'owner') {
    return 'asc';
  }
  return 'desc';
}

export async function listDocuments(
  user: AuthUser,
  query: ListDocumentsQuery,
): Promise<ListResponse<Json<DocumentListItem>>> {
  const sort = query.sort ?? defaultSort(query.search);
  let tags: string[] | undefined;
  if (query.tags !== undefined) {
    // Documents store default tags with the default spelling, so the filter uses it too.
    tags = await normalizeTags(query.tags);
  }
  const filters: DocumentSearchFilters = {
    search: query.search,
    tags,
    ownerIds: query.ownerIds,
    sort,
    order: query.order ?? defaultOrder(sort),
  };
  const page = { page: query.page, pageSize: query.pageSize };
  // The results depend on the permissions of the user, so each user has separate keys.
  const result = await cached(
    {
      group: 'documents',
      name: 'search',
      key: `${user.id}:${hashParams({ filters, page })}`,
      ttlSeconds: SEARCH_TTL_SECONDS,
    },
    () => documentModel.search(user, filters, toPageWindow(page)),
  );
  return toListResponse(result, page);
}

export async function listVersions(
  user: AuthUser,
  id: string,
): Promise<DocumentVersionRecord[]> {
  await findReadableDocument(user, id);
  return documentVersionModel.listByDocument(id);
}

export interface VersionContent {
  version: DocumentVersionRecord;
  stream: Readable;
}

export async function openVersionContent(
  user: AuthUser,
  id: string,
  versionId: string,
): Promise<VersionContent> {
  await findReadableDocument(user, id);
  const version = await documentVersionModel.findById(id, versionId);
  if (!version) {
    throw new NotFoundError('Version not found');
  }
  const stream = await openVersionFile(id, version.versionNumber);
  return { version, stream };
}

// ---- Input checks ----

/** Checks the content of the uploaded file and returns the MIME type to store. */
async function checkUploadedFile(file: UploadedFile): Promise<string> {
  if (file.sizeBytes === 0) {
    throw new ValidationError('Validation failed', [
      { path: 'file', message: 'The file is empty' },
    ]);
  }
  return detectMimeType(file.path, file.originalName);
}

/**
 * Removes tag names that repeat (without regard to case).
 * A name that matches a default tag gets the spelling of the default tag.
 */
async function normalizeTags(names: string[]): Promise<string[]> {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNames.push(name);
    }
  }

  const defaultTags = await tagModel.findByNames(uniqueNames);
  const defaultSpelling = new Map(defaultTags.map((tag) => [tag.name.toLowerCase(), tag.name]));
  return uniqueNames.map((name) => defaultSpelling.get(name.toLowerCase()) ?? name);
}

interface PrincipalEntry {
  type: 'USER' | 'DEPARTMENT';
  id: string;
  level: PermissionLevel;
  /** The field path for an error message, such as `editors.0.id`. */
  path: string;
}

function toEntries(permissions: PermissionsInput, pathPrefix: string): PrincipalEntry[] {
  const entries: PrincipalEntry[] = [];
  permissions.viewers.forEach((principal, index) => {
    entries.push({ ...principal, level: 'VIEW', path: `${pathPrefix}viewers.${index}.id` });
  });
  permissions.editors.forEach((principal, index) => {
    entries.push({ ...principal, level: 'EDIT', path: `${pathPrefix}editors.${index}.id` });
  });
  return entries;
}

function toGrant(entry: PrincipalEntry): PermissionGrant {
  if (entry.type === 'USER') {
    return { userId: entry.id, level: entry.level };
  }
  return { departmentId: entry.id, level: entry.level };
}

/**
 * Converts viewers and editors to grants. Sends 400 if a user is inactive or an id is unknown.
 * `pathPrefix` is the location of the permissions in the request body, such as `permissions.`.
 */
async function buildGrants(
  permissions: PermissionsInput,
  pathPrefix: string,
): Promise<PermissionGrant[]> {
  const entries = toEntries(permissions, pathPrefix);
  const userIds = entries.filter((entry) => entry.type === 'USER').map((entry) => entry.id);
  const departmentIds = entries
    .filter((entry) => entry.type === 'DEPARTMENT')
    .map((entry) => entry.id);
  const [activeUserIds, existingDepartmentIds] = await Promise.all([
    userModel.findActiveIds(userIds),
    departmentModel.findExistingIds(departmentIds),
  ]);

  const issues: FieldIssue[] = [];
  for (const entry of entries) {
    if (entry.type === 'USER' && !activeUserIds.includes(entry.id)) {
      issues.push({ path: entry.path, message: 'The user does not exist or is not active' });
    }
    if (entry.type === 'DEPARTMENT' && !existingDepartmentIds.includes(entry.id)) {
      issues.push({ path: entry.path, message: 'The department does not exist' });
    }
  }
  if (issues.length > 0) {
    throw new AppError(
      400,
      ErrorCode.INVALID_PRINCIPAL,
      'Some users or departments do not exist or are not active',
      issues,
    );
  }
  return entries.map(toGrant);
}

// ---- Writes ----

/**
 * Runs the database writes of a new version and moves the file to its final path,
 * in one transaction. `writeRows` returns the new version.
 * If the transaction fails after the move, it deletes the moved file.
 */
async function saveVersion(
  tmpPath: string,
  documentId: string,
  writeRows: (tx: DbClient) => Promise<DocumentVersionRecord>,
): Promise<DocumentVersionRecord> {
  // An object, because TypeScript does not see assignments inside the callback.
  const moved: { versionNumber?: number } = {};
  try {
    return await prisma.$transaction(async (tx) => {
      const version = await writeRows(tx);
      await storeVersionFile(tmpPath, documentId, version.versionNumber);
      moved.versionNumber = version.versionNumber;
      return version;
    });
  } catch (err) {
    if (moved.versionNumber !== undefined) {
      await removeVersionFile(documentId, moved.versionNumber);
    }
    throw err;
  }
}

async function invalidateDocumentData(): Promise<void> {
  await invalidate(['documents']);
}

export async function createDocument(
  user: AuthUser,
  file: UploadedFile,
  input: CreateDocumentInput,
): Promise<DocumentDetail> {
  const mimeType = await checkUploadedFile(file);
  const checksumSha256 = await hashFile(file.path);
  const tags = await normalizeTags(input.tags);
  const grants = await buildGrants(input.permissions, 'permissions.');
  const documentId = randomUUIDv7();
  const versionId = randomUUIDv7();

  await saveVersion(file.path, documentId, async (tx) => {
    await documentModel.create(
      {
        id: documentId,
        title: input.title,
        description: input.description,
        ownerId: user.id,
        visibility: input.permissions.visibility,
        tags,
      },
      tx,
    );
    const version = await documentVersionModel.create(
      {
        id: versionId,
        documentId,
        versionNumber: 1,
        originalFilename: file.originalName,
        mimeType,
        sizeBytes: file.sizeBytes,
        checksumSha256,
        uploadedById: user.id,
      },
      tx,
    );
    await documentModel.update(
      documentId,
      { currentVersionId: versionId, lastVersionAt: version.createdAt },
      tx,
    );
    await documentPermissionModel.replaceForDocument(documentId, grants, tx);
    return version;
  });

  await invalidateDocumentData();
  return getDocument(user, documentId);
}

/**
 * The new version number is the highest number + 1. If two uploads run at the same time,
 * the unique (documentId, versionNumber) constraint stops the second one with 409.
 */
export async function addVersion(
  user: AuthUser,
  id: string,
  file: UploadedFile,
  changeNote: string | undefined,
): Promise<DocumentVersionRecord> {
  await findWritableDocument(user, id);
  const mimeType = await checkUploadedFile(file);
  const checksumSha256 = await hashFile(file.path);
  const versionId = randomUUIDv7();

  const version = await saveVersion(file.path, id, async (tx) => {
    const versionNumber = (await documentVersionModel.findLatestNumber(id, tx)) + 1;
    const created = await documentVersionModel.create(
      {
        id: versionId,
        documentId: id,
        versionNumber,
        originalFilename: file.originalName,
        mimeType,
        sizeBytes: file.sizeBytes,
        checksumSha256,
        changeNote,
        uploadedById: user.id,
      },
      tx,
    );
    await documentModel.update(
      id,
      { currentVersionId: versionId, lastVersionAt: created.createdAt },
      tx,
    );
    return created;
  });

  await invalidateDocumentData();
  return version;
}

export async function updateDocument(
  user: AuthUser,
  id: string,
  input: UpdateDocumentInput,
): Promise<DocumentDetail> {
  await findWritableDocument(user, id);
  let tags: string[] | undefined;
  if (input.tags !== undefined) {
    tags = await normalizeTags(input.tags);
  }
  await documentModel.update(id, { title: input.title, description: input.description, tags });
  await invalidateDocumentData();
  return getDocument(user, id);
}

/** Replaces the visibility and all grants. A public document keeps its editors only. */
export async function setPermissions(
  user: AuthUser,
  id: string,
  input: PermissionsInput,
): Promise<DocumentDetail> {
  await findManageableDocument(user, id);
  const grants = await buildGrants(input, '');
  await prisma.$transaction(async (tx) => {
    await documentModel.update(id, { visibility: input.visibility }, tx);
    await documentPermissionModel.replaceForDocument(id, grants, tx);
  });
  await invalidateDocumentData();
  return getDocument(user, id);
}

/** Soft delete: the document and its files stay, but the API does not show them. */
export async function deleteDocument(user: AuthUser, id: string): Promise<void> {
  await findManageableDocument(user, id);
  await documentModel.softDelete(id);
  await invalidateDocumentData();
}
