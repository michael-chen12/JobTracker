import { ContactCardSkeleton } from '@/components/common/LoadingStates';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <ContactCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
