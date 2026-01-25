'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApplicationFormDialog } from '@/components/applications/ApplicationFormDialog';
import { ApplicationsTable } from '@/components/applications/ApplicationsTable';
import { Plus } from 'lucide-react';
import type { ApplicationRow } from '@/components/applications/columns';
import { getApplications, type GetApplicationsParams } from '@/actions/applications';

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
  const router = useRouter();

  const handleSuccess = () => {
    // Refresh the page to show the new application
    router.refresh();
    // Also refetch with current filters
    handleFilterChange(filters);
  };

  const handleFilterChange = useCallback(
    async (newFilters: Partial<GetApplicationsParams>) => {
      setFilters((prevFilters) => {
        const updatedFilters = { ...prevFilters, ...newFilters };

        setLoading(true);
        getApplications(updatedFilters)
          .then((result) => {
            if (result.data && result.pagination) {
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

        return updatedFilters;
      });
    },
    []
  );

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with CTA */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back, {userName}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Application
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Applications
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {totalApplications}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {activeApplications}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Interviews
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {interviewingApplications}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Offers
            </h3>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {offerApplications}
            </p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Applications
            </h2>
          </div>

          {error && (
            <div className="px-6 py-4 text-red-600 dark:text-red-400 mb-4">
              Error loading applications: {error}
            </div>
          )}

          {!error && totalApplications === 0 && !loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No applications yet. Start tracking your job search!
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Application
              </Button>
            </div>
          ) : (
            <ApplicationsTable
              data={applications}
              pagination={pagination}
              onFilterChange={handleFilterChange}
            />
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
