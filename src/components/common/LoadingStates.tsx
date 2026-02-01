import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading states following consistent patterns
 * Use with React Suspense for automatic loading UI
 */

/**
 * Contact card skeleton
 *
 * @example
 * <Suspense fallback={<ContactCardSkeleton />}>
 *   <ContactCard contact={contact} />
 * </Suspense>
 */
export function ContactCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * List of contact card skeletons
 */
export function ContactsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Application card skeleton
 *
 * @example
 * <Suspense fallback={<ApplicationCardSkeleton />}>
 *   <ApplicationCard application={app} />
 * </Suspense>
 */
export function ApplicationCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Application detail page skeleton
 */
export function ApplicationDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Additional sections */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Interaction item skeleton
 */
export function InteractionItemSkeleton() {
  return (
    <div className="border-b pb-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Generic list skeleton
 */
export function ListSkeleton({ count = 5, itemHeight = 'h-12' }: { count?: number; itemHeight?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${itemHeight}`} />
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  );
}
