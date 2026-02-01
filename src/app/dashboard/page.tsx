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

  // Fetch user's applications with pagination
  const result = await getApplications({ page: 1, limit: 20 });

  return (
    <DashboardClient
      userName={user.user_metadata?.full_name || user.email || 'User'}
      initialApplications={'data' in result ? result.data : []}
      initialPagination={
        'pagination' in result ? result.pagination : { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
      error={'error' in result ? (result.error ?? null) : null}
    />
  );
}
