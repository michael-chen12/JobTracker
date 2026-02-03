'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createTagSchema,
  updateTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
} from '@/schemas/application';
import type { Tag } from '@/types/application';

const TAGS_CACHE_TAG = 'tags';
const TAGS_CACHE_REVALIDATE = 300; // 5 minutes

/**
 * Get all tags for the current user (cached)
 */
const getTagsCached = unstable_cache(
  async (dbUserId: string): Promise<{ data?: Tag[]; error?: string }> => {
    const supabase = createAdminClient();

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', dbUserId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return { error: error.message };
    }

    return { data: tags };
  },
  ['tags-list'],
  {
    revalidate: TAGS_CACHE_REVALIDATE,
    tags: [TAGS_CACHE_TAG],
  }
);

/**
 * Get all tags for the current user
 */
export async function getTags(): Promise<{ data?: Tag[]; error?: string }> {
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

    return getTagsCached(dbUser.id);
  } catch (error) {
    console.error('Error in getTags:', error);
    return { error: 'Failed to fetch tags' };
  }
}

/**
 * Create a new tag
 */
export async function createTag(
  data: CreateTagInput
): Promise<{ data?: Tag; error?: string }> {
  try {
    const validatedData = createTagSchema.parse(data);

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
      console.error('User lookup failed:', { authId: user.id, error: userError });
      return { error: 'User not found' };
    }

    console.log('Creating tag with:', {
      user_id: dbUser.id,
      auth_id: user.id,
      tag_data: validatedData,
    });

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        user_id: dbUser.id,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      console.error('Tag insert error:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    if (error) {
      // Handle unique constraint violation (duplicate tag name)
      if (error.code === '23505') {
        return { error: 'A tag with this name already exists' };
      }
      console.error('Error creating tag:', error);
      return { error: error.message };
    }

    revalidateTag(TAGS_CACHE_TAG, 'max');

    return { data: tag };
  } catch (error) {
    console.error('Error in createTag:', error);
    return { error: 'Failed to create tag' };
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  data: UpdateTagInput
): Promise<{ data?: Tag; error?: string }> {
  try {
    const validatedData = updateTagSchema.parse(data);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data: tag, error } = await supabase
      .from('tags')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return { error: 'A tag with this name already exists' };
      }
      console.error('Error updating tag:', error);
      return { error: error.message };
    }

    revalidateTag(TAGS_CACHE_TAG, 'max');

    return { data: tag };
  } catch (error) {
    console.error('Error in updateTag:', error);
    return { error: 'Failed to update tag' };
  }
}

/**
 * Delete a tag (cascades to application_tags)
 */
export async function deleteTag(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { error } = await supabase.from('tags').delete().eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      return { error: error.message };
    }

    revalidateTag(TAGS_CACHE_TAG, 'max');
    revalidateTag('applications', 'max');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteTag:', error);
    return { error: 'Failed to delete tag' };
  }
}

/**
 * Add tags to an application
 */
export async function addTagsToApplication(
  applicationId: string,
  tagIds: string[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Upsert to handle duplicates gracefully
    const { error } = await supabase.from('application_tags').upsert(
      tagIds.map((tagId) => ({
        application_id: applicationId,
        tag_id: tagId,
      })),
      { onConflict: 'application_id,tag_id' }
    );

    if (error) {
      console.error('Error adding tags to application:', error);
      return { error: error.message };
    }

    revalidateTag('applications', 'max');

    return { success: true };
  } catch (error) {
    console.error('Error in addTagsToApplication:', error);
    return { error: 'Failed to add tags to application' };
  }
}

/**
 * Remove a tag from an application
 */
export async function removeTagFromApplication(
  applicationId: string,
  tagId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('application_tags')
      .delete()
      .eq('application_id', applicationId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag from application:', error);
      return { error: error.message };
    }

    revalidateTag('applications', 'max');

    return { success: true };
  } catch (error) {
    console.error('Error in removeTagFromApplication:', error);
    return { error: 'Failed to remove tag from application' };
  }
}

/**
 * Get tags for a specific application
 */
export async function getApplicationTags(
  applicationId: string
): Promise<{ data?: Tag[]; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data: tags, error } = await supabase
      .from('application_tags')
      .select('tag_id, tags(*)')
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error fetching application tags:', error);
      return { error: error.message };
    }

    // Extract tags from the join result
    const extractedTags = tags?.map((item: any) => item.tags).filter(Boolean) || [];

    return { data: extractedTags };
  } catch (error) {
    console.error('Error in getApplicationTags:', error);
    return { error: 'Failed to fetch application tags' };
  }
}
