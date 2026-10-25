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
          v{info.getValue()}
          {info.row.original.id === currentVersionId && <Badge>Current</Badge>}
          {info.row.original.id === selectedVersionId && <Badge variant="outline">Shown</Badge>}
        </span>
      ),
    }),
    column.accessor('originalFilename', { header: 'File' }),
    column.accessor((version) => version.uploadedBy.name, { id: 'uploadedBy', header: 'Uploader' }),
    column.accessor('createdAt', {
      header: 'Date',
      cell: (info) => formatDateTime(info.getValue()),
    }),
    column.accessor('changeNote', {
      header: 'Note',
      cell: (info) => info.getValue() ?? '',
    }),
    column.accessor('sizeBytes', {
      header: 'Size',
      cell: (info) => formatBytes(info.getValue()),
    }),
    column.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const version = info.row.original;
        return (
          <div className="flex gap-1">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/documents/${version.documentId}?version=${version.versionNumber}`}>
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
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
