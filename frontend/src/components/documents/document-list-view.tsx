'use client';

import { cn } from 'cn';
import type { SortingState } from '@tanstack/react-table';
import { UploadIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { QueryError } from '@/components/shared/query-error';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/use-documents';
import { useUpdateSearchParams } from '@/hooks/use-update-search-params';
import type { SearchParamUpdates } from '@/hooks/use-update-search-params';
import { parseDocumentListQuery } from '@/lib/validation/document.schema';
import type { DocumentListQuery } from '@/lib/validation/document.schema';
import type { DocumentListParams } from '@/types/document';

import { DocumentFilters } from './document-filters';
import { DocumentsTable } from './documents-table';
import { UploadDocumentDialog } from './upload-document-dialog';

function toListParams(query: DocumentListQuery): DocumentListParams {
  return {
    search: query.search === '' ? undefined : query.search,
    tags: query.tags,
    ownerIds: query.ownerIds,
    sort: query.sort,
    order: query.order,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** The sort to show in the table. Without a sort in the URL, the API uses its default sort. */
function toSorting(query: DocumentListQuery): SortingState {
  if (query.sort !== undefined) {
    return [{ id: query.sort, desc: query.order === 'desc' }];
  }
  if (query.search) {
    // The API sorts by relevance. No column shows it.
    return [];
  }
  return [{ id: 'lastVersionAt', desc: true }];
}

/** For example "24 documents". Empty while the list loads. */
function documentCountText(total: number | undefined): string {
  if (total === undefined) {
    // A no-break space keeps the height of the line, so the page does not move.
    return ' ';
  }
  if (total === 1) {
    return '1 document';
  }
  return `${total} documents`;
}

/** The documents screen. The search, filters, sort and page are in the URL query string. */
export function DocumentListView() {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const query = parseDocumentListQuery(searchParams);
  const documentsQuery = useDocuments(toListParams(query));

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

  return (
    <div className="flex flex-1 flex-col gap-5 md:min-h-0">
      <PageHeader
        title="Documents"
        description={documentCountText(documentsQuery.data?.meta.total)}
        actions={
          <Button onClick={() => setIsUploadOpen(true)}>
            <UploadIcon />
            Upload
          </Button>
        }
      />

      {/* On desktop, the panel fills the page height and the table scrolls inside it. */}
      <section
        className={cn(
          'flex flex-col overflow-hidden rounded-xl border bg-card md:min-h-0 md:flex-1',
        )}>
        <div className="border-b p-3">
          <DocumentFilters query={query} onChange={changeFilters} />
        </div>
        {documentsQuery.isError && (
          <div className="p-3">
            <QueryError
              error={documentsQuery.error}
              onRetry={() => void documentsQuery.refetch()}
            />
          </div>
        )}
        {documentsQuery.isPending && <TableSkeleton />}
        {documentsQuery.isSuccess && (
          <>
            <DocumentsTable
              documents={documentsQuery.data.data}
              sorting={toSorting(query)}
              onSortingChange={changeSorting}
              className="md:min-h-0 md:flex-1 md:overflow-auto"
            />
            <div className="border-t px-3 py-2">
              <PaginationBar
                meta={documentsQuery.data.meta}
                onPageChange={(page) => updateSearchParams({ page: String(page) })}
                onPageSizeChange={(pageSize) => changeFilters({ pageSize: String(pageSize) })}
              />
            </div>
          </>
        )}
      </section>

      <UploadDocumentDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
