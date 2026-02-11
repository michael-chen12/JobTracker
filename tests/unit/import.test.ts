import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normaliseDate,
  detectCsvFormat,
  parseCsv,
  mapGreenhouseStatus,
} from '@/lib/import/csv-parser';
import { buildDedupKey, deduplicateCandidates } from '@/lib/import/dedup';
import type { ImportCandidate } from '@/types/application';
import { IMPORT_MAX_ROWS, greenhouseImportSchema } from '@/schemas/application';

// ─── normaliseDate ────────────────────────────────────────────────────────────

describe('normaliseDate', () => {
  it('returns ISO date for standard date string', () => {
    expect(normaliseDate('2024-01-15')).toBe('2024-01-15');
  });

  it('normalises US format dates', () => {
    expect(normaliseDate('01/15/2024')).toBe('2024-01-15');
  });

  it('returns null for empty string', () => {
    expect(normaliseDate('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(normaliseDate(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(normaliseDate(undefined)).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(normaliseDate('not-a-date')).toBeNull();
  });

  it('handles ISO datetime strings', () => {
    expect(normaliseDate('2024-01-15T10:00:00Z')).toBe('2024-01-15');
  });
});

// ─── detectCsvFormat ──────────────────────────────────────────────────────────

describe('detectCsvFormat', () => {
  it('detects LinkedIn format', () => {
    expect(
      detectCsvFormat(['Application Date', 'Company Name', 'Job Title', 'URL']),
    ).toBe('linkedin');
  });

  it('detects LinkedIn format case-insensitively', () => {
    expect(
      detectCsvFormat(['APPLICATION DATE', 'COMPANY NAME', 'JOB TITLE']),
    ).toBe('linkedin');
  });

  it('detects Indeed format', () => {
    expect(
      detectCsvFormat(['Employer Name', 'Job Title', 'Date Applied']),
    ).toBe('indeed');
  });

  it('detects Indeed format case-insensitively', () => {
    expect(
      detectCsvFormat(['employer name', 'job title', 'date applied']),
    ).toBe('indeed');
  });

  it('returns generic_csv for unknown headers', () => {
    expect(detectCsvFormat(['company', 'role', 'applied'])).toBe('generic_csv');
  });

  it('returns generic_csv for empty headers', () => {
    expect(detectCsvFormat([])).toBe('generic_csv');
  });

  it('returns generic_csv if only some LinkedIn headers match', () => {
    expect(detectCsvFormat(['Company Name', 'Job Title'])).toBe('generic_csv');
  });
});

// ─── parseCsv ─────────────────────────────────────────────────────────────────

describe('parseCsv - LinkedIn format', () => {
  const linkedinCsv = `Application Date,Company Name,Job Title,URL
01/15/2024,Acme Corp,Software Engineer,https://example.com/job/1
2024-02-20,Beta Inc,Product Manager,`;

  it('auto-detects LinkedIn format', () => {
    const result = parseCsv(linkedinCsv);
    expect(result.format).toBe('linkedin');
  });

  it('maps LinkedIn columns correctly', () => {
    const result = parseCsv(linkedinCsv);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({
      company: 'Acme Corp',
      position: 'Software Engineer',
      source: 'LinkedIn',
      status: 'applied',
    });
  });

  it('normalises applied_date', () => {
    const result = parseCsv(linkedinCsv);
    expect(result.candidates[0].applied_date).toBe('2024-01-15');
    expect(result.candidates[1].applied_date).toBe('2024-02-20');
  });

  it('sets null for empty URL', () => {
    const result = parseCsv(linkedinCsv);
    expect(result.candidates[1].job_url).toBeNull();
  });

  it('captures job URL when present', () => {
    const result = parseCsv(linkedinCsv);
    expect(result.candidates[0].job_url).toBe('https://example.com/job/1');
  });

  it('strips BOM character', () => {
    const withBOM = '\uFEFF' + linkedinCsv;
    const result = parseCsv(withBOM);
    expect(result.format).toBe('linkedin');
    expect(result.candidates).toHaveLength(2);
  });

  it('skips rows missing company', () => {
    const csv = `Application Date,Company Name,Job Title,URL
01/15/2024,,Software Engineer,https://example.com`;
    const result = parseCsv(csv);
    expect(result.candidates).toHaveLength(0);
    expect(result.failedRowCount).toBe(1);
  });

  it('skips rows missing position', () => {
    const csv = `Application Date,Company Name,Job Title,URL
01/15/2024,Acme Corp,,`;
    const result = parseCsv(csv);
    expect(result.candidates).toHaveLength(0);
    expect(result.failedRowCount).toBe(1);
  });
});

describe('parseCsv - Indeed format', () => {
  const indeedCsv = `Employer Name,Job Title,Date Applied
Amazon,Backend Engineer,2024-03-10
Google,SRE,2024-03-15`;

  it('auto-detects Indeed format', () => {
    const result = parseCsv(indeedCsv);
    expect(result.format).toBe('indeed');
  });

  it('maps Indeed columns correctly', () => {
    const result = parseCsv(indeedCsv);
    expect(result.candidates[0]).toMatchObject({
      company: 'Amazon',
      position: 'Backend Engineer',
      applied_date: '2024-03-10',
      job_url: null,
      source: 'Indeed',
      status: 'applied',
    });
  });
});

describe('parseCsv - generic CSV', () => {
  const genericCsv = `org,role,when
Startup Inc,Frontend Dev,2024-04-01`;

  it('detects generic_csv for unknown headers', () => {
    const result = parseCsv(genericCsv);
    expect(result.format).toBe('generic_csv');
  });

  it('returns headers for field mapper without a mapping', () => {
    const result = parseCsv(genericCsv);
    expect(result.headers).toContain('org');
    expect(result.headers).toContain('role');
    expect(result.candidates).toHaveLength(0); // no mapping = no candidates
  });

  it('maps candidates when genericMapping is provided', () => {
    const result = parseCsv(genericCsv, {
      company: 'org',
      position: 'role',
      applied_date: 'when',
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      company: 'Startup Inc',
      position: 'Frontend Dev',
      applied_date: '2024-04-01',
      source: 'CSV Import',
    });
  });
});

describe('parseCsv - edge cases', () => {
  it('handles quoted fields with commas', () => {
    const csv = `Application Date,Company Name,Job Title,URL
01/15/2024,"Acme, Corp",Software Engineer,`;
    const result = parseCsv(csv);
    expect(result.candidates[0].company).toBe('Acme, Corp');
  });

  it('caps results at IMPORT_MAX_ROWS', () => {
    const rows = Array.from({ length: 600 }, (_, i) =>
      `01/01/2024,Company ${i},Position ${i},`
    ).join('\n');
    const csv = `Application Date,Company Name,Job Title,URL\n${rows}`;
    const result = parseCsv(csv);
    expect(result.candidates.length).toBeLessThanOrEqual(IMPORT_MAX_ROWS);
  });

  it('returns 0 candidates for header-only CSV', () => {
    const csv = `Application Date,Company Name,Job Title,URL`;
    const result = parseCsv(csv);
    expect(result.candidates).toHaveLength(0);
    expect(result.failedRowCount).toBe(0);
  });
});

// ─── mapGreenhouseStatus ──────────────────────────────────────────────────────

describe('mapGreenhouseStatus', () => {
  it('maps active → applied', () => {
    expect(mapGreenhouseStatus('active')).toBe('applied');
  });

  it('maps rejected → rejected', () => {
    expect(mapGreenhouseStatus('rejected')).toBe('rejected');
  });

  it('maps hired → accepted', () => {
    expect(mapGreenhouseStatus('hired')).toBe('accepted');
  });

  it('maps unknown → applied (default)', () => {
    expect(mapGreenhouseStatus('unknown_status')).toBe('applied');
  });

  it('is case-insensitive', () => {
    expect(mapGreenhouseStatus('HIRED')).toBe('accepted');
    expect(mapGreenhouseStatus('Rejected')).toBe('rejected');
  });

  it('handles empty string → applied', () => {
    expect(mapGreenhouseStatus('')).toBe('applied');
  });
});

// ─── buildDedupKey ────────────────────────────────────────────────────────────

describe('buildDedupKey', () => {
  it('builds a lowercase pipe-separated key', () => {
    const key = buildDedupKey('Acme Corp', 'Engineer', '2024-01-15');
    expect(key).toBe('acme corp|engineer|2024-01-15');
  });

  it('uses no-date when applied_date is null', () => {
    const key = buildDedupKey('Acme', 'Dev', null);
    expect(key).toBe('acme|dev|no-date');
  });

  it('trims whitespace before lowercasing', () => {
    const key = buildDedupKey('  Acme  ', '  Dev  ', '2024-01-15');
    expect(key).toBe('acme|dev|2024-01-15');
  });

  it('is case-insensitive', () => {
    const k1 = buildDedupKey('ACME', 'ENGINEER', '2024-01-15');
    const k2 = buildDedupKey('acme', 'engineer', '2024-01-15');
    expect(k1).toBe(k2);
  });
});

// ─── deduplicateCandidates ────────────────────────────────────────────────────

describe('deduplicateCandidates', () => {
  function makeCandidate(
    company: string,
    position: string,
    applied_date: string | null = '2024-01-15',
  ): ImportCandidate {
    return { company, position, applied_date, job_url: null, source: 'LinkedIn', status: 'applied' };
  }

  function makeMockSupabase(existing: { company: string; position: string; applied_date: string | null }[]) {
    return {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: existing, error: null }),
        }),
      }),
    } as unknown as Parameters<typeof deduplicateCandidates>[0];
  }

  it('passes through candidates not in DB', async () => {
    const supabase = makeMockSupabase([]);
    const candidates = [makeCandidate('Acme', 'Engineer')];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(1);
    expect(result.skippedCount).toBe(0);
  });

  it('skips exact duplicate (same date)', async () => {
    const existing = [{ company: 'Acme Corp', position: 'Engineer', applied_date: '2024-01-15' }];
    const supabase = makeMockSupabase(existing);
    const candidates = [makeCandidate('Acme Corp', 'Engineer', '2024-01-15')];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(0);
    expect(result.skippedCount).toBe(1);
  });

  it('is case-insensitive when matching', async () => {
    const existing = [{ company: 'acme corp', position: 'engineer', applied_date: '2024-01-15' }];
    const supabase = makeMockSupabase(existing);
    const candidates = [makeCandidate('ACME CORP', 'ENGINEER', '2024-01-15')];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.skippedCount).toBe(1);
  });

  it('does NOT skip when same company+position but different date', async () => {
    const existing = [{ company: 'Acme', position: 'Dev', applied_date: '2024-01-15' }];
    const supabase = makeMockSupabase(existing);
    const candidates = [makeCandidate('Acme', 'Dev', '2024-06-01')];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(1);
  });

  it('deduplicates intra-batch duplicates', async () => {
    const supabase = makeMockSupabase([]);
    const candidates = [
      makeCandidate('Acme', 'Dev', '2024-01-15'),
      makeCandidate('Acme', 'Dev', '2024-01-15'), // exact duplicate
    ];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(1);
    expect(result.skippedCount).toBe(1);
  });

  it('skips no-date candidates that match existing no-date entry', async () => {
    const existing = [{ company: 'Acme', position: 'Dev', applied_date: null }];
    const supabase = makeMockSupabase(existing);
    const candidates = [makeCandidate('Acme', 'Dev', null)];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.skippedCount).toBe(1);
  });

  it('imports no-date candidate if only dated entry exists', async () => {
    const existing = [{ company: 'Acme', position: 'Dev', applied_date: '2024-01-15' }];
    const supabase = makeMockSupabase(existing);
    const candidates = [makeCandidate('Acme', 'Dev', null)]; // no date
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(1);
  });

  it('handles all candidates being duplicates', async () => {
    const existing = [
      { company: 'A', position: 'P1', applied_date: '2024-01-01' },
      { company: 'B', position: 'P2', applied_date: '2024-02-01' },
    ];
    const supabase = makeMockSupabase(existing);
    const candidates = [
      makeCandidate('A', 'P1', '2024-01-01'),
      makeCandidate('B', 'P2', '2024-02-01'),
    ];
    const result = await deduplicateCandidates(supabase, 'user-1', candidates);
    expect(result.toInsert).toHaveLength(0);
    expect(result.skippedCount).toBe(2);
  });

  it('throws if supabase query fails', async () => {
    const failingSupabase = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    } as unknown as Parameters<typeof deduplicateCandidates>[0];

    await expect(
      deduplicateCandidates(failingSupabase, 'user-1', [makeCandidate('A', 'B')]),
    ).rejects.toThrow('Failed to fetch existing applications for dedup');
  });
});

// ─── Schema validation ────────────────────────────────────────────────────────

describe('greenhouseImportSchema', () => {
  it('rejects empty api_key', () => {
    const result = greenhouseImportSchema.safeParse({ api_key: '', company_name: 'Acme' });
    expect(result.success).toBe(false);
  });

  it('rejects empty company_name', () => {
    const result = greenhouseImportSchema.safeParse({ api_key: 'key123', company_name: '' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from api_key and company_name', () => {
    const result = greenhouseImportSchema.safeParse({
      api_key: '  key123  ',
      company_name: '  Acme Corp  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.api_key).toBe('key123');
      expect(result.data.company_name).toBe('Acme Corp');
    }
  });

  it('rejects api_key longer than 200 chars', () => {
    const result = greenhouseImportSchema.safeParse({
      api_key: 'a'.repeat(201),
      company_name: 'Acme',
    });
    expect(result.success).toBe(false);
  });
});

describe('IMPORT_MAX_ROWS', () => {
  it('is 500', () => {
    expect(IMPORT_MAX_ROWS).toBe(500);
  });
});
