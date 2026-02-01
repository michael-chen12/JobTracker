/**
 * Contact Detail Page
 * Ticket #17: Interaction History Tracking
 *
 * Server component for /dashboard/contacts/[id]
 * Fetches contact with full details and renders ContactDetail client component
 */

import { notFound } from 'next/navigation';
import { getContactWithDetails } from '@/actions/contacts';
import { ContactDetail } from '@/components/contacts/ContactDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch contact with interactions, stats, and relationship strength
  const result = await getContactWithDetails(id);

  if (!result.success || !result.data) {
    // Return 404 if contact not found or access denied
    notFound();
  }

  return <ContactDetail contact={result.data} />;
}
