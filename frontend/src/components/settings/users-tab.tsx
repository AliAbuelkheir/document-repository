'use client';

import type { SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { MultiSelect } from '@/components/shared/multi-select';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { QueryError } from '@/components/shared/query-error';
import { SearchInput } from '@/components/shared/search-input';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsAdmin } from '@/hooks/use-auth';
import { useDepartments } from '@/hooks/use-departments';
import { useUpdateSearchParams } from '@/hooks/use-update-search-params';
import type { SearchParamUpdates } from '@/hooks/use-update-search-params';
import { useUsers } from '@/hooks/use-users';
import { formatDateTime } from '@/lib/format';
import { parseUserListQuery } from '@/lib/validation/user.schema';
import type { UserListQuery } from '@/lib/validation/user.schema';
import type { UserListItem, UserListParams } from '@/types/user';

import { UserDialog } from './user-dialog';
import type { UserDialogState } from './user-dialog';

/** The value of the "all" choice in a filter. A select item cannot have an empty value. */
const ALL = 'all';

const column = createDataTableColumns<UserListItem>();

// The column ids of the sortable columns are the `sort` values of the API.
const columns = column.columns([
  column.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  column.accessor('email', {
    header: 'Email',
    cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
  column.accessor((user) => user.departments.map((department) => department.name).join(', '), {
    id: 'department',
    header: 'Departments',
  }),
  column.accessor('role', {
    header: 'Role',
    cell: (info) => (info.getValue() === 'ADMIN' ? 'Admin' : 'User'),
  }),
  column.accessor('isActive', {
    header: 'Status',
    enableSorting: false,
    cell: (info) => (
      <Badge variant={info.getValue() ? 'secondary' : 'outline'}>
        {info.getValue() ? 'Active' : 'Inactive'}
      </Badge>
    ),
  }),
  column.accessor('createdAt', {
    header: 'Created',
    sortDescFirst: true,
    cell: (info) => (
      <span className="text-muted-foreground tabular-nums">{formatDateTime(info.getValue())}</span>
    ),
  }),
]);

function toIsActive(status: UserListQuery['status']): boolean | undefined {
  if (status === 'active') {
    return true;
  }
  if (status === 'inactive') {
    return false;
  }
  return undefined;
}

function toListParams(query: UserListQuery): UserListParams {
  return {
    search: query.search === '' ? undefined : query.search,
    departmentIds: query.departmentIds,
    role: query.role,
    isActive: toIsActive(query.status),
    sort: query.sort,
    order: query.order,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** The sort to show in the table. Without a sort in the URL, the API uses its default sort. */
function toSorting(query: UserListQuery): SortingState {
  if (query.sort !== undefined) {
    return [{ id: query.sort, desc: query.order === 'desc' }];
  }
  if (query.search) {
    // The API sorts by relevance. No column shows it.
    return [];
  }
  return [{ id: 'name', desc: false }];
}

/** The users table. The API searches, filters, sorts and pages. The state is in the URL. */
export function UsersTab() {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const isAdmin = useIsAdmin();
  const [dialog, setDialog] = useState<UserDialogState>({ mode: 'closed' });
  const query = parseUserListQuery(searchParams);
  const usersQuery = useUsers(toListParams(query));
  const departmentsQuery = useDepartments();
  const departmentOptions = (departmentsQuery.data ?? []).map((department) => ({
    value: department.id,
    label: department.name,
  }));

  /** A change to the search or a filter shows the first page again. */
  function changeFilters(updates: SearchParamUpdates) {
    updateSearchParams({ ...updates, page: undefined });
  }

  function changeSorting(sorting: SortingState) {
    const [firstSort] = sorting;
    if (firstSort === undefined) {
      changeFilters({ sort: undefined, order: undefined });
      return;
    }
    changeFilters({ sort: firstSort.id, order: firstSort.desc ? 'desc' : 'asc' });
  }

  function changeSelectFilter(key: 'role' | 'status', value: string) {
    changeFilters({ [key]: value === ALL ? undefined : value });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <SearchInput
          value={query.search ?? ''}
          onChange={(search) => changeFilters({ search })}
          placeholder="Search name or email"
        />
        <MultiSelect
          label="Departments"
          options={departmentOptions}
          selected={query.departmentIds}
          onChange={(departmentIds) => changeFilters({ departmentIds })}
        />
        <Select
          value={query.role ?? ALL}
          onValueChange={(value) => changeSelectFilter('role', value)}
        >
          <SelectTrigger aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.status ?? ALL}
          onValueChange={(value) => changeSelectFilter('status', value)}
        >
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button className="ml-auto" onClick={() => setDialog({ mode: 'create' })}>
            <PlusIcon />
            Add user
          </Button>
        )}
      </div>

      {usersQuery.isError && (
        <div className="p-3">
          <QueryError error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
        </div>
      )}
      {usersQuery.isPending && <TableSkeleton />}
      {usersQuery.isSuccess && (
        <>
          <DataTable
            columns={columns}
            data={usersQuery.data.data}
            sorting={toSorting(query)}
            onSortingChange={changeSorting}
            manualSorting
            onRowClick={(user) => setDialog({ mode: 'details', userId: user.id })}
            emptyMessage="No users match the search and filters."
            className="md:min-h-0 md:flex-1 md:overflow-auto"
          />
          <div className="border-t px-3 py-2">
            <PaginationBar
              meta={usersQuery.data.meta}
              onPageChange={(page) => updateSearchParams({ page: String(page) })}
              onPageSizeChange={(pageSize) => changeFilters({ pageSize: String(pageSize) })}
            />
          </div>
        </>
      )}

      <UserDialog state={dialog} onClose={() => setDialog({ mode: 'closed' })} />
    </>
  );
}
