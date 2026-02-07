import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getApplications } from '@/actions/applications';
import { getAchievements } from '@/actions/achievements';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { AchievementWithMetadata } from '@/types/achievements';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch independent dashboard data in parallel to avoid server waterfalls.
  const [applicationsResult, achievementsResult] = await Promise.all([
    getApplications({ page: 1, limit: 20 }),
    getAchievements(10),
  ]);

  const initialJourneyAchievements: AchievementWithMetadata[] =
    'data' in achievementsResult && achievementsResult.data
      ? achievementsResult.data
      : [];

  const initialJourneyError =
    'error' in achievementsResult ? achievementsResult.error ?? null : null;

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
      initialJourneyAchievements={initialJourneyAchievements}
      initialJourneyError={initialJourneyError}
    />
  );
}
