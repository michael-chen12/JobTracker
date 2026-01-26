import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-4 w-48 mb-6" />

        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {/* Main details card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Notes section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
