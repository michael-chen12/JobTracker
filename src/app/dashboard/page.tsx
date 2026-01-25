import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getApplications } from '@/actions/applications';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's applications
  const { data: applications, error } = await getApplications();

  return (
    <DashboardClient
      userName={user.user_metadata?.full_name || user.email || 'User'}
      applications={applications || []}
      error={error || null}
    />
  );
}
