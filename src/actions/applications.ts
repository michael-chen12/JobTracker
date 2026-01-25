'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createApplicationSchema,
  updateApplicationSchema,
  createNoteSchema,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type CreateNoteInput,
} from '@/schemas/application';

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

    return { data: application };
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

    return { data: application };
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

    return { success: true };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { error: 'Failed to delete application' };
  }
}

/**
 * Get all applications for the current user
 */
export async function getApplications() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get applications with notes (using RLS)
    const { data: applications, error } = await supabase
      .from('applications')
      .select(
        `
        *,
        notes:application_notes(*)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return { error: error.message };
    }

    return { data: applications };
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
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return { error: error.message };
    }

    return { data: application };
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

    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { error: 'Failed to delete note' };
  }
}
