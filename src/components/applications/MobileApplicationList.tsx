'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/stores/dashboard-store';
import { MobileApplicationCard } from './MobileApplicationCard';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { Skeleton } from '@/components/ui/skeleton';

export function MobileApplicationList() {
  const router = useRouter();
  const applications = useDashboardStore((state) => state.applications);
  const pagination = useDashboardStore((state) => state.pagination);
  const loading = useDashboardStore((state) => state.loading);
  const applyFilters = useDashboardStore((state) => state.applyFilters);

  const handlePageChange = useCallback(
    (page: number) => {
      applyFilters({ page });
    },
    [applyFilters]
  );

  const handleDeleted = useCallback(() => {
    router.refresh();
    applyFilters({}, { replace: true });
  }, [router, applyFilters]);

  return (
    <div data-testid="mobile-application-list">
      {/* Filters toolbar — reused from table */}
      <TableToolbar />

      {/* Loading skeleton */}
      {loading && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application cards */}
      {!loading && applications.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {applications.map((application) => (
            <MobileApplicationCard
              key={application.id}
              application={application}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No applications match your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 px-4">
          <TablePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
