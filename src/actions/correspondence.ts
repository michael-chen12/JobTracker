'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ApplicationCorrespondence } from '@/types/application';
import { createCorrespondenceSchema } from '@/schemas/application';

// --- Return types (discriminated unions, matching project pattern) ---

type CreateCorrespondenceResult =
  | { success: true; data: ApplicationCorrespondence }
  | { success: false; error: string };

type ListCorrespondenceResult =
  | { success: true; data: ApplicationCorrespondence[] }
  | { success: false; error: string };

type DeleteCorrespondenceResult = { success: true } | { success: false; error: string };

// --- Helper: Get authenticated user ---

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { authUser: null, dbUser: null };
  }

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (userError || !dbUser) {
    return { authUser, dbUser: null };
  }

  return { authUser, dbUser };
}

// --- Actions ---

export async function createCorrespondence(
  input: unknown
): Promise<CreateCorrespondenceResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input with Zod
    const parsed = createCorrespondenceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Verify application ownership (IDOR protection)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', parsed.data.application_id)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    // Insert correspondence record
    const { data: record, error: insertError } = await supabase
      .from('application_correspondence')
      .insert({
        application_id: parsed.data.application_id,
        subject: parsed.data.subject,
        sender: parsed.data.sender,
        recipient: parsed.data.recipient ?? null,
        direction: parsed.data.direction,
        correspondence_date: parsed.data.correspondence_date,
        notes: parsed.data.notes ?? null,
      })
      .select('*')
      .single();

    if (insertError || !record) {
      console.error('Correspondence insert error:', insertError);
      return { success: false, error: 'Failed to save correspondence' };
    }

    revalidatePath(`/dashboard/applications/${parsed.data.application_id}`);

    return { success: true, data: record as ApplicationCorrespondence };
  } catch (error) {
    console.error('Unexpected error in createCorrespondence:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function listCorrespondence(
  applicationId: string
): Promise<ListCorrespondenceResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    // Fetch all correspondence for this application (newest first)
    const { data: correspondence, error: fetchError } = await supabase
      .from('application_correspondence')
      .select('*')
      .eq('application_id', applicationId)
      .order('correspondence_date', { ascending: false });

    if (fetchError) {
      console.error('List correspondence error:', fetchError);
      return { success: false, error: 'Failed to fetch correspondence' };
    }

    return {
      success: true,
      data: (correspondence ?? []) as ApplicationCorrespondence[],
    };
  } catch (error) {
    console.error('Unexpected error in listCorrespondence:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteCorrespondence(
  correspondenceId: string,
  applicationId: string
): Promise<DeleteCorrespondenceResult> {
  try {
    const supabase = await createClient();
    const { dbUser } = await getAuthenticatedUser(supabase);

    if (!dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Unauthorized access' };
    }

    // Verify correspondence belongs to this application
    const { data: record, error: fetchError } = await supabase
      .from('application_correspondence')
      .select('id')
      .eq('id', correspondenceId)
      .eq('application_id', applicationId)
      .single();

    if (fetchError || !record) {
      return { success: false, error: 'Correspondence not found' };
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('application_correspondence')
      .delete()
      .eq('id', correspondenceId);

    if (deleteError) {
      console.error('Correspondence delete error:', deleteError);
      return { success: false, error: 'Failed to delete correspondence' };
    }

    revalidatePath(`/dashboard/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteCorrespondence:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
