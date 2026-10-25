// Wipes all tables and the upload directory, then reseeds.
import { createHash, randomUUIDv7 } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { parse, resolve } from 'node:path';

import bcrypt from 'bcryptjs';

import { env } from '../../src/config/env.js';
import { prisma } from '../../src/config/prisma.js';
import { redis } from '../../src/config/redis.js';
import type { PermissionLevel, Role, Visibility } from '../../src/generated/prisma/enums.js';
import type { NonEmptyArray } from '../../src/types/common.js';
import { invalidateAll } from '../../src/utils/cache.js';
import {
  ADMIN_EMAIL,
  SEED_PASSWORD,
  USER_EMAIL,
  deactivatedTags,
  departments,
  documentTemplates,
  firstNames,
  lastNames,
  predefinedTags,
} from './data.js';
import type { DepartmentName, DocumentTemplate } from './data.js';
import { MIME_TYPES, buildFile } from './files.js';

const USER_COUNT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHANGE_NOTES = [
  'Updated figures',
  'Minor corrections',
  'Reviewed by legal',
  'Added new section',
  'Annual refresh',
];

// mulberry32: tiny deterministic PRNG.
let state = 20261023;
function random(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randomInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}
const chance = (probability: number) => random() < probability;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

interface SeedDepartment {
  id: string;
  name: DepartmentName;
}

interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentIds: NonEmptyArray<string>;
  isActive: boolean;
  password: string;
}

interface SeedDocuments {
  documents: {
    id: string;
    title: string;
    description: string;
    ownerId: string;
    visibility: Visibility;
    tags: string[];
    lastVersionAt: Date;
    createdAt: Date;
  }[];
  versions: {
    id: string;
    documentId: string;
    versionNumber: number;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    changeNote: string | null;
    uploadedById: string;
    createdAt: Date;
  }[];
  permissions: {
    documentId: string;
    userId?: string;
    departmentId?: string;
    level: PermissionLevel;
  }[];
  currentVersions: { documentId: string; versionId: string }[];
}

