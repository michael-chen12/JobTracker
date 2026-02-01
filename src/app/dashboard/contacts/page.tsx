import { Suspense } from 'react';
import { ContactsList } from '@/components/contacts/ContactsList';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <p className="text-muted-foreground mt-2">
          Manage your professional network and referrals
        </p>
      </div>

      <Suspense fallback={<ContactsListSkeleton />}>
        <ContactsList />
      </Suspense>
    </div>
  );
}

function ContactsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
