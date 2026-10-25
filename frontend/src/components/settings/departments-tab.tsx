'use client';

import type { SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { QueryError } from '@/components/shared/query-error';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/use-auth';
import { useDeleteDepartment, useDepartments } from '@/hooks/use-departments';
import { toastError } from '@/lib/api-errors';
import type { Department } from '@/types/department';

import { DepartmentDialog } from './department-dialog';
import type { DepartmentDialogState } from './department-dialog';

const column = createDataTableColumns<Department>();

const baseColumns = [
  column.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  column.accessor('description', {
    header: 'Description',
    sortFn: 'text',
    cell: (info) => (
      <span className="block max-w-md truncate text-muted-foreground" title={info.getValue() ?? ''}>
        {info.getValue() ?? ''}
      </span>
    ),
  }),
  column.accessor('userCount', {
    header: 'Users',
    sortDescFirst: true,
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
];

interface DepartmentActions {
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

function createColumns(actions: DepartmentActions | undefined) {
  if (actions === undefined) {
    return column.columns(baseColumns);
  }
  return column.columns([
    ...baseColumns,
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (info) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => actions.onEdit(info.row.original)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => actions.onDelete(info.row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ]);
}

function matchesSearch(department: Department, search: string): boolean {
  const text = `${department.name} ${department.description ?? ''}`.toLowerCase();
  return text.includes(search.trim().toLowerCase());
}

/** All departments. The search and the sort run in the browser. */
export function DepartmentsTab() {
  const isAdmin = useIsAdmin();
  const departmentsQuery = useDepartments();
  const deleteMutation = useDeleteDepartment();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [dialog, setDialog] = useState<DepartmentDialogState>({ mode: 'closed' });
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | undefined>();

  const departments = (departmentsQuery.data ?? []).filter((department) =>
    matchesSearch(department, search),
  );
  let actions: DepartmentActions | undefined;
  if (isAdmin) {
    actions = {
      onEdit: (department) => setDialog({ mode: 'edit', department }),
      onDelete: setDepartmentToDelete,
    };
  }

  function handleDelete() {
    if (departmentToDelete === undefined) {
      return;
    }
    deleteMutation.mutate(departmentToDelete.id, {
      onSuccess: () => toast.success('The department is deleted.'),
      // For example 409: users are still in the department.
      onError: toastError,
      onSettled: () => setDepartmentToDelete(undefined),
    });
  }

  return (
    <>
      <div className="border-b p-4">
        <SearchToolbar
          value={search}
          onSearch={setSearch}
          placeholder="Search departments by name or description"
          filterCount={Number(Boolean(search))}
          onClear={() => setSearch('')}
          actions={isAdmin && (
            <Button className="rounded-md" onClick={() => setDialog({ mode: 'create' })}>
              <PlusIcon />
              Add department
            </Button>
          )}
        />
      </div>

      {departmentsQuery.isError && (
        <div className="p-3">
          <QueryError
            error={departmentsQuery.error}
            onRetry={() => void departmentsQuery.refetch()}
          />
        </div>
      )}
      {departmentsQuery.isPending && <TableSkeleton />}
      {departmentsQuery.isSuccess && (
        <DataTable
          columns={createColumns(actions)}
          data={departments}
          sorting={sorting}
          onSortingChange={setSorting}
          emptyMessage="No departments match the search."
          rightAlignedColumnIds={['userCount', 'actions']}
          className="md:min-h-0 md:flex-1 md:overflow-auto"
        />
      )}

      <DepartmentDialog state={dialog} onClose={() => setDialog({ mode: 'closed' })} />
      <ConfirmDialog
        open={departmentToDelete !== undefined}
        onOpenChange={(open) => !open && setDepartmentToDelete(undefined)}
        title="Delete this department?"
        description={
          `"${departmentToDelete?.name ?? ''}" will be deleted, and its document access ` +
          'grants will be removed. A department with users cannot be deleted.'
        }
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
        isDestructive
      />
    </>
  );
}
