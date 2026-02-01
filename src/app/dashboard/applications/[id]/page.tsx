import { notFound } from 'next/navigation';
import { getApplication } from '@/actions/applications';
import { getContact } from '@/actions/contacts';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Application Detail Page (Server Component)
 *
 * Fetches application data and optional referral contact on the server
 * Eliminates useEffect in client component for better performance
 */
export default async function ApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getApplication(id);

  if ('error' in result || !('data' in result)) {
    notFound();
  }

  // Fetch referral contact if linked (server-side, no useEffect needed)
  const referralContactId = (result.data as any).referral_contact_id;
  let referralContact = null;

  if (referralContactId) {
    const contactResult = await getContact(referralContactId);
    if (contactResult.success && contactResult.contact) {
      referralContact = contactResult.contact;
    }
  }

  return <ApplicationDetail application={result.data} referralContact={referralContact} />;
}
