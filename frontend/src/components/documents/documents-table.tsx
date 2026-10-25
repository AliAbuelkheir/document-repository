'use client';

import { cn } from 'cn';
import type { SortingState } from '@tanstack/react-table';
import { FileImageIcon, FileSpreadsheetIcon, FileTextIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { fileTypeLabel, formatBytes, formatDateTime } from '@/lib/format';
import type { DocumentListItem } from '@/types/document';

const column = createDataTableColumns<DocumentListItem>();

const IMAGE_TYPES = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'];
const SHEET_TYPES = ['XLSX', 'XLS', 'CSV'];
/** The table shows this number of tags. A "+N" chip counts the other tags. */
const VISIBLE_TAG_COUNT = 3;

function FileTypeIcon({ typeLabel }: { typeLabel: string }) {
  const className = 'size-4 shrink-0 text-muted-foreground';
  if (IMAGE_TYPES.includes(typeLabel)) {
    return <FileImageIcon aria-hidden className={className} />;
  }
  if (SHEET_TYPES.includes(typeLabel)) {
    return <FileSpreadsheetIcon aria-hidden className={className} />;
  }
  return <FileTextIcon aria-hidden className={className} />;
}

function TitleCell({ document }: { document: DocumentListItem }) {
  return (
    <span className="flex max-w-[26rem] items-center gap-2.5">
      <FileTypeIcon typeLabel={fileTypeLabel(document.currentVersion.originalFilename)} />
      <Link
        href={`/documents/${document.id}`}
        title={document.title}
        className="truncate font-medium text-foreground hover:text-primary hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {document.title}
      </Link>
    </span>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  const visibleTags = tags.slice(0, VISIBLE_TAG_COUNT);
  const hiddenCount = tags.length - visibleTags.length;
  return (
    <div className="flex gap-1">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="secondary" title={tags.slice(VISIBLE_TAG_COUNT).join(', ')}>
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}

// The column ids of the sortable columns are the `sort` values of the API.
const columns = column.columns([
  column.accessor('title', {
    header: 'Title',
    cell: (info) => <TitleCell document={info.row.original} />,
  }),
  column.accessor('tags', {
    header: 'Tags',
    enableSorting: false,
    cell: (info) => <TagChips tags={info.getValue()} />,
  }),
  column.accessor((document) => document.owner.name, {
    id: 'owner',
    header: 'Uploader',
  }),
  column.accessor((document) => fileTypeLabel(document.currentVersion.originalFilename), {
    id: 'type',
    header: 'Type',
    enableSorting: false,
    cell: (info) => (
      <span
        className={cn(
          'inline-flex h-5 items-center rounded-md border px-1.5 text-[11px] font-semibold',
          'tracking-wide text-muted-foreground',
        )}>
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor((document) => document.currentVersion.sizeBytes, {
    id: 'size',
    header: 'Size',
    sortDescFirst: true,
    cell: (info) => (
      <span className="text-muted-foreground tabular-nums">{formatBytes(info.getValue())}</span>
    ),
  }),
  column.accessor('lastVersionAt', {
    header: 'Last updated',
    sortDescFirst: true,
    cell: (info) => (
      <span className="text-muted-foreground tabular-nums">{formatDateTime(info.getValue())}</span>
    ),
  }),
]);

interface DocumentsTableProps {
  documents: DocumentListItem[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  className?: string;
}

/** The API sorts the documents. A click on a header changes the sort in the URL. */
export function DocumentsTable({
  documents,
  sorting,
  onSortingChange,
  className,
}: DocumentsTableProps) {
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
      className={className}
      rightAlignedColumnIds={['size']}
    />
  );
}
