'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  requestDataExportSchema,
  requestAccountDeletionSchema,
  DELETION_GRACE_PERIOD_DAYS,
} from '@/schemas/application';
import type { AccountDeletionRequest } from '@/types/application';

// --- Return types (discriminated unions) ---

type RequestExportResult =
  | { success: true; data: { signedUrl: string; exportType: string } }
  | { success: false; error: string };

type GetDeletionStatusResult =
  | { success: true; data: AccountDeletionRequest | null }
  | { success: false; error: string };

type RequestDeletionResult =
  | { success: true; data: AccountDeletionRequest }
  | { success: false; error: string };

type CancelDeletionResult = { success: true } | { success: false; error: string };

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
    .select('id, email')
    .eq('auth_id', authUser.id)
    .single();

  if (userError || !dbUser) {
    return { authUser, dbUser: null };
  }

  return { authUser, dbUser };
}

// --- CSV helpers ---

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// --- Actions ---

export async function requestDataExport(input: unknown): Promise<RequestExportResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const parsed = requestDataExportSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const { export_type } = parsed.data;
    const adminClient = createAdminClient();
    const userId = dbUser.id;

    // Insert export request record
    const { data: exportRequest, error: insertError } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        export_type,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError || !exportRequest) {
      console.error('Failed to create export request:', insertError);
      return { success: false, error: 'Failed to initiate export' };
    }

    try {
      let fileContent: string;
      let mimeType: string;
      let fileExtension: string;

      if (export_type === 'json') {
        fileContent = await buildJsonExport(adminClient, userId);
        mimeType = 'application/json';
        fileExtension = 'json';
      } else {
        fileContent = await buildCsvExport(adminClient, userId);
        mimeType = 'text/csv';
        fileExtension = 'csv';
      }

      // Upload to data-exports bucket
      const timestamp = Date.now();
      const storagePath = `${authUser.id}/${timestamp}_export.${fileExtension}`;

      const fileBlob = new Blob([fileContent], { type: mimeType });

      const { error: uploadError } = await adminClient.storage
        .from('data-exports')
        .upload(storagePath, fileBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: mimeType,
        });

      if (uploadError) {
        console.error('Export upload error:', uploadError);
        await supabase
          .from('data_export_requests')
          .update({ status: 'failed', error_message: 'Failed to upload export file' })
          .eq('id', exportRequest.id);
        return { success: false, error: 'Failed to upload export file' };
      }

      // Generate signed URL (1-hour expiry)
      const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
        .from('data-exports')
        .createSignedUrl(storagePath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Signed URL error:', signedUrlError);
        await supabase
          .from('data_export_requests')
          .update({ status: 'failed', error_message: 'Failed to generate download URL' })
          .eq('id', exportRequest.id);
        return { success: false, error: 'Failed to generate download URL' };
      }

      // Mark as completed
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          file_path: storagePath,
          completed_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('id', exportRequest.id);

      revalidatePath('/dashboard/profile');

      return {
        success: true,
        data: { signedUrl: signedUrlData.signedUrl, exportType: export_type },
      };
    } catch (exportError) {
      console.error('Export generation error:', exportError);
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: exportError instanceof Error ? exportError.message : 'Export failed',
        })
        .eq('id', exportRequest.id);
      return { success: false, error: 'Failed to generate export' };
    }
  } catch (error) {
    console.error('Unexpected error in requestDataExport:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getDeletionStatus(): Promise<GetDeletionStatusResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch deletion status:', error);
      return { success: false, error: 'Failed to fetch deletion status' };
    }

    return {
      success: true,
      data: data as AccountDeletionRequest | null,
    };
  } catch (error) {
    console.error('Unexpected error in getDeletionStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function requestAccountDeletion(input: unknown): Promise<RequestDeletionResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const parsed = requestAccountDeletionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Verify email matches (case-insensitive)
    if (parsed.data.confirmation_email.toLowerCase() !== dbUser.email.toLowerCase()) {
      return { success: false, error: 'Email does not match your account email' };
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'A deletion request is already pending' };
    }

    // Calculate scheduled deletion date
    const scheduledDeletionAt = new Date(
      Date.now() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: request, error: insertError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: dbUser.id,
        status: 'pending',
        reason: parsed.data.reason ?? null,
        scheduled_deletion_at: scheduledDeletionAt,
      })
      .select('*')
      .single();

    if (insertError || !request) {
      console.error('Failed to create deletion request:', insertError);
      return { success: false, error: 'Failed to schedule account deletion' };
    }

    revalidatePath('/dashboard/profile');

    return {
      success: true,
      data: request as AccountDeletionRequest,
    };
  } catch (error) {
    console.error('Unexpected error in requestAccountDeletion:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function cancelAccountDeletion(): Promise<CancelDeletionResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: existing, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: 'No pending deletion request found' };
    }

    const { error: updateError } = await supabase
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Failed to cancel deletion:', updateError);
      return { success: false, error: 'Failed to cancel deletion request' };
    }

    revalidatePath('/dashboard/profile');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in cancelAccountDeletion:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// --- Export builders (private) ---

