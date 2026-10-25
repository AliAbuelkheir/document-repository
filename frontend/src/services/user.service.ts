import type { DataResponse, ListResponse } from '@/types/api';
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserListItem,
  UserListParams,
} from '@/types/user';

import { apiRequest } from './api-client';

export function listUsers(params: UserListParams): Promise<ListResponse<UserListItem>> {
  return apiRequest<ListResponse<UserListItem>>('/users', { query: { ...params } });
}

export async function getUser(id: string): Promise<User> {
  const response = await apiRequest<DataResponse<User>>(`/users/${id}`);
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await apiRequest<DataResponse<User>>('/users', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const response = await apiRequest<DataResponse<User>>(`/users/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}
