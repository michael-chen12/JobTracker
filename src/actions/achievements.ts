'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { detectAchievements } from '@/lib/achievements/detector';
import { triggerNotification } from '@/lib/notifications/trigger';
import type {
  Achievement,
  AchievementType,
  AchievementMetadata,
  AchievementWithMetadata,
  CelebrationData,
} from '@/types/achievements';

const ACHIEVEMENTS_CACHE_TAG = 'achievements';
const ACHIEVEMENTS_CACHE_REVALIDATE = 60; // 60 seconds

/**
 * Create a new achievement (internal function, uses admin client)
 * @param userId - Database user ID
 * @param type - Achievement type
 * @param metadata - Achievement metadata
 * @returns Created achievement or error
 */
export async function createAchievement(
  userId: string,
  type: AchievementType,
  metadata: AchievementMetadata
) {
  try {
    const supabase = createAdminClient();

    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_type: type,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      return { error: error.message };
    }

    return { data: achievement };
  } catch (error) {
    console.error('Exception in createAchievement:', error);
    return { error: 'Failed to create achievement' };
  }
}

/**
 * Get achievements for the current user (cached)
 * @param limit - Maximum number of achievements to return (default: 20)
 * @param uncelebratedOnly - Only return uncelebrated achievements (default: false)
 * @returns Array of achievements or error
 */
const getAchievementsCached = unstable_cache(
  async (
    dbUserId: string,
    limit: number = 20,
    uncelebratedOnly: boolean = false
  ) => {
    const supabase = createAdminClient();

    let query = supabase
      .from('achievements')
      .select('*')
      .eq('user_id', dbUserId)
      .order('achieved_at', { ascending: false })
      .limit(limit);

    if (uncelebratedOnly) {
      query = query.eq('celebrated', false);
    }

    const { data: achievements, error } = await query;

    if (error) {
      console.error('Error fetching achievements:', error);
      return { error: error.message };
    }

    return { data: achievements as AchievementWithMetadata[] };
  },
  ['achievements-list'],
  { revalidate: ACHIEVEMENTS_CACHE_REVALIDATE, tags: [ACHIEVEMENTS_CACHE_TAG] }
);

export async function getAchievements(
  limit: number = 20,
  uncelebratedOnly: boolean = false
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    return getAchievementsCached(dbUser.id, limit, uncelebratedOnly);
  } catch (error) {
    console.error('Error in getAchievements:', error);
    return { error: 'Failed to fetch achievements' };
  }
}

/**
 * Mark an achievement as celebrated
 * @param achievementId - Achievement ID to mark as celebrated
 * @returns Updated achievement or error
 */
export async function markAchievementCelebrated(achievementId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    // Update achievement (RLS ensures user owns this achievement)
    const { data: achievement, error } = await supabase
      .from('achievements')
      .update({ celebrated: true })
      .eq('id', achievementId)
      .eq('user_id', dbUser.id) // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Error marking achievement as celebrated:', error);
      return { error: error.message };
    }

    // Revalidate cache
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/wins');
    revalidateTag(ACHIEVEMENTS_CACHE_TAG, 'max');

    return { data: achievement };
  } catch (error) {
    console.error('Exception in markAchievementCelebrated:', error);
    return { error: 'Failed to mark achievement as celebrated' };
  }
}

/**
 * Main orchestrator: Detect and celebrate achievements
 * Called after creating or updating an application
 * @param applicationId - Optional application ID that triggered this detection
 * @returns Detection result with celebration data
 */
export async function detectAndCelebrateAchievements(applicationId?: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user's database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    // Run detection logic
    const result = await detectAchievements(dbUser.id, applicationId);

    // Revalidate cache if new achievements were created
    if (result.newAchievements.length > 0) {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/wins');
      revalidateTag(ACHIEVEMENTS_CACHE_TAG, 'max');

      // Trigger notification for each new achievement (fire-and-forget)
      for (const celebration of result.celebrationData) {
        triggerNotification({
          userId: dbUser.id,
          type: 'achievement',
          title: celebration.title,
          message: celebration.message,
          actionUrl: '/dashboard/wins',
        }).catch((err) => console.error('Achievement notification error:', err));
      }
    }

    return { data: result };
  } catch (error) {
    console.error('Exception in detectAndCelebrateAchievements:', error);
    return { error: 'Failed to detect achievements' };
  }
}
