import { prisma } from '../config/prisma.js';
import type { DbClient } from '../config/prisma.js';
import type { PermissionLevel } from '../generated/prisma/enums.js';

export type PermissionGrant =
  | { userId: string; departmentId?: never; level: PermissionLevel }
  | { departmentId: string; userId?: never; level: PermissionLevel };

export async function replaceForDocument(
  documentId: string,
  grants: PermissionGrant[],
  db: DbClient = prisma,
): Promise<void> {
  await db.documentPermission.deleteMany({ where: { documentId } });
  if (grants.length === 0) return;
  await db.documentPermission.createMany({
    data: grants.map((grant) => ({ documentId, ...grant })),
  });
}
