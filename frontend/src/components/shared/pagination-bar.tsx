'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { PageMeta } from '@/types/api';

interface PaginationBarProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PaginationBar({ meta, onPageChange, onPageSizeChange }: PaginationBarProps) {
  const totalPages = Math.max(meta.totalPages, 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        Page {meta.page} of {totalPages}. Results: {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Rows per page</span>
        <Select
          value={String(meta.pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger size="sm" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
