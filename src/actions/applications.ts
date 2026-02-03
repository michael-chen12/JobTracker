'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import {
  createApplicationSchema,
  updateApplicationSchema,
  createNoteSchema,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type CreateNoteInput,
} from '@/schemas/application';
import { detectAndCelebrateAchievements } from './achievements';
import type { CelebrationData } from '@/types/achievements';

const APPLICATIONS_CACHE_TAG = 'applications';
// Extend cache to 5 minutes for better performance (data doesn't change that frequently)
// Users can manually refresh or mutations will invalidate cache via tags
const APPLICATIONS_CACHE_REVALIDATE = 300; // 5 minutes

/**
 * Create a new job application
 */
export async function createApplication(data: CreateApplicationInput) {
  console.log('=== SERVER ACTION: createApplication ===');
  console.log('Received data:', data);

  try {
    // Validate input
    console.log('Validating with Zod schema...');
    const validatedData = createApplicationSchema.parse(data);
    console.log('Validation passed:', validatedData);

    const supabase = await createClient();

    // Get current user
    console.log('Getting authenticated user...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Auth error or no user:', authError);
      return { error: 'Unauthorized' };
    }
    console.log('User authenticated:', user.id);

    // Get user's database ID
    console.log('Fetching user database ID...');
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      console.log('User lookup error:', userError);
      return { error: 'User not found' };
    }
    console.log('Database user ID:', dbUser.id);

    // Insert application
    console.log('Inserting application into database...');
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id: dbUser.id,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return { error: error.message };
    }

    console.log('Application created successfully:', application.id);
    revalidatePath('/dashboard');
    revalidatePath('/applications');
    revalidateTag(APPLICATIONS_CACHE_TAG, 'max');
    revalidateTag('contacts', 'max');

    // Detect achievements after creating application
    console.log('Detecting achievements...');
    const achievementResult = await detectAndCelebrateAchievements(application.id);
    const celebrationData: CelebrationData[] =
      achievementResult.data?.celebrationData || [];
    console.log('Achievement detection completed:', celebrationData.length, 'celebrations');

    return { data: application, celebrationData };
  } catch (error) {
    console.error('Exception in createApplication:', error);
    return { error: 'Failed to create application' };
  }
}

/**
 * Update an existing application
 */
export async function updateApplication(id: string, data: UpdateApplicationInput) {
  try {
    const validatedData = updateApplicationSchema.parse(data);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Update application (RLS ensures user owns this application)
    const { data: application, error } = await supabase
      .from('applications')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return { error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/applications');
    revalidatePath(`/applications/${id}`);
    revalidateTag(APPLICATIONS_CACHE_TAG, 'max');
    revalidateTag('contacts', 'max');

    // Detect achievements after status change
    const achievementResult = await detectAndCelebrateAchievements(id);
    const celebrationData: CelebrationData[] =
      achievementResult.data?.celebrationData || [];

    return { data: application, celebrationData };
  } catch (error) {
    console.error('Error updating application:', error);
    return { error: 'Failed to update application' };
  }
}

/**
 * Delete an application
 */
export async function deleteApplication(id: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Delete application (RLS ensures user owns this application)
    // Cascade delete will handle notes and documents
    const { error } = await supabase.from('applications').delete().eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return { error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/applications');
    revalidateTag(APPLICATIONS_CACHE_TAG, 'max');
    revalidateTag('contacts', 'max');

    return { success: true };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { error: 'Failed to delete application' };
  }
}

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  sortBy?: 'company' | 'position' | 'status' | 'applied_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  status?: string[];
  search?: string;
  hasReferral?: boolean;
}

const getApplicationsCached = unstable_cache(
  async (dbUserId: string, params: GetApplicationsParams = {}) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      search,
      hasReferral,
    } = params;

    const supabase = createAdminClient();

    // Build query with count for pagination
    let query = supabase
      .from('applications')
      .select(
        `
        *,
        notes:application_notes(id),
        referral_contact:contacts!referral_contact_id(id, name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', dbUserId);

    // Apply status filter
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    // Apply search filter (case-insensitive search on company and position)
    if (search && search.trim()) {
      query = query.or(`company.ilike.%${search}%,position.ilike.%${search}%`);
    }

    // Apply referral filter
    if (hasReferral !== undefined) {
      if (hasReferral) {
        query = query.not('referral_contact_id', 'is', null);
      } else {
        query = query.is('referral_contact_id', null);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return { error: error.message };
    }

    // Transform response to include referral contact details
    const transformedApplications =
      applications?.map((app) => {
        // Handle referral_contact which could be null, an object, or an array
        const referralContact = Array.isArray(app.referral_contact)
          ? app.referral_contact[0]
          : app.referral_contact;

        return {
          ...app,
          referral_contact_id: referralContact?.id || null,
          referral_contact_name: referralContact?.name || null,
        };
      }) || [];

    return {
      data: transformedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },
  ['applications-list'],
  {
    revalidate: APPLICATIONS_CACHE_REVALIDATE,
    tags: [APPLICATIONS_CACHE_TAG],
  }
);

const getApplicationCached = unstable_cache(
  async (dbUserId: string, id: string) => {
    const supabase = createAdminClient();

    // Get application with related data
    const { data: application, error } = await supabase
      .from('applications')
      .select(
        `
        *,
        notes:application_notes(*),
        documents:application_documents(*),
        milestones:milestones(*)
      `
      )
      .eq('id', id)
      .eq('user_id', dbUserId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return { error: error.message };
    }

    return { data: application };
  },
  ['application-detail'],
  { revalidate: APPLICATIONS_CACHE_REVALIDATE, tags: [APPLICATIONS_CACHE_TAG] }
);

/**
 * Get all applications for the current user with filtering, sorting, and pagination
 */
export async function getApplications(params: GetApplicationsParams = {}) {
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

    return getApplicationsCached(dbUser.id, params);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return { error: 'Failed to fetch applications' };
  }
}

/**
 * Get a single application by ID
 */
export async function getApplication(id: string) {
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

    return getApplicationCached(dbUser.id, id);
  } catch (error) {
    console.error('Error fetching application:', error);
    return { error: 'Failed to fetch application' };
  }
}

/**
 * Add a note to an application
 */
export async function createNote(data: CreateNoteInput) {
  try {
    const validatedData = createNoteSchema.parse(data);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Insert note (RLS ensures user owns the parent application)
    const { data: note, error } = await supabase
      .from('application_notes')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return { error: error.message };
    }

    revalidatePath(`/applications/${data.application_id}`);
    revalidateTag(APPLICATIONS_CACHE_TAG, 'max');

    return { data: note };
  } catch (error) {
    console.error('Error creating note:', error);
    return { error: 'Failed to create note' };
  }
}

/**
 * Delete a note
 */
export async function deleteNote(id: string, applicationId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Delete note (RLS ensures user owns the parent application)
    const { error } = await supabase.from('application_notes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return { error: error.message };
    }

    revalidatePath(`/applications/${applicationId}`);
    revalidateTag(APPLICATIONS_CACHE_TAG, 'max');

    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { error: 'Failed to delete note' };
  }
}
