'use server';

/**
 * Server Action: Summarize Notes
 *
 * Ticket #14: Notes Summarization
 *
 * Generates AI-powered summary of application notes with insights,
 * action items, and follow-up needs.
 */

import { createClient } from '@/lib/supabase/server';
import { summarizeApplicationNotes } from '@/lib/ai/notes-summarizer';
import { RateLimitError, APIError } from '@/lib/ai/errors';
import type { NotesSummary } from '@/types/ai';

export interface SummarizeNotesResult {
  success: boolean;
  summary?: NotesSummary;
  truncated?: boolean;
  error?: string;
}

/**
 * Summarize notes for an application
 *
 * Flow:
 * 1. Authenticate user
 * 2. Fetch application + notes with ownership verification
 * 3. Validate notes exist
 * 4. Call AI service to generate summary
 * 5. Store summary + timestamp in database
 * 6. Return result
 *
 * @param applicationId - UUID of the application
 * @returns Result with summary or error message
 */
export async function summarizeNotes(
  applicationId: string
): Promise<SummarizeNotesResult> {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get database user ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { success: false, error: 'User not found' };
    }

    // 2. Fetch application with notes (verify ownership via RLS + explicit check)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(
        `
        *,
        notes:application_notes(*)
      `
      )
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      console.error('Application fetch error:', appError);
      return { success: false, error: 'Application not found' };
    }

    // 3. Validate notes exist
    const notes = application.notes || [];
    if (notes.length === 0) {
      return {
        success: false,
        error: 'No notes to summarize. Add notes to generate a summary.',
      };
    }

    // 4. Generate summary using AI service
    const { summary, truncated } = await summarizeApplicationNotes(
      notes,
      {
        company: application.company,
        position: application.position,
        status: application.status,
      },
      dbUser.id
    );

    // Add metadata to summary
    const summaryWithMeta = {
      ...summary,
      notesCount: notes.length,
      latestNoteDate: notes.reduce((latest: number, note: typeof notes[0]) => {
        const noteDate = new Date(note.created_at).getTime();
        return noteDate > latest ? noteDate : latest;
      }, 0),
    };

    // 5. Store summary in database
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        notes_summary: summaryWithMeta as any, // JSONB type
        summarized_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application with summary:', updateError);
      return {
        success: false,
        error: 'Failed to save summary. Please try again.',
      };
    }

    // 6. Return success with summary
    return {
      success: true,
      summary: summaryWithMeta,
      truncated,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: error.message, // Includes reset time
      };
    }

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Log unexpected errors
    console.error('Unexpected error in summarizeNotes:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
