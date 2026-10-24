import type { Role } from '../generated/prisma/enums.js';

import type { NamedRef, SortOrder } from './common.js';

export type UserSortField = 'relevance' | 'name' | 'email' | 'department' | 'role' | 'createdAt';

export interface UserSearchFilters {
  search?: string;
  departmentIds?: string[];
  role?: Role;
  isActive?: boolean;
  sort: UserSortField;
  order: SortOrder;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  departments: NamedRef[];
}
