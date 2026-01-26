'use server';

import { createClient } from '@/lib/supabase/server';
import { extractDocumentText } from '@/lib/ai/document-parser';
import { parseResumeText } from '@/lib/ai/resume-parser';
import { revalidatePath } from 'next/cache';

/**
 * Resume parsing job statuses
 */
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Resume parsing job from database
 */
interface ResumeParsingJob {
  id: string;
  user_id: string;
  resume_url: string;
  status: JobStatus;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

type TriggerParsingResult =
  | { success: true; data: { jobId: string } }
  | { success: false; error: string };

type ProcessingResult =
  | { success: true }
  | { success: false; error: string };

type JobStatusResult =
  | { success: true; data: { status: JobStatus; error?: string } }
  | { success: false; error: string };

/**
 * Trigger resume parsing for the current user's uploaded resume
 * Creates a parsing job in the database
 */
export async function triggerResumeParsing(): Promise<TriggerParsingResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's resume URL from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('resume_url')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.resume_url) {
      return { success: false, error: 'No resume found. Please upload a resume first.' };
    }

    // Check if there's already a pending or processing job
    const { data: existingJobs } = await supabase
      .from('resume_parsing_jobs')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingJobs && existingJobs.length > 0) {
      return {
        success: false,
        error: 'A parsing job is already in progress. Please wait for it to complete.',
      };
    }

    // Create a new parsing job
    const { data: job, error: jobError } = await supabase
      .from('resume_parsing_jobs')
      .insert({
        user_id: user.id,
        resume_url: profile.resume_url,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create parsing job:', jobError);
      return { success: false, error: 'Failed to create parsing job' };
    }

    // Trigger background processing
    // In a production app, this would use a queue like Inngest or Trigger.dev
    // For now, we'll process immediately in the background
    processResumeParsingJob(job.id).catch((error) => {
      console.error('Background parsing failed:', error);
    });

    return {
      success: true,
      data: { jobId: job.id },
    };
  } catch (error) {
    console.error('Unexpected error in triggerResumeParsing:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Process a resume parsing job (background task)
 * This function should be called by a background job processor
 */
export async function processResumeParsingJob(
  jobId: string
): Promise<ProcessingResult> {
  try {
    const supabase = await createClient();

    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('resume_parsing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job not found' };
    }

    // Update job status to processing
    await supabase
      .from('resume_parsing_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    try {
      // Download resume file from storage
      const url = new URL(job.resume_url);
      const pathParts = url.pathname.split('/resumes/');
      if (pathParts.length < 2 || !pathParts[1]) {
        throw new Error('Invalid resume URL format');
      }
      const filePath = pathParts[1];

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('resumes')
        .download(filePath);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download resume: ${downloadError?.message}`);
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine MIME type from file extension
      const mimeType = filePath.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // Extract text from document
      const { text } = await extractDocumentText(buffer, mimeType);

      if (!text || text.trim().length === 0) {
        throw new Error('No text extracted from resume');
      }

      // Parse resume using Claude AI
      const parsedData = await parseResumeText({
        text,
        userId: job.user_id,
      });

      // Update user profile with parsed data
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          parsed_resume_data: parsedData,
          resume_parsed_at: new Date().toISOString(),
          resume_parsing_error: null,
          skills: parsedData.skills,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', job.user_id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // Mark job as completed
      await supabase
        .from('resume_parsing_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Revalidate the profile page
      revalidatePath('/dashboard/profile');

      return { success: true };
    } catch (processingError) {
      // Mark job as failed
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown parsing error';

      await supabase
        .from('resume_parsing_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Also update user profile with error
      await supabase
        .from('user_profiles')
        .update({
          resume_parsing_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', job.user_id);

      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Unexpected error in processResumeParsingJob:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get the status of a resume parsing job
 */
export async function getParsingJobStatus(
  jobId: string
): Promise<JobStatusResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get job status (RLS ensures user can only see their own jobs)
    const { data: job, error: jobError } = await supabase
      .from('resume_parsing_jobs')
      .select('status, error_message')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job not found' };
    }

    return {
      success: true,
      data: {
        status: job.status,
        error: job.error_message || undefined,
      },
    };
  } catch (error) {
    console.error('Unexpected error in getParsingJobStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
