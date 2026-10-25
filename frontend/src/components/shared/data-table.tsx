'use client';

import { cn } from 'cn';
import {
  createColumnHelper,
  createSortedRowModel,
  functionalUpdate,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, Updater } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
});

type DataTableFeatures = typeof dataTableFeatures;

/** Use it to write the columns of a `DataTable`. */
export function createDataTableColumns<TData extends { id: string }>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

const NO_SORTING: SortingState = [];

interface DataTableProps<TData extends { id: string }> {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  data: TData[];
  /** Without `onSortingChange`, the headers cannot sort. */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** True if the server sorts the rows. Then the table keeps the order of `data`. */
  manualSorting?: boolean;
  onRowClick?: (row: TData) => void;
  emptyMessage?: ReactNode;
  /** Classes for the scroll container of the table. */
  className?: string;
  /** The ids of the columns that align to the right, for example numbers and row actions. */
  rightAlignedColumnIds?: string[];
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUpIcon aria-label="sorted ascending" />;
  }
  if (direction === 'desc') {
    return <ArrowDownIcon aria-label="sorted descending" />;
  }
  return <ArrowUpDownIcon aria-hidden className="opacity-0 group-hover/sort:opacity-100" />;
}

interface SortableHeaderProps {
  canSort: boolean;
  direction: false | 'asc' | 'desc';
  onToggle: ((event: unknown) => void) | undefined;
  children: ReactNode;
}

/** A header that the user can click to sort, or the plain header if the column cannot sort. */
function SortableHeader({ canSort, direction, onToggle, children }: SortableHeaderProps) {
  if (!canSort) {
    return children;
  }
  return (
    <button
      type="button"
      className={cn(
        'group/sort -mx-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 outline-none',
        'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5',
        '[&_svg]:text-primary',
      )}
      onClick={onToggle}
    >
      {children}
      <SortIcon direction={direction} />
    </button>
  );
}

export function DataTable<TData extends { id: string }>({
  columns,
  data,
  sorting = NO_SORTING,
  onSortingChange,
  manualSorting = false,
  onRowClick,
  emptyMessage = 'No results.',
  className,
  rightAlignedColumnIds = [],
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: (updater: Updater<SortingState>) => {
      onSortingChange?.(functionalUpdate(updater, sorting));
    },
    enableSorting: onSortingChange !== undefined,
    manualSorting,
  });

  const rows = table.getRowModel().rows;

  function alignClass(columnId: string): string | undefined {
    return rightAlignedColumnIds.includes(columnId) ? 'text-right' : undefined;
  }

  return (
    <Table containerClassName={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className={alignClass(header.column.id)}>
                {!header.isPlaceholder && (
                  <SortableHeader
                    canSort={header.column.getCanSort()}
                    direction={header.column.getIsSorted()}
                    onToggle={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                  </SortableHeader>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-32 text-center text-sm whitespace-normal text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className={onRowClick ? 'cursor-pointer hover:bg-selected' : undefined}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          >
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} className={alignClass(cell.column.id)}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
