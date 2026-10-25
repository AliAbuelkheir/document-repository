import { ConflictError, NotFoundError } from '../errors/app-error.js';
import * as departmentModel from '../models/department.model.js';
import type { DepartmentRecord } from '../models/department.model.js';
import type { Json } from '../types/common.js';
import { cached, invalidate } from '../utils/cache.js';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from '../validators/department.schema.js';

export async function listDepartments(): Promise<Json<DepartmentRecord[]>> {
  return cached({ group: 'departments', name: 'departments', key: 'all' }, () =>
    departmentModel.findAll(),
  );
}

async function getDepartment(id: string): Promise<DepartmentRecord> {
  const department = await departmentModel.findById(id);
  if (!department) {
    throw new NotFoundError('Department not found');
  }
  return department;
}

/** Department names are unique without regard to case. */
async function checkNameIsFree(name: string, departmentId?: string): Promise<void> {
  const existing = await departmentModel.findByName(name);
  if (existing && existing.id !== departmentId) {
    throw new ConflictError('A department with this name exists', [
      { path: 'name', message: 'A department with this name exists' },
    ]);
  }
}

async function invalidateDepartmentData(): Promise<void> {
  // Users show department names, and a delete removes document grants.
  await invalidate(['departments', 'users', 'documents']);
}

export async function createDepartment(input: CreateDepartmentInput): Promise<DepartmentRecord> {
  await checkNameIsFree(input.name);
  const department = await departmentModel.create(input);
  await invalidateDepartmentData();
  return department;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
): Promise<DepartmentRecord> {
  await getDepartment(id);
  if (input.name !== undefined) {
    await checkNameIsFree(input.name, id);
  }
  const department = await departmentModel.update(id, input);
  await invalidateDepartmentData();
  return department;
}

export async function deleteDepartment(id: string): Promise<void> {
  const department = await getDepartment(id);
  if (department.userCount > 0) {
    throw new ConflictError(
      `Users in this department: ${department.userCount}. Move them to other departments first.`,
    );
  }
  await departmentModel.remove(id);
  await invalidateDepartmentData();
}
