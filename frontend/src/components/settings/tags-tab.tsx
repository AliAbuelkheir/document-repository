'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { QueryError } from '@/components/shared/query-error';
import { SearchBox } from '@/components/shared/search-input';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsAdmin } from '@/hooks/use-auth';
import { useCreateTag, useSetTagActive, useTags } from '@/hooks/use-tags';
import { showFormError, toastError } from '@/lib/api-errors';
import { formatDateTime } from '@/lib/format';
import { tagFormSchema } from '@/lib/validation/tag.schema';
import type { TagFormValues } from '@/lib/validation/tag.schema';
import type { Tag } from '@/types/tag';

const statusFilterSchema = z.enum(['all', 'active', 'inactive']).catch('all');

type StatusFilter = z.infer<typeof statusFilterSchema>;

const column = createDataTableColumns<Tag>();

const baseColumns = [
  column.accessor('name', {
    header: 'Name',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  column.accessor('isActive', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'default' : 'outline'}>
        {info.getValue() ? 'Active' : 'Deleted'}
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
];

interface TagActions {
  onDelete: (tag: Tag) => void;
  onRestore: (tag: Tag) => void;
  isPending: boolean;
}

function createColumns(actions: TagActions | undefined) {
  if (actions === undefined) {
    return column.columns(baseColumns);
  }
  return column.columns([
    ...baseColumns,
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (info) => {
        const tag = info.row.original;
        if (tag.isActive) {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/5 hover:text-destructive"
              disabled={actions.isPending}
              onClick={() => actions.onDelete(tag)}
            >
              Delete
            </Button>
          );
        }
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={actions.isPending}
            onClick={() => actions.onRestore(tag)}
          >
            Restore
          </Button>
        );
      },
    }),
  ]);
}

function matchesFilters(tag: Tag, search: string, status: StatusFilter): boolean {
  if (status === 'active' && !tag.isActive) {
    return false;
  }
  if (status === 'inactive' && tag.isActive) {
    return false;
  }
  return tag.name.toLowerCase().includes(search.trim().toLowerCase());
}

/** The default tags. The search, the filter and the sort run in the browser. */
export function TagsTab() {
  const isAdmin = useIsAdmin();
  const tagsQuery = useTags();
  const setActiveMutation = useSetTagActive();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [tagToDelete, setTagToDelete] = useState<Tag | undefined>();

  const tags = (tagsQuery.data ?? []).filter((tag) => matchesFilters(tag, search, status));

  function setTagActive(tag: Tag, isActive: boolean) {
    setActiveMutation.mutate(
      { id: tag.id, isActive },
      {
        onSuccess: () => toast.success(isActive ? 'The tag is restored.' : 'The tag is deleted.'),
        onError: toastError,
        onSettled: () => setTagToDelete(undefined),
      },
    );
  }

  let actions: TagActions | undefined;
  if (isAdmin) {
    actions = {
      onDelete: setTagToDelete,
      onRestore: (tag) => setTagActive(tag, true),
      isPending: setActiveMutation.isPending,
    };
  }

  return (
    <>
      <div className="flex flex-wrap items-start gap-2 border-b p-3">
        <SearchBox
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tags"
          aria-label="Search tags"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(statusFilterSchema.parse(value))}
        >
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Deleted</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && <AddTagForm />}
      </div>

      {tagsQuery.isError && (
        <div className="p-3">
          <QueryError error={tagsQuery.error} onRetry={() => void tagsQuery.refetch()} />
        </div>
      )}
      {tagsQuery.isPending && <TableSkeleton />}
      {tagsQuery.isSuccess && (
        <DataTable
          columns={createColumns(actions)}
          data={tags}
          sorting={sorting}
          onSortingChange={setSorting}
          emptyMessage="No tags match the search and filter."
          className="md:min-h-0 md:flex-1 md:overflow-auto"
        />
      )}

      <ConfirmDialog
        open={tagToDelete !== undefined}
        onOpenChange={(open) => !open && setTagToDelete(undefined)}
        title="Delete this tag?"
        description={
          `"${tagToDelete?.name ?? ''}" will not show in the tag pickers. ` +
          'Documents that have the tag keep it. You can restore the tag later.'
        }
        confirmLabel={setActiveMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={() => tagToDelete && setTagActive(tagToDelete, false)}
        isPending={setActiveMutation.isPending}
        isDestructive
      />
    </>
  );
}

function AddTagForm() {
  const createMutation = useCreateTag();
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: '' },
  });
  const { errors } = form.formState;

  function handleSubmit(values: TagFormValues) {
    createMutation.mutate(values.name, {
      onSuccess: () => {
        toast.success('The tag is added.');
        form.reset();
      },
      onError: (error) => showFormError(error, form.setError, ['name']),
    });
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(handleSubmit)}
      className="ml-auto flex items-start gap-2"
    >
      <Field data-invalid={errors.name !== undefined}>
        <Input
          placeholder="New tag name"
          aria-label="New tag name"
          aria-invalid={errors.name !== undefined}
          {...form.register('name')}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Button type="submit" disabled={createMutation.isPending}>
        Add tag
      </Button>
    </form>
  );
}
