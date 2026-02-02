'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { calculateInsights } from '@/lib/insights/calculator';
import type { InsightsResult } from '@/types/insights';
import type { Application, ApplicationNote } from '@/types/application';

/**
 * Get activity insights for the current user
 *
 * This server action:
 * 1. Authenticates the user
 * 2. Checks privacy control (insights_enabled in user_profiles)
 * 3. If enabled, fetches applications and notes
 * 4. Calculates burnout detection, weekly activity, and baseline pacing
 * 5. Returns InsightsResult with generated insight items
 *
 * Privacy: Returns empty result if insights are disabled
 *
 * @returns InsightsResult or error
 */
export async function getInsights(): Promise<{
  data: InsightsResult | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized' };
    }

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { data: null, error: 'User not found' };
    }

    // Check privacy control: insights_enabled
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('insights_enabled')
      .eq('user_id', dbUser.id)
      .single();

    // Default to enabled if profile doesn't exist or error occurs
    const insightsEnabled = profileError ? true : (profile?.insights_enabled ?? true);

    // If insights are disabled, return empty result
    if (!insightsEnabled) {
      return {
        data: {
          burnout: {
            hasHighRejectionRate: false,
            rejectionRate: 0,
            recentApplicationsCount: 0,
            rejectionsCount: 0,
          },
          weeklyActivity: {
            applications: 0,
            notes: 0,
            statusChanges: 0,
            weekStart: new Date(),
            weekEnd: new Date(),
          },
          baseline: {
            averageWeeklyApplications: 0,
            weeksAnalyzed: 0,
            currentWeekApplications: 0,
            percentageOfBaseline: 0,
          },
          insights: [],
        },
        error: null,
      };
    }

    // Fetch applications using admin client
    const { data: applications, error: appsError } = await adminClient
      .from('applications')
      .select('*')
      .eq('user_id', dbUser.id);

    if (appsError || !applications) {
      console.error('Error fetching applications for insights:', appsError);
      return { data: null, error: 'Failed to fetch applications' };
    }

    // Fetch notes using admin client
    // Continue with empty array if notes fetch fails (notes are optional)
    const { data: notes } = await adminClient
      .from('application_notes')
      .select('*')
      .in(
        'application_id',
        applications.map((app) => app.id)
      );

    const safeNotes = notes || [];

    // Calculate insights
    const result = calculateInsights(
      applications as Application[],
      safeNotes as ApplicationNote[]
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Exception in getInsights:', error);
    return { data: null, error: 'Failed to calculate insights' };
  }
}
