import type { PermissionLevel, Visibility } from '../generated/prisma/enums.js';
import type { AuthUser } from '../types/auth.js';

// The document search SQL in `document.model.ts` uses the same rules. Change both together.

export interface DocumentGrant {
  level: PermissionLevel;
  userId: string | null;
  departmentId: string | null;
}

export interface DocumentAccess {
  ownerId: string;
  visibility: Visibility;
  grants: DocumentGrant[];
}

/** True if the user, or one of the departments of the user, has a grant with this level. */
function hasGrant(user: AuthUser, access: DocumentAccess, level: PermissionLevel): boolean {
  for (const grant of access.grants) {
    if (grant.level !== level) {
      continue;
    }
    if (grant.userId === user.id) {
      return true;
    }
    if (grant.departmentId !== null && user.departmentIds.includes(grant.departmentId)) {
      return true;
    }
  }
  return false;
}

/** Change the visibility, viewers and editors, and delete the document. */
export function canManage(user: AuthUser, access: DocumentAccess): boolean {
  return user.role === 'ADMIN' || access.ownerId === user.id;
}

/** Upload a new version, and edit the title, description and tags. */
export function canWrite(user: AuthUser, access: DocumentAccess): boolean {
  return canManage(user, access) || hasGrant(user, access, 'EDIT');
}

export function canRead(user: AuthUser, access: DocumentAccess): boolean {
  if (access.visibility === 'PUBLIC') {
    return true;
  }
  return canWrite(user, access) || hasGrant(user, access, 'VIEW');
}
