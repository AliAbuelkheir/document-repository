'use client';

import { UploadIcon } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import { ALLOWED_EXTENSIONS } from '@/lib/constants';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';

const ACCEPT = ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');

interface FileDropzoneProps {
  id: string;
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
  isInvalid?: boolean;
  disabled?: boolean;
}

/** A file input that also accepts a file that the user drags into it. */
export function FileDropzone({
  id,
  file,
  onFileChange,
  isInvalid = false,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0]);
    // Clear the input, so the same file can be selected again after an error.
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      onFileChange(event.dataTransfer.files[0]);
    }
  }

  return (
    <label
      htmlFor={id}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      aria-invalid={isInvalid}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed',
        'border-input bg-muted px-6 py-7 text-center text-sm transition-colors duration-150',
        'hover:border-primary hover:bg-selected aria-invalid:border-destructive',
        // The input is hidden, so the label shows the focus ring.
        'focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/40',
        isDragOver && 'border-primary bg-selected',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'mb-1.5 flex size-9 items-center justify-center rounded-full bg-card text-primary',
          'shadow-[0_1px_2px_rgb(15_23_42/0.08)] ring-1 ring-border',
        )}>
        <UploadIcon className="size-4" />
      </span>
      {file ? (
        <span className="font-medium">
          {file.name}{' '}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({formatBytes(file.size)})
          </span>
        </span>
      ) : (
        <>
          <span className="font-medium">Drop a file here, or click to select a file</span>
          <span className="text-xs text-muted-foreground">
            {ALLOWED_EXTENSIONS.join(', ')}. Maximum 25 MB.
          </span>
        </>
      )}
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={handleInputChange}
      />
    </label>
  );
}
