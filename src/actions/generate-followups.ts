'use server';

/**
 * Server Action: Generate Follow-Up Suggestions
 *
 * Ticket #15: Follow-Up Suggestions
 *
 * Generates AI-powered follow-up suggestions with actions, timing,
 * priorities, rationales, and message templates.
 */

import { createClient } from '@/lib/supabase/server';
import { generateFollowUpSuggestions } from '@/lib/ai/follow-up-generator';
import { RateLimitError, APIError } from '@/lib/ai/errors';
import type { FollowUpSuggestions } from '@/types/ai';

export interface GenerateFollowUpsResult {
  success: boolean;
  suggestions?: FollowUpSuggestions;
  error?: string;
}

/**
 * Generate follow-up suggestions for an application
 *
 * Flow:
 * 1. Authenticate user
 * 2. Fetch application with ownership verification
 * 3. Validate required fields
 * 4. Call AI service to generate suggestions
 * 5. Store suggestions + timestamp in database
 * 6. Return result
 *
 * @param applicationId - UUID of the application
 * @returns Result with suggestions or error message
 */
export async function generateFollowUps(
  applicationId: string
): Promise<GenerateFollowUpsResult> {
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

    // 2. Fetch application (verify ownership via RLS + explicit check)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      console.error('Application fetch error:', appError);
      return { success: false, error: 'Application not found' };
    }

    // 3. Validate required fields
    if (!application.company || !application.position || !application.status) {
      return {
        success: false,
        error: 'Application missing required details (company, position, or status)',
      };
    }

    // Extract notes summary if available
    const notesSummary = application.notes_summary?.summary || null;

    // 4. Generate suggestions using AI service
    const suggestions = await generateFollowUpSuggestions(
      {
        company: application.company,
        position: application.position,
        status: application.status,
        applied_date: application.applied_date,
        notes_summary: notesSummary,
      },
      dbUser.id
    );

    // 5. Store suggestions in database
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        follow_up_suggestions: suggestions as any, // JSONB type
        followup_suggestions_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application with suggestions:', updateError);
      return {
        success: false,
        error: 'Failed to save suggestions. Please try again.',
      };
    }

    // 6. Return success with suggestions
    return {
      success: true,
      suggestions,
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
    console.error('Unexpected error in generateFollowUps:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
