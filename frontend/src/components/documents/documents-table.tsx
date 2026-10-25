'use client';

import type { SortingState } from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { fileTypeLabel, formatBytes, formatDateTime } from '@/lib/format';
import type { DocumentListItem } from '@/types/document';

const column = createDataTableColumns<DocumentListItem>();

// The column ids of the sortable columns are the `sort` values of the API.
const columns = column.columns([
  column.accessor('title', {
    header: 'Title',
    cell: (info) => (
      <Link
        href={`/documents/${info.row.original.id}`}
        className="font-medium hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {info.getValue()}
      </Link>
    ),
  }),
  column.accessor('tags', {
    header: 'Tags',
    enableSorting: false,
    cell: (info) => (
      <div className="flex flex-wrap gap-1">
        {info.getValue().map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    ),
  }),
  column.accessor((document) => document.owner.name, {
    id: 'owner',
    header: 'Uploader',
  }),
  column.accessor((document) => fileTypeLabel(document.currentVersion.originalFilename), {
    id: 'type',
    header: 'Type',
    enableSorting: false,
  }),
  column.accessor((document) => document.currentVersion.sizeBytes, {
    id: 'size',
    header: 'Size',
    sortDescFirst: true,
    cell: (info) => formatBytes(info.getValue()),
  }),
  column.accessor('lastVersionAt', {
    header: 'Last updated',
    sortDescFirst: true,
    cell: (info) => formatDateTime(info.getValue()),
  }),
]);

interface DocumentsTableProps {
  documents: DocumentListItem[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

/** The API sorts the documents. A click on a header changes the sort in the URL. */
export function DocumentsTable({ documents, sorting, onSortingChange }: DocumentsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={documents}
      sorting={sorting}
      onSortingChange={onSortingChange}
      manualSorting
      onRowClick={(document) => router.push(`/documents/${document.id}`)}
      emptyMessage="No documents match the search and filters."
    />
  );
}
