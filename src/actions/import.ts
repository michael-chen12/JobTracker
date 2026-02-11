'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  importSourceSchema,
  greenhouseImportSchema,
  IMPORT_MAX_ROWS,
  IMPORT_MAX_FILE_SIZE,
} from '@/schemas/application';
import type { ImportCandidate, ImportLog, ImportSource } from '@/types/application';
import { parseCsv, mapGreenhouseStatus } from '@/lib/import/csv-parser';
import type { GenericFieldMapping } from '@/lib/import/csv-parser';
import { deduplicateCandidates } from '@/lib/import/dedup';

// ─── Return types ─────────────────────────────────────────────────────────────

type PreviewCsvResult =
  | {
      success: true;
      data: {
        format: ImportSource;
        headers: string[];
        candidates: ImportCandidate[];
        failedRowCount: number;
      };
    }
  | { success: false; error: string };

type ExecuteImportResult =
  | { success: true; data: ImportLog }
  | { success: false; error: string };

type GreenhousePreviewResult =
  | {
      success: true;
      data: {
        candidates: ImportCandidate[];
        totalFetched: number;
      };
    }
  | { success: false; error: string };

type ListImportLogsResult =
  | { success: true; data: ImportLog[] }
  | { success: false; error: string };

// ─── Auth helper (shared pattern from gdpr.ts) ───────────────────────────────

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

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Parse and preview a CSV file.
 *
 * Accepts a FormData with a `file` field (CSV) and an optional `mapping` field
 * (JSON-encoded GenericFieldMapping for generic CSV format).
 *
 * Returns the detected format, all headers, and parsed candidates (capped at
 * IMPORT_MAX_ROWS). The candidates are returned to the client so they can be
 * passed back to executeImport without server-side session storage.
 */
export async function previewCsvImport(formData: FormData): Promise<PreviewCsvResult> {
  try {
    const supabase = await createClient();
    const { authUser } = await getAuthenticatedUser(supabase);

    if (!authUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No CSV file provided' };
    }

    // Validate file type
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'csv' && file.type !== 'text/csv') {
      return { success: false, error: 'Only CSV files are accepted (.csv)' };
    }

    // Validate file size
    if (file.size > IMPORT_MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File is too large. Maximum allowed size is ${IMPORT_MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      };
    }

    const content = await file.text();

    if (!content.trim()) {
      return { success: false, error: 'The CSV file is empty' };
    }

    // Parse optional generic mapping
    const mappingRaw = formData.get('mapping');
    let genericMapping: GenericFieldMapping | undefined;
    if (mappingRaw && typeof mappingRaw === 'string') {
      try {
        genericMapping = JSON.parse(mappingRaw) as GenericFieldMapping;
      } catch {
        return { success: false, error: 'Invalid field mapping format' };
      }
    }

    const parsed = parseCsv(content, genericMapping);

    if (parsed.candidates.length === 0 && parsed.format !== 'generic_csv') {
      return {
        success: false,
        error: 'No valid rows found in the file. Check that the file has the correct format.',
      };
    }

    return {
      success: true,
      data: {
        format: parsed.format,
        headers: parsed.headers,
        candidates: parsed.candidates,
        failedRowCount: parsed.failedRowCount,
      },
    };
  } catch (err) {
    console.error('[previewCsvImport]', err);
    return { success: false, error: 'Failed to parse CSV file' };
  }
}

/**
 * Fetch applications from Greenhouse Harvest API using the user's API key.
 *
 * The API key is used in-memory only and never stored or logged.
 */
