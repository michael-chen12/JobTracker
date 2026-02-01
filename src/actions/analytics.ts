'use server';

import { unstable_cache } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { calculateMetrics } from '@/lib/analytics/metrics-calculator';
import type { DateRangeFilter, AnalyticsData } from '@/types/analytics';

const ANALYTICS_CACHE_TAG = 'analytics';
const ANALYTICS_CACHE_REVALIDATE = 60; // 60 seconds TTL

/**
 * Cached analytics data fetcher
 * Fetches applications for the user and calculates analytics metrics
 */
const getAnalyticsCached = unstable_cache(
  async (dbUserId: string, dateRange: DateRangeFilter) => {
    const supabase = createAdminClient();

    // Fetch all applications for the user
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', dbUserId);

    if (error) {
      console.error('Error fetching applications for analytics:', error);
      return { error: error.message };
    }

    // Calculate metrics using the metrics calculator
    const analyticsData = calculateMetrics(applications || [], dateRange);

    return { data: analyticsData };
  },
  ['analytics-data'],
  { revalidate: ANALYTICS_CACHE_REVALIDATE, tags: [ANALYTICS_CACHE_TAG] }
);

/**
 * Get analytics data for the current user
 *
 * This server action:
 * 1. Authenticates the user
 * 2. Fetches all applications for the user (cached for 60s)
 * 3. Calculates analytics metrics
 * 4. Returns analytics data or error
 *
 * @param dateRange - The date range filter ('30', '60', or '90' days)
 * @returns Object with data: AnalyticsData | null and error: string | null
 */
export async function getAnalytics(
  dateRange: DateRangeFilter = '30'
): Promise<{ data: AnalyticsData | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get current user
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

    // Get cached analytics data
    const result = await getAnalyticsCached(dbUser.id, dateRange);

    if ('error' in result && result.error) {
      return { data: null, error: result.error };
    }

    return { data: result.data || null, error: null };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { data: null, error: 'Failed to fetch analytics' };
  }
}
