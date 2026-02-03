'use client';

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { columns, type ApplicationRow } from './columns';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface ApplicationsTableProps {
  data: ApplicationRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onFilterChange: (filters: {
    search?: string;
    status?: string[];
    page?: number;
  }) => void;
  loading?: boolean;
}

export function ApplicationsTable({
  data,
  pagination,
  onFilterChange,
  loading = false,
}: ApplicationsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
        <TableToolbar onFilterChange={onFilterChange} />
      )}

      <div className="rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  onClick={() => router.push(`/dashboard/applications/${row.original.id}`)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                    row.getIsSelected()
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
        onPageChange={(page) => onFilterChange({ page })}
      />
    </div>
  );
}
