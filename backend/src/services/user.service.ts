import bcrypt from 'bcryptjs';

import { PASSWORD_HASH_ROUNDS } from '../config/auth.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/app-error.js';
import * as departmentModel from '../models/department.model.js';
import * as userModel from '../models/user.model.js';
import type { UserRecord } from '../models/user.model.js';
import type { FieldIssue, ListResponse } from '../types/api.js';
import type { AuthUser } from '../types/auth.js';
import type { Json, SortOrder } from '../types/common.js';
import type { UserListItem, UserSortField } from '../types/user.js';
import { cached, hashParams, invalidate } from '../utils/cache.js';
import { toListResponse, toPageWindow } from '../utils/pagination.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '../validators/user.schema.js';

function defaultSort(search: string | undefined): UserSortField {
  if (search) {
    return 'relevance';
  }
  return 'name';
}

function defaultOrder(sort: UserSortField): SortOrder {
  if (sort === 'createdAt') {
    return 'desc';
  }
  return 'asc';
}

export async function listUsers(query: ListUsersQuery): Promise<ListResponse<Json<UserListItem>>> {
  const sort = query.sort ?? defaultSort(query.search);
  const filters = {
    search: query.search,
    departmentIds: query.departmentIds,
    role: query.role,
    isActive: query.isActive,
    sort,
    order: query.order ?? defaultOrder(sort),
  };
  const page = { page: query.page, pageSize: query.pageSize };
  const result = await cached(
    { group: 'users', name: 'users', key: hashParams({ filters, page }) },
    () => userModel.search(filters, toPageWindow(page)),
  );
  return toListResponse(result, page);
}

export async function getUser(id: string): Promise<UserRecord> {
  const user = await userModel.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

async function checkEmailIsFree(email: string): Promise<void> {
  if ((await userModel.findIdByEmail(email)) !== null) {
    throw new ConflictError('A user with this email exists', [
      { path: 'email', message: 'A user with this email exists' },
    ]);
  }
}

async function checkDepartmentsExist(departmentIds: string[]): Promise<void> {
  const existingIds = await departmentModel.findExistingIds(departmentIds);
  if (existingIds.length !== departmentIds.length) {
    throw new ValidationError('Validation failed', [
      { path: 'departmentIds', message: 'One or more departments do not exist' },
    ]);
  }
}

/** An admin cannot deactivate the own account or remove the own admin role. */
function checkOwnAccountChange(actor: AuthUser, userId: string, input: UpdateUserInput): void {
  if (actor.id !== userId) {
    return;
  }
  const issues: FieldIssue[] = [];
  if (input.isActive === false) {
    issues.push({ path: 'isActive', message: 'You cannot deactivate your own account' });
  }
  if (input.role === 'USER') {
    issues.push({ path: 'role', message: 'You cannot remove your own admin role' });
  }
  if (issues.length > 0) {
    throw new ValidationError('Validation failed', issues);
  }
}

async function invalidateUserData(): Promise<void> {
  // Documents show owner names, and departments show user counts.
  await invalidate(['users', 'documents', 'departments']);
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  await checkEmailIsFree(input.email);
  await checkDepartmentsExist(input.departmentIds);
  const password = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  const user = await userModel.create({ ...input, password });
  await invalidateUserData();
  return user;
}

export async function updateUser(
  actor: AuthUser,
  id: string,
  input: UpdateUserInput,
): Promise<UserRecord> {
  const existing = await getUser(id);
  checkOwnAccountChange(actor, id, input);
  if (input.email !== undefined && input.email !== existing.email) {
    await checkEmailIsFree(input.email);
  }
  if (input.departmentIds !== undefined) {
    await checkDepartmentsExist(input.departmentIds);
  }

  let password: string | undefined;
  if (input.password !== undefined) {
    password = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  }
  const user = await userModel.update(id, { ...input, password });
  await invalidateUserData();
  return user;
}
