'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchJobDescription } from '@/lib/ai/job-scraper';
import { calculateBaseScore, adjustScoreWithClaude } from '@/lib/ai/match-scorer';
import { RateLimitError, APIError } from '@/lib/ai/errors';
import type { MatchAnalysis } from '@/types/ai';

export interface AnalyzeJobResult {
  success: boolean;
  score?: number;
  analysis?: MatchAnalysis;
  error?: string;
}

/**
 * Analyze job match for an application
 * 
 * Flow:
 * 1. Fetch job description (from URL or field)
 * 2. Get user profile data (skills, experience, education)
 * 3. Calculate base score (formula-based, 0-100)
 * 4. Get Claude adjustment (±10 points)
 * 5. Store results in database
 * 
 * @param applicationId - UUID of the application to analyze
 * @returns Analysis result with score and detailed breakdown
 */
export async function analyzeJobMatch(
  applicationId: string
): Promise<AnalyzeJobResult> {
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

    // 2. Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    // 3. Get job description
    let jobDescription = application.job_description || '';

    // If job_description is empty but job_url exists, try scraping
    if (!jobDescription && application.job_url) {
      const result = await fetchJobDescription(
        application.job_url,
        dbUser.id
      );

      if (result.source === 'unsupported') {
        return {
          success: false,
          error: result.error || 'This job board requires manual copy-paste.',
        };
      }

      if (result.source === 'failed') {
        return {
          success: false,
          error: result.error || "Couldn't fetch job description automatically.",
        };
      }

      jobDescription = result.description;
    }

    // If still empty, return error
    if (!jobDescription || jobDescription.trim().length < 50) {
      return {
        success: false,
        error: 'No job description available. Please add a description or job URL.',
      };
    }

    // 4. Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'User profile not found. Please complete your profile first.',
      };
    }

    // Get user experience
    const { data: experience, error: expError } = await supabase
      .from('user_experience')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('start_date', { ascending: false });

    if (expError) {
      console.error('Failed to fetch experience:', expError);
      return {
        success: false,
        error: 'Failed to fetch your experience data.',
      };
    }

    // Get user education
    const { data: education, error: eduError } = await supabase
      .from('user_education')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('start_date', { ascending: false });

    if (eduError) {
      console.error('Failed to fetch education:', eduError);
      return {
        success: false,
        error: 'Failed to fetch your education data.',
      };
    }

    // Check if user has minimum data
    if (!profile.skills || profile.skills.length === 0) {
      return {
        success: false,
        error: 'Please add your skills to your profile before analyzing jobs.',
      };
    }

    // 5. Calculate base score
    const jobDetails = {
      description: jobDescription,
      location: application.location,
      job_type: application.job_type,
      salary_range: application.salary_range as
        | { min?: number; max?: number; currency?: string }
        | undefined,
    };

    const userProfile = {
      skills: profile.skills || [],
      experience: experience || [],
      education: education || [],
      preferred_locations: profile.preferred_locations || [],
      preferred_job_types: profile.preferred_job_types || [],
      salary_expectation: profile.salary_expectation as
        | { min?: number; max?: number; currency?: string }
        | undefined,
    };

    const baseScore = calculateBaseScore(jobDetails, userProfile);

    // 6. Get Claude adjustment (±10 points)
    const analysis = await adjustScoreWithClaude(
      baseScore,
      jobDetails,
      userProfile,
      dbUser.id
    );

    // 7. Store results in database
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        match_score: analysis.adjusted_score,
        match_analysis: analysis as any, // JSONB type
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application:', updateError);
      return {
        success: false,
        error: 'Failed to save analysis results.',
      };
    }

    return {
      success: true,
      score: analysis.adjusted_score,
      analysis,
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof APIError) {
      return {
        success: false,
        error: `Analysis failed: ${error.message}`,
      };
    }

    console.error('Unexpected error in analyzeJobMatch:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