async function clearDatabase(): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE document_permissions, document_versions, documents, tags,
             user_departments, users, departments
    CASCADE`;
}

async function clearUploads(uploadDir: string): Promise<void> {
  if (parse(uploadDir).root === uploadDir) {
    throw new Error(`Seed stopped: ${uploadDir} is a root directory`);
  }
  await mkdir(uploadDir, { recursive: true });
  for (const entry of await readdir(uploadDir)) {
    await rm(resolve(uploadDir, entry), { recursive: true, force: true });
  }
}

async function seedDepartments(): Promise<SeedDepartment[]> {
  const rows = departments.map((department) => ({ id: randomUUIDv7(), ...department }));
  await prisma.department.createMany({ data: rows });
  return rows;
}

function findDepartmentId(rows: SeedDepartment[], name: DepartmentName): string {
  const row = rows.find((department) => department.name === name);
  if (!row) throw new Error(`Unknown department ${name}`);
  return row.id;
}

function knownUsers(departmentRows: SeedDepartment[], password: string): SeedUser[] {
  return [
    {
      id: randomUUIDv7(),
      email: ADMIN_EMAIL,
      name: 'Admin User',
      role: 'ADMIN',
      departmentIds: [findDepartmentId(departmentRows, 'Operations')],
      isActive: true,
      password,
    },
    {
      id: randomUUIDv7(),
      email: USER_EMAIL,
      name: 'Regular User',
      role: 'USER',
      departmentIds: [findDepartmentId(departmentRows, 'Engineering')],
      isActive: true,
      password,
    },
  ];
}

// About 25% of the generated users belong to two departments.
function pickDepartmentIds(departmentRows: SeedDepartment[]): NonEmptyArray<string> {
  const primary = pick(departmentRows).id;
  const secondary = pick(departmentRows).id;
  if (chance(0.25) && secondary !== primary) {
    return [primary, secondary];
  }
  return [primary];
}

function generatedUser(
  firstName: string,
  lastName: string,
  index: number,
  departmentRows: SeedDepartment[],
  password: string,
): SeedUser {
  let role: Role = 'USER';
  if (index % 50 === 0) {
    role = 'ADMIN';
  }
  return {
    id: randomUUIDv7(),
    email: `${firstName}.${lastName}@docrepo.local`.toLowerCase(),
    name: `${firstName} ${lastName}`,
    role,
    departmentIds: pickDepartmentIds(departmentRows),
    isActive: index % 20 !== 0,
    password,
  };
}

function buildUsers(departmentRows: SeedDepartment[], password: string): SeedUser[] {
  const users = knownUsers(departmentRows, password);
  for (const lastName of lastNames) {
    for (const firstName of firstNames) {
      if (users.length >= USER_COUNT) {
        return users;
      }
      users.push(generatedUser(firstName, lastName, users.length, departmentRows, password));
    }
  }
  return users;
}

async function seedUsers(departmentRows: SeedDepartment[]): Promise<SeedUser[]> {
  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = buildUsers(departmentRows, password);
  await prisma.user.createMany({ data: users.map(({ departmentIds: _, ...user }) => user) });
  await prisma.userDepartment.createMany({
    data: users.flatMap((user) =>
      user.departmentIds.map((departmentId) => ({ userId: user.id, departmentId })),
    ),
  });
  return users;
}

async function seedTags(): Promise<number> {
  const rows = predefinedTags.map((name) => ({
    id: randomUUIDv7(),
    name,
    isActive: !deactivatedTags.includes(name),
  }));
  await prisma.tag.createMany({ data: rows });
  return rows.length;
}

// The known user owns the first 3 documents, so that this account has content.
function pickOwner(
  index: number,
  knownUser: SeedUser,
  departmentId: string,
  activeUsers: SeedUser[],
): SeedUser {
  if (index < 3) {
    return knownUser;
  }
  const departmentMembers = activeUsers.filter((user) =>
    user.departmentIds.includes(departmentId),
  );
  if (departmentMembers.length > 0) {
    return pick(departmentMembers);
  }
  return pick(activeUsers);
}

function pickChangeNote(versionNumber: number): string | null {
  if (versionNumber === 1) {
    return null;
  }
  return pick(CHANGE_NOTES);
}

// Adds the grants of one document. Each principal appears one time only.
// The function adds editors first, then viewers that are not editors. It returns the editor users.
function addPermissions(
  seed: SeedDocuments,
  context: {
    documentId: string;
    index: number;
    owner: SeedUser;
    knownUser: SeedUser;
    departmentId: string;
    visibility: Visibility;
    activeUsers: SeedUser[];
  },
): string[] {
  const { documentId, index, owner, knownUser, departmentId, visibility, activeUsers } = context;
  const editorUserIds: string[] = [];
  const principalIds = new Set<string>();

  const addGrant = (
    level: PermissionLevel,
    grant: { userId: string } | { departmentId: string },
  ) => {
    let principalId: string;
    if ('userId' in grant) {
      principalId = grant.userId;
    } else {
      principalId = grant.departmentId;
    }
    if (principalId === owner.id || principalIds.has(principalId)) {
      return;
    }
    principalIds.add(principalId);
    if (level === 'EDIT' && 'userId' in grant) {
      editorUserIds.push(grant.userId);
    }
    seed.permissions.push({ documentId, level, ...grant });
  };

  if (index >= 3 && index < 6) addGrant('EDIT', { userId: knownUser.id });
  if (chance(0.4)) addGrant('EDIT', { userId: pick(activeUsers).id });
  if (chance(0.15)) addGrant('EDIT', { departmentId });
  if (visibility === 'RESTRICTED') {
    addGrant('VIEW', { departmentId });
    if (chance(0.5)) addGrant('VIEW', { userId: pick(activeUsers).id });
  }
  return editorUserIds;
}

async function writeVersionFile(
  uploadDir: string,
  documentId: string,
  versionNumber: number,
  content: Buffer,
): Promise<void> {
  await mkdir(resolve(uploadDir, documentId), { recursive: true });
  await writeFile(resolve(uploadDir, documentId, String(versionNumber)), content);
}

async function buildDocument(
  seed: SeedDocuments,
  template: DocumentTemplate,
  index: number,
  context: {
    uploadDir: string;
    departmentRows: SeedDepartment[];
    knownUser: SeedUser;
    activeUsers: SeedUser[];
    now: number;
  },
): Promise<void> {
  const { uploadDir, departmentRows, knownUser, activeUsers, now } = context;
  const documentId = randomUUIDv7();
  const departmentId = findDepartmentId(departmentRows, template.department);
  const owner = pickOwner(index, knownUser, departmentId, activeUsers);
  let visibility: Visibility = 'PUBLIC';
  if (template.tags.includes('Confidential') || chance(0.2)) {
    visibility = 'RESTRICTED';
  }

  const editorUserIds = addPermissions(seed, {
    documentId,
    index,
    owner,
    knownUser,
    departmentId,
    visibility,
    activeUsers,
  });

  const uploaderIds = [owner.id, ...editorUserIds];
  const versionCount = randomInt(1, 4);
  let timestamp = now - randomInt(60, 540) * DAY_MS;
  const createdAt = new Date(timestamp);
  let latestVersionId = '';

  for (let versionNumber = 1; versionNumber <= versionCount; versionNumber++) {
    if (versionNumber > 1) {
      timestamp = Math.min(timestamp + randomInt(3, 45) * DAY_MS, now - DAY_MS);
    }
    const versionId = randomUUIDv7();
    const content = buildFile(template.kind, template.title, versionNumber);
    await writeVersionFile(uploadDir, documentId, versionNumber, content);

    const changeNote = pickChangeNote(versionNumber);
    let uploadedById = owner.id;
    if (versionNumber > 1) {
      uploadedById = pick(uploaderIds);
    }
    seed.versions.push({
      id: versionId,
      documentId,
      versionNumber,
      originalFilename: `${slugify(template.title)}.${template.kind}`,
      mimeType: MIME_TYPES[template.kind],
      sizeBytes: content.length,
      checksumSha256: createHash('sha256').update(content).digest('hex'),
      changeNote,
      uploadedById,
      createdAt: new Date(timestamp),
    });
    latestVersionId = versionId;
  }

  seed.documents.push({
    id: documentId,
    title: template.title,
    description: template.description,
    ownerId: owner.id,
    visibility,
    tags: template.tags,
    lastVersionAt: new Date(timestamp),
    createdAt,
  });
  seed.currentVersions.push({ documentId, versionId: latestVersionId });
}

async function insertDocuments(seed: SeedDocuments): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.document.createMany({ data: seed.documents });
    await tx.documentVersion.createMany({ data: seed.versions });
    await tx.documentPermission.createMany({ data: seed.permissions });
    for (const { documentId, versionId } of seed.currentVersions) {
      await tx.document.update({
        where: { id: documentId },
        data: { currentVersionId: versionId },
      });
    }
  });
}

async function seedDocuments(
  uploadDir: string,
  departmentRows: SeedDepartment[],
  users: SeedUser[],
): Promise<SeedDocuments> {
  const knownUser = users[1];
  if (!knownUser) throw new Error('Known user missing');
  const context = {
    uploadDir,
    departmentRows,
    knownUser,
    activeUsers: users.filter((user) => user.isActive),
    now: Date.now(),
  };
  const seed: SeedDocuments = { documents: [], versions: [], permissions: [], currentVersions: [] };

  for (const [index, template] of documentTemplates.entries()) {
    await buildDocument(seed, template, index, context);
  }
  await insertDocuments(seed);
  return seed;
}

async function main(): Promise<void> {
  const uploadDir = resolve(env.UPLOAD_DIR);
  console.log(`Seed started for the database and ${uploadDir}`);

  await clearDatabase();
  await clearUploads(uploadDir);

  const departmentRows = await seedDepartments();
  const users = await seedUsers(departmentRows);
  const tagCount = await seedTags();
  const seed = await seedDocuments(uploadDir, departmentRows, users);
  // The API caches data in Redis. Invalidate it, so that the API shows the new data.
  await invalidateAll();

  console.log(
    `Seed created ${departmentRows.length} departments, ${users.length} users, ` +
      `${tagCount} tags, ${seed.documents.length} documents, ` +
      `${seed.versions.length} versions, ${seed.permissions.length} permissions`,
  );
  console.log(`Log in as ${ADMIN_EMAIL} or ${USER_EMAIL} with password ${SEED_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
