'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { columns } from './columns';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { useDashboardStore } from '@/stores/dashboard-store';

export function ApplicationsTable() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const data = useDashboardStore((state) => state.applications);
  const pagination = useDashboardStore((state) => state.pagination);
  const loading = useDashboardStore((state) => state.loading);
  const applyFilters = useDashboardStore((state) => state.applyFilters);

  // Memoize table config to prevent recreation on every render
  const tableConfig = useMemo(
    () => ({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
      state: {
        sorting,
        rowSelection,
      },
      manualPagination: true,
      pageCount: pagination.totalPages,
    }),
    [data, sorting, rowSelection, pagination.totalPages]
  );

  const table = useReactTable(tableConfig);

  // Clear selection on page change
  useEffect(() => {
    setRowSelection({});
  }, [pagination.page]);

  // Calculate selected IDs and count
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const selectedCount = selectedIds.length;

  const navigateToApplication = useCallback(
    (applicationId: string) => {
      router.push(`/dashboard/applications/${applicationId}`);
    },
    [router]
  );

  const isInteractiveElement = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    target.closest(
      'a, button, input, textarea, select, [role="button"], [role="link"]'
    ) !== null;

  const handleRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>, applicationId: string) => {
      if (isInteractiveElement(event.target)) {
        return;
      }
      navigateToApplication(applicationId);
    },
    [navigateToApplication]
  );

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>, applicationId: string) => {
      if (isInteractiveElement(event.target)) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToApplication(applicationId);
      }
    },
    [navigateToApplication]
  );

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleOperationComplete = () => {
    setRowSelection({});
    // Optionally trigger a data refresh here if needed
  };

  return (
    <div className="space-y-4">
      {selectedCount > 0 ? (
        <BulkActionsToolbar
          selectedIds={selectedIds}
          selectedCount={selectedCount}
          onClearSelection={handleClearSelection}
          onOperationComplete={handleOperationComplete}
        />
      ) : (
        <TableToolbar />
      )}

      <div className="rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { headerClassName?: string }
                    | undefined;
                  return (
                    <TableHead key={header.id} className={meta?.headerClassName}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show skeleton rows while loading
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={(event) => handleRowClick(event, row.original.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.original.id)}
                  tabIndex={0}
                  aria-label={`Open ${row.original.company} ${row.original.position} details`}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                    row.getIsSelected()
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : ''
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { cellClassName?: string }
                      | undefined;
                    return (
                      <TableCell key={cell.id} className={meta?.cellClassName}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    No applications found matching your filters.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={(page) => applyFilters({ page })}
      />
    </div>
  );
}
