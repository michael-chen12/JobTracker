import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-2 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-2 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-80" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-4 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-2 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-56" />
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-2 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
