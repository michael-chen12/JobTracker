import { ContactsListSkeleton } from '@/components/common/LoadingStates';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-12 w-full" />
      <ContactsListSkeleton count={6} />
    </div>
  );
}
