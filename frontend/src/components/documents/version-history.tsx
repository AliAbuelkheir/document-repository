'use client';

import Link from 'next/link';

import { createDataTableColumns, DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDateTime } from '@/lib/format';
import { versionContentUrl } from '@/services/document.service';
import type { DocumentVersion } from '@/types/document';

const column = createDataTableColumns<DocumentVersion>();

function createColumns(currentVersionId: string, selectedVersionId: string) {
  return column.columns([
    column.accessor('versionNumber', {
      header: 'Version',
      cell: (info) => (
        <span className="flex items-center gap-2">
          <span className="font-medium tabular-nums">v{info.getValue()}</span>
          {info.row.original.id === currentVersionId && <Badge>Current</Badge>}
          {info.row.original.id === selectedVersionId && <Badge variant="outline">Shown</Badge>}
        </span>
      ),
    }),
    column.accessor('originalFilename', {
      header: 'File',
      cell: (info) => (
        <span className="block max-w-64 truncate" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    column.accessor((version) => version.uploadedBy.name, { id: 'uploadedBy', header: 'Uploader' }),
    column.accessor('createdAt', {
      header: 'Date',
      cell: (info) => (
        <span className="text-muted-foreground tabular-nums">
          {formatDateTime(info.getValue())}
        </span>
      ),
    }),
    column.accessor('changeNote', {
      header: 'Note',
      cell: (info) => (
        <span
          className="block max-w-64 truncate text-muted-foreground"
          title={info.getValue() ?? ''}
        >
          {info.getValue() ?? ''}
        </span>
      ),
    }),
    column.accessor('sizeBytes', {
      header: 'Size',
      cell: (info) => (
        <span className="text-muted-foreground tabular-nums">{formatBytes(info.getValue())}</span>
      ),
    }),
    column.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: (info) => {
        const version = info.row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/documents/${version.documentId}?version=${version.versionNumber}`}>
                View
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={versionContentUrl(version.documentId, version.id, 'attachment')} download>
                Download
              </a>
            </Button>
          </div>
        );
      },
    }),
  ]);
}

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId: string;
  selectedVersionId: string;
}

/** All versions of a document, newest first (the API order). */
export function VersionHistory({
  versions,
  currentVersionId,
  selectedVersionId,
}: VersionHistoryProps) {
  return (
    <DataTable
      columns={createColumns(currentVersionId, selectedVersionId)}
      data={versions}
      emptyMessage="No versions."
    />
  );
}
