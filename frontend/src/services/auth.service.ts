import type { DataResponse } from '@/types/api';
import type { User } from '@/types/user';

import { apiRequest, apiRequestNoContent } from './api-client';

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<User> {
  const response = await apiRequest<DataResponse<User>>('/auth/login', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiRequestNoContent('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest<DataResponse<User>>('/auth/me');
  return response.data;
}