async function buildJsonExport(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  // Fetch all user data in parallel
  const [
    userResult,
    profileResult,
    experienceResult,
    educationResult,
    applicationsResult,
    contactsResult,
    tagsResult,
    savedFiltersResult,
    notificationsResult,
    insightsResult,
    achievementsResult,
    aiUsageResult,
  ] = await Promise.all([
    adminClient.from('users').select('email, display_name, created_at').eq('id', userId).single(),
    adminClient.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    adminClient.from('user_experience').select('*').eq('user_id', userId),
    adminClient.from('user_education').select('*').eq('user_id', userId),
    adminClient.from('applications').select('*').eq('user_id', userId),
    adminClient.from('contacts').select('*').eq('user_id', userId),
    adminClient.from('tags').select('*').eq('user_id', userId),
    adminClient.from('saved_filters').select('*').eq('user_id', userId),
    adminClient.from('notifications').select('*').eq('user_id', userId),
    adminClient.from('insights').select('*').eq('user_id', userId),
    adminClient.from('achievements').select('*').eq('user_id', userId),
    adminClient.from('ai_usage').select('*').eq('user_id', userId),
  ]);

  const applications = applicationsResult.data ?? [];
  const contacts = contactsResult.data ?? [];

  // Fetch child records for applications
  const applicationIds = applications.map((a) => a.id);
  const contactIds = contacts.map((c) => c.id);

  const [notesResult, documentsResult, milestonesResult, correspondenceResult, appTagsResult] =
    applicationIds.length > 0
      ? await Promise.all([
          adminClient
            .from('application_notes')
            .select('*')
            .in('application_id', applicationIds),
          adminClient
            .from('application_documents')
            .select('*')
            .in('application_id', applicationIds),
          adminClient.from('milestones').select('*').in('application_id', applicationIds),
          adminClient
            .from('application_correspondence')
            .select('*')
            .in('application_id', applicationIds),
          adminClient
            .from('application_tags')
            .select('application_id, tag_id')
            .in('application_id', applicationIds),
        ])
      : [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
        ];

  // Fetch contact interactions
  const interactionsResult =
    contactIds.length > 0
      ? await adminClient
          .from('contact_interactions')
          .select('*')
          .in('contact_id', contactIds)
      : { data: [] };

  // Build tag lookup
  const tagLookup = new Map((tagsResult.data ?? []).map((t) => [t.id, t]));

  // Build nested export structure
  const exportData = {
    exported_at: new Date().toISOString(),
    user: userResult.data ?? null,
    profile: profileResult.data ?? null,
    experience: experienceResult.data ?? [],
    education: educationResult.data ?? [],
    applications: applications.map((app) => ({
      ...app,
      notes: (notesResult.data ?? []).filter((n) => n.application_id === app.id),
      documents: (documentsResult.data ?? []).filter((d) => d.application_id === app.id),
      milestones: (milestonesResult.data ?? []).filter((m) => m.application_id === app.id),
      correspondence: (correspondenceResult.data ?? []).filter(
        (c) => c.application_id === app.id
      ),
      tags: (appTagsResult.data ?? [])
        .filter((at) => at.application_id === app.id)
        .map((at) => tagLookup.get(at.tag_id))
        .filter(Boolean),
    })),
    contacts: contacts.map((contact) => ({
      ...contact,
      interactions: (interactionsResult.data ?? []).filter(
        (i) => i.contact_id === contact.id
      ),
    })),
    tags: tagsResult.data ?? [],
    saved_filters: savedFiltersResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    insights: insightsResult.data ?? [],
    achievements: achievementsResult.data ?? [],
    ai_usage: aiUsageResult.data ?? [],
  };

  return JSON.stringify(exportData, null, 2);
}

async function buildCsvExport(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  const { data: applications } = await adminClient
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const headers = [
    'id',
    'company',
    'position',
    'status',
    'job_type',
    'location',
    'priority',
    'source',
    'applied_date',
    'deadline',
    'match_score',
    'salary_min',
    'salary_max',
    'salary_currency',
    'referral_name',
    'job_url',
    'created_at',
    'updated_at',
  ];

  const rows = (applications ?? []).map((app) => {
    const salary = app.salary_range as { min?: number; max?: number; currency?: string } | null;
    return [
      app.id,
      app.company,
      app.position,
      app.status,
      app.job_type ?? '',
      app.location ?? '',
      app.priority ?? '',
      app.source ?? '',
      app.applied_date ?? '',
      app.deadline ?? '',
      app.match_score != null ? String(app.match_score) : '',
      salary?.min != null ? String(salary.min) : '',
      salary?.max != null ? String(salary.max) : '',
      salary?.currency ?? '',
      app.referral_name ?? '',
      app.job_url ?? '',
      app.created_at,
      app.updated_at,
    ];
  });

  return buildCSV(headers, rows);
}
