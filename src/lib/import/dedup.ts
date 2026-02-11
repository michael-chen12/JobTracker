/**
 * Deduplication utility for ATS imports (Ticket #33)
 *
 * Compares incoming import candidates against the user's existing applications
 * to determine which rows are new vs. already tracked.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { DeduplicatedBatch, ImportCandidate } from '@/types/application';

type AppSupabaseClient = SupabaseClient<Database>;

// ─── Dedup key helpers ────────────────────────────────────────────────────────

/**
 * Build a dedup key for a given (company, position, applied_date) tuple.
 *
 * When applied_date is null we use 'no-date' as the date segment so that:
 *   - "Acme | Engineer | 2024-01-01" ≠ "Acme | Engineer | no-date"
 *   - Two rows with no date at the same company/position ARE considered duplicates
 */
export function buildDedupKey(
  company: string,
  position: string,
  applied_date: string | null,
): string {
  return `${company.toLowerCase().trim()}|${position.toLowerCase().trim()}|${applied_date ?? 'no-date'}`;
}

// ─── Core dedup function ──────────────────────────────────────────────────────

/**
 * Deduplicate incoming import candidates against the user's existing applications.
 *
 * Strategy (implemented with an in-memory Set):
 *   1. Fetch all (company, position, applied_date) tuples for the user in one query.
 *   2. Build a Set<string> of existing dedup keys.
 *   3. Iterate candidates: if key is in Set → skip; otherwise → include and add key to Set.
 *      Step 3's Set update prevents intra-batch duplicates (e.g. same job listed twice in CSV).
 *
 * Performance note: fetching all app tuples for a single user is bounded by their total app
 * count. At expected scale (<5000 apps) this is more efficient than per-row DB queries.
 *
 * @param supabase  Authenticated Supabase client (server-side)
 * @param userId    The database user ID (not auth UID)
 * @param candidates  Parsed, validated import candidates
 * @returns { toInsert, skippedCount }
 */
export async function deduplicateCandidates(
  supabase: AppSupabaseClient,
  userId: string,
  candidates: ImportCandidate[],
): Promise<DeduplicatedBatch> {
  // Fetch existing (company, position, applied_date) for this user
  const { data: existing, error } = await supabase
    .from('applications')
    .select('company, position, applied_date')
    .eq('user_id', userId);

  if (error) {
    // If we can't fetch existing apps, fail safe: import nothing to avoid duplicates
    throw new Error(`Failed to fetch existing applications for dedup: ${error.message}`);
  }

  // Build Set of existing dedup keys
  const existingKeys = new Set<string>(
    (existing ?? []).map((app) =>
      buildDedupKey(app.company, app.position, app.applied_date),
    ),
  );

  const toInsert: ImportCandidate[] = [];
  let skippedCount = 0;

  for (const candidate of candidates) {
    const key = buildDedupKey(candidate.company, candidate.position, candidate.applied_date);

    if (existingKeys.has(key)) {
      skippedCount++;
    } else {
      toInsert.push(candidate);
      // Add to Set immediately to catch intra-batch duplicates
      existingKeys.add(key);
    }
  }

  return { toInsert, skippedCount };
}
