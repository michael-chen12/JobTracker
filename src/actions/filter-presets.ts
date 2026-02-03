'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { GetApplicationsParams } from './applications';
import type { FilterPreset } from '@/types/filters';

const PRESETS_CACHE_TAG = 'filter-presets';
const PRESETS_CACHE_REVALIDATE = 300; // 5 minutes

/**
 * Get all filter presets for the current user (cached)
 */
const getFilterPresetsCached = unstable_cache(
  async (dbUserId: string): Promise<{ data?: FilterPreset[]; error?: string }> => {
    const supabase = createAdminClient();

    const { data: presets, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', dbUserId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching filter presets:', error);
      return { error: error.message };
    }

    return { data: presets };
  },
  ['filter-presets-list'],
  {
    revalidate: PRESETS_CACHE_REVALIDATE,
    tags: [PRESETS_CACHE_TAG],
  }
);

/**
 * Get all filter presets for the current user
 */
export async function getFilterPresets(): Promise<{ data?: FilterPreset[]; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    return getFilterPresetsCached(dbUser.id);
  } catch (error) {
    console.error('Error in getFilterPresets:', error);
    return { error: 'Failed to fetch filter presets' };
  }
}

/**
 * Save a new filter preset
 */
export async function saveFilterPreset(
  name: string,
  filters: GetApplicationsParams
): Promise<{ data?: FilterPreset; error?: string }> {
  try {
    // Validate name
    if (!name || name.trim().length === 0) {
      return { error: 'Preset name is required' };
    }

    if (name.length > 50) {
      return { error: 'Preset name must be 50 characters or less' };
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { error: 'Preset name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    const { data: preset, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: dbUser.id,
        name: name.trim(),
        filters,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate preset name)
      if (error.code === '23505') {
        return { error: 'A preset with this name already exists' };
      }
      console.error('Error saving filter preset:', error);
      return { error: error.message };
    }

    revalidateTag(PRESETS_CACHE_TAG, 'max');

    return { data: preset };
  } catch (error) {
    console.error('Error in saveFilterPreset:', error);
    return { error: 'Failed to save filter preset' };
  }
}

/**
 * Delete a filter preset
 */
export async function deleteFilterPreset(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { error } = await supabase.from('saved_filters').delete().eq('id', id);

    if (error) {
      console.error('Error deleting filter preset:', error);
      return { error: error.message };
    }

    revalidateTag(PRESETS_CACHE_TAG, 'max');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteFilterPreset:', error);
    return { error: 'Failed to delete filter preset' };
  }
}

/**
 * Update a filter preset name
 */
export async function updateFilterPreset(
  id: string,
  name: string
): Promise<{ data?: FilterPreset; error?: string }> {
  try {
    // Validate name
    if (!name || name.trim().length === 0) {
      return { error: 'Preset name is required' };
    }

    if (name.length > 50) {
      return { error: 'Preset name must be 50 characters or less' };
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { error: 'Preset name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data: preset, error } = await supabase
      .from('saved_filters')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return { error: 'A preset with this name already exists' };
      }
      console.error('Error updating filter preset:', error);
      return { error: error.message };
    }

    revalidateTag(PRESETS_CACHE_TAG, 'max');

    return { data: preset };
  } catch (error) {
    console.error('Error in updateFilterPreset:', error);
    return { error: 'Failed to update filter preset' };
  }
}
