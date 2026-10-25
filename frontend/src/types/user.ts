import type { NamedRef, SortOrder } from './api';

export type Role = 'ADMIN' | 'USER';

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  departments: NamedRef[];
  createdAt: string;
}

export interface User extends UserListItem {
  updatedAt: string;
}

export type UserSortField =
  'relevance' | 'name' | 'email' | 'department' | 'role' | 'isActive' | 'createdAt';

export interface UserListParams {
  search?: string;
  departmentIds?: string[];
  role?: Role;
  isActive?: boolean;
  sort?: UserSortField;
  order?: SortOrder;
  page: number;
  pageSize: number;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: Role;
  departmentIds: string[];
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
  departmentIds?: string[];
}