export async function fetchGreenhousePreview(
  rawApiKey: string,
  rawCompanyName: string,
): Promise<GreenhousePreviewResult> {
  try {
    const supabase = await createClient();
    const { authUser } = await getAuthenticatedUser(supabase);

    if (!authUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const parsed = greenhouseImportSchema.safeParse({
      api_key: rawApiKey,
      company_name: rawCompanyName,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const { api_key, company_name } = parsed.data;

    // Basic auth: API key as username, empty password
    const credentials = Buffer.from(`${api_key}:`).toString('base64');
    const candidates: ImportCandidate[] = [];

    // Paginate through Greenhouse API (max 5 pages = up to 500 apps)
    const perPage = 100;
    const maxPages = Math.ceil(IMPORT_MAX_ROWS / perPage);

    for (let page = 1; page <= maxPages; page++) {
      const url = `https://harvest.greenhouse.io/v1/applications?per_page=${perPage}&page=${page}`;

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        return { success: false, error: 'Failed to connect to Greenhouse API. Check your network.' };
      }

      if (response.status === 401) {
        return { success: false, error: 'Invalid Greenhouse API key. Please check your credentials.' };
      }
      if (response.status === 403) {
        return { success: false, error: 'Insufficient permissions. Ensure your API key has "Applications: Read" access.' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Greenhouse API rate limit exceeded. Please wait a moment and try again.' };
      }
      if (!response.ok) {
        return { success: false, error: `Greenhouse API returned an error (${response.status}). Try again later.` };
      }

      type GreenhouseApp = {
        id: number;
        applied_at: string;
        status: string;
        jobs: { id: number; name: string }[];
        current_stage: { name: string } | null;
      };

      let apps: GreenhouseApp[];
      try {
        apps = (await response.json()) as GreenhouseApp[];
      } catch {
        return { success: false, error: 'Failed to parse Greenhouse API response' };
      }

      if (!Array.isArray(apps) || apps.length === 0) break;

      for (const app of apps) {
        const position = app.jobs?.[0]?.name ?? 'Unknown Position';
        const appliedDate: string | null = app.applied_at
          ? app.applied_at.substring(0, 10) // 'YYYY-MM-DD', avoids split()[0] returning string|undefined
          : null;

        candidates.push({
          company: company_name,
          position,
          applied_date: appliedDate,
          job_url: null,
          source: 'Greenhouse',
          status: mapGreenhouseStatus(app.status),
        });
      }

      // No more pages if we got fewer results than the page size
      if (apps.length < perPage) break;
      if (candidates.length >= IMPORT_MAX_ROWS) break;
    }

    return {
      success: true,
      data: {
        candidates: candidates.slice(0, IMPORT_MAX_ROWS),
        totalFetched: candidates.length,
      },
    };
  } catch (err) {
    console.error('[fetchGreenhousePreview]', err);
    return { success: false, error: 'Failed to fetch applications from Greenhouse' };
  }
}

/**
 * Execute a bulk import of pre-parsed candidates.
 *
 * Flow:
 *   1. Validate inputs
 *   2. Create import_logs row (status=processing)
 *   3. Deduplicate candidates against existing applications
 *   4. Batch insert 50 at a time
 *   5. Update import_logs row (status=completed)
 *   6. Revalidate application cache
 */
export async function executeImport(
  candidates: ImportCandidate[],
  source: ImportSource,
  options?: { companyName?: string },
): Promise<ExecuteImportResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate source
    const sourceValidation = importSourceSchema.safeParse(source);
    if (!sourceValidation.success) {
      return { success: false, error: 'Invalid import source' };
    }

    // Validate candidates
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return { success: false, error: 'No candidates to import' };
    }

    if (candidates.length > IMPORT_MAX_ROWS) {
      return {
        success: false,
        error: `Too many rows. Maximum is ${IMPORT_MAX_ROWS} per import.`,
      };
    }

    // Validate each candidate has required fields
    const validCandidates = candidates.filter(
      (c) => c.company?.trim() && c.position?.trim(),
    );

    const invalidCount = candidates.length - validCandidates.length;

    // Create import log (status=processing)
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .insert({
        user_id: dbUser.id,
        source,
        total_rows: candidates.length,
        status: 'processing',
        greenhouse_company: options?.companyName ?? null,
      })
      .select()
      .single();

    if (logError || !importLog) {
      return { success: false, error: 'Failed to initialize import session' };
    }

    // Deduplicate
    let deduped: { toInsert: ImportCandidate[]; skippedCount: number };
    try {
      deduped = await deduplicateCandidates(supabase, dbUser.id, validCandidates);
    } catch (dedupErr) {
      // Update log to failed
      await supabase
        .from('import_logs')
        .update({ status: 'failed', error_message: 'Deduplication failed', completed_at: new Date().toISOString() })
        .eq('id', importLog.id);

      return { success: false, error: 'Failed to check for duplicates. Please try again.' };
    }

    // Batch insert 50 at a time
    const BATCH_SIZE = 50;
    let importedCount = 0;
    let failedCount = invalidCount;

    for (let i = 0; i < deduped.toInsert.length; i += BATCH_SIZE) {
      const batch = deduped.toInsert.slice(i, i + BATCH_SIZE);

      const insertRows = batch.map((c) => ({
        user_id: dbUser.id,
        company: c.company,
        position: c.position,
        applied_date: c.applied_date ?? undefined,
        job_url: c.job_url ?? undefined,
        source: c.source,
        status: c.status,
      }));

      const { error: insertError } = await supabase.from('applications').insert(insertRows);

      if (insertError) {
        failedCount += batch.length;
      } else {
        importedCount += batch.length;
      }
    }

    // Update import log to completed
    const { data: completedLog, error: updateError } = await supabase
      .from('import_logs')
      .update({
        status: 'completed',
        imported_count: importedCount,
        skipped_count: deduped.skippedCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importLog.id)
      .select()
      .single();

    if (updateError || !completedLog) {
      return { success: false, error: 'Import completed but failed to save results' };
    }

    // Revalidate application cache
    revalidatePath('/dashboard');
    revalidateTag('applications', 'max');

    return { success: true, data: completedLog as ImportLog };
  } catch (err) {
    console.error('[executeImport]', err);
    return { success: false, error: 'An unexpected error occurred during import' };
  }
}

/**
 * List the last 10 import logs for the authenticated user.
 */
export async function listImportLogs(): Promise<ListImportLogsResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('import_logs')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: 'Failed to load import history' };
    }

    return { success: true, data: (data ?? []) as ImportLog[] };
  } catch (err) {
    console.error('[listImportLogs]', err);
    return { success: false, error: 'Failed to load import history' };
  }
}
