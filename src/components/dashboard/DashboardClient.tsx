'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ApplicationsTable } from '@/components/applications/ApplicationsTable';
import { Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import type { ApplicationRow } from '@/components/applications/columns';
import { getApplications, type GetApplicationsParams } from '@/actions/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { filtersToSearchParams, searchParamsToFilters } from '@/lib/filterQueryParams';

// Lazy load heavy components to reduce initial bundle size
const ApplicationFormDialog = dynamic(
  () => import('@/components/applications/ApplicationFormDialog').then((mod) => ({ default: mod.ApplicationFormDialog })),
  {
    loading: () => null, // Dialog doesn't need loading state
    ssr: false, // Client-side only component
  }
);

const KanbanBoard = dynamic(
  () => import('@/components/applications/KanbanBoard').then((mod) => ({ default: mod.KanbanBoard })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-96 w-full" />
      </div>
    ),
    ssr: false, // Drag-and-drop is client-side only
  }
);

const YourJourneySection = dynamic(
  () => import('@/components/journey/YourJourneySection').then((mod) => ({ default: mod.YourJourneySection })),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
  }
);

interface DashboardClientProps {
  userName: string;
  initialApplications: ApplicationRow[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error: string | null;
}

export function DashboardClient({
  userName,
  initialApplications,
  initialPagination,
  error,
}: DashboardClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applications, setApplications] = useState(initialApplications);
  const [pagination, setPagination] = useState(initialPagination);
  const [filters, setFilters] = useState<GetApplicationsParams>({});
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('applicationViewMode');
    if (savedView === 'kanban' || savedView === 'table') {
      setViewMode(savedView);
    }
  }, []);

  // Track mobile breakpoint to force table view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!isInitialized) {
      const urlFilters = searchParamsToFilters(searchParams);
      // Only apply URL filters if there are any
      const hasUrlFilters = Object.keys(urlFilters).length > 0;

      if (hasUrlFilters) {
        setFilters(urlFilters);
        // Fetch applications with URL filters
        setLoading(true);
        getApplications(urlFilters)
          .then((result) => {
            if ('data' in result && 'pagination' in result) {
              setApplications(result.data);
              setPagination(result.pagination);
            }
          })
          .catch((err) => {
            console.error('Error fetching applications from URL filters:', err);
          })
          .finally(() => {
            setLoading(false);
          });
      }

      setIsInitialized(true);
    }
  }, [isInitialized, searchParams]);

  // Save view preference to localStorage
  const handleViewChange = (mode: 'table' | 'kanban') => {
    if (isMobile) return;
    setViewMode(mode);
    localStorage.setItem('applicationViewMode', mode);
  };

  const handleSuccess = () => {
    // Refresh the page to show the new application
    router.refresh();
    // Reset filters and refetch all applications
    setFilters({});
    handleFilterChange({});
  };

  const handleFilterChange = useCallback(
    async (newFilters: Partial<GetApplicationsParams>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      // Update URL with new filters (without page reload)
      const params = filtersToSearchParams(updatedFilters);
      const newUrl = params.toString() ? `?${params.toString()}` : '/dashboard';
      router.push(newUrl, { scroll: false });

      // Show loading skeleton immediately
      setLoading(true);

      // Fetch from server
      getApplications(updatedFilters)
        .then((result) => {
          if ('data' in result && 'pagination' in result) {
            setApplications(result.data);
            setPagination(result.pagination);
          }
        })
        .catch((err) => {
          console.error('Error fetching applications:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [filters, router]
  );

  // Memoize expensive stats calculations to prevent recalculation on every render
  const stats = useMemo(() => {
    const totalApplications = initialPagination.total;
    const activeApplications = applications.filter(
      (app) =>
        app.status === 'applied' ||
        app.status === 'screening' ||
        app.status === 'interviewing'
    ).length;
    const interviewingApplications = applications.filter(
      (app) => app.status === 'interviewing'
    ).length;
    const offerApplications = applications.filter(
      (app) => app.status === 'offer'
    ).length;

    return {
      total: totalApplications,
      active: activeApplications,
      interviewing: interviewingApplications,
      offers: offerApplications,
    };
  }, [applications, initialPagination.total]);

  const activeViewMode = isMobile ? 'table' : viewMode;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with CTA */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Welcome back, {userName}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            size="lg"
            className="w-full max-w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Application
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Applications
            </h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Active
            </h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.active}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Interviews
            </h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.interviewing}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Offers
            </h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.offers}
            </p>
          </div>
        </div>

        {/* Your Journey Section */}
        <div className="mb-8">
          <YourJourneySection />
        </div>

        {/* Applications View */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Applications
            </h2>

            {/* View Toggle */}
            <div className="hidden w-full items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-1 sm:flex sm:w-auto">
              <Button
                variant={activeViewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('table')}
                className="h-8"
              >
                <TableIcon className="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant={activeViewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('kanban')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
              </Button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 text-red-600 dark:text-red-400 mb-4">
              Error loading applications: {error}
            </div>
          )}

          {!error && stats.total === 0 && !loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No applications yet. Start tracking your job search!
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Application
              </Button>
            </div>
          ) : activeViewMode === 'table' ? (
            <ApplicationsTable
              data={applications}
              pagination={pagination}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          ) : (
            <KanbanBoard applications={applications} loading={loading} />
          )}
        </div>

        {/* Application Form Dialog */}
        <ApplicationFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
