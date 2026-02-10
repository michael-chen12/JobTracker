import type { Metadata } from "next";
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track all your job applications in one place.",
};
import { getApplications } from '@/actions/applications';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const applicationsResult = await getApplications({ page: 1, limit: 20 });

  return (
    <DashboardClient
      userName={user.user_metadata?.full_name || user.email || 'User'}
      initialApplications={
        'data' in applicationsResult ? applicationsResult.data : []
      }
      initialPagination={
        'pagination' in applicationsResult
          ? applicationsResult.pagination
          : { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
      error={'error' in applicationsResult ? (applicationsResult.error ?? null) : null}
    />
  );
}
