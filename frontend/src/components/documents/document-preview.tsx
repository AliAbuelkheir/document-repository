'use client';

import { cn } from 'cn';
import { FileIcon } from 'lucide-react';
import Image from 'next/image';

import { PREVIEW_MIME_TYPES } from '@/lib/constants';
import { versionContentUrl } from '@/services/document.service';
import type { VersionFile } from '@/types/document';

interface DocumentPreviewProps {
  documentId: string;
  version: VersionFile;
}

/** Shows a PDF file or an image in the page. Other file types can only download. */
export function DocumentPreview({ documentId, version }: DocumentPreviewProps) {
  const url = versionContentUrl(documentId, version.id, 'inline');

  if (PREVIEW_MIME_TYPES.pdf.includes(version.mimeType)) {
    return (
      <iframe
        src={url}
        title={`Preview of ${version.originalFilename}`}
        className="h-[75vh] min-h-96 w-full rounded-xl border bg-card"
      />
    );
  }

  if (PREVIEW_MIME_TYPES.image.includes(version.mimeType)) {
    return (
      <Image
        src={url}
        alt={`Preview of ${version.originalFilename}`}
        width={0}
        height={0}
        sizes="100vw"
        // The API sends the file. Next.js must not change the image.
        unoptimized
        className="h-auto max-h-[75vh] w-auto max-w-full rounded-xl border bg-card"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-16 text-center text-sm',
      )}>
      <FileIcon aria-hidden className="size-8 text-muted-foreground" />
      <p className="font-medium">Preview is not available for this file type.</p>
      <p className="text-muted-foreground">Download the file to open it.</p>
    </div>
  );
}
