import type { DataResponse } from '@/types/api';
import type { Department, DepartmentInput } from '@/types/department';

import { apiRequest, apiRequestNoContent } from './api-client';

export async function listDepartments(): Promise<Department[]> {
  const response = await apiRequest<DataResponse<Department[]>>('/departments');
  return response.data;
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const response = await apiRequest<DataResponse<Department>>('/departments', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateDepartment(id: string, input: DepartmentInput): Promise<Department> {
  const response = await apiRequest<DataResponse<Department>>(`/departments/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiRequestNoContent(`/departments/${id}`, { method: 'DELETE' });
}
