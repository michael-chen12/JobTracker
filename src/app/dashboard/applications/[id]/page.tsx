import { notFound } from 'next/navigation';
import { getApplication } from '@/actions/applications';
import { getContact } from '@/actions/contacts';
import { listCorrespondence } from '@/actions/correspondence';
import { createClient } from '@/lib/supabase/server';
import { ApplicationDetail } from '@/components/applications/ApplicationDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Application Detail Page (Server Component)
 *
 * Fetches application data, referral contact, and correspondence on the server
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

  // Fetch correspondence and user email in parallel
  const [correspondenceResult, supabase] = await Promise.all([
    listCorrespondence(id),
    createClient(),
  ]);
  const correspondence = correspondenceResult.success ? correspondenceResult.data : [];

  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userEmail = authUser?.email ?? undefined;

  return (
    <ApplicationDetail
      application={result.data}
      referralContact={referralContact}
      correspondence={correspondence}
      userEmail={userEmail}
    />
  );
}
