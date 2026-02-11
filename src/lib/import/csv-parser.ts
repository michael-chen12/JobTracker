/**
 * CSV parser utility for ATS imports (Ticket #33)
 *
 * Handles LinkedIn, Indeed, and generic CSV formats.
 * Pure functions — no server-side dependencies.
 */
import Papa from 'papaparse';
import type { ImportCandidate, ImportSource } from '@/types/application';
import { IMPORT_MAX_ROWS } from '@/schemas/application';

// ─── LinkedIn header detection ───────────────────────────────────────────────
const LINKEDIN_REQUIRED_HEADERS = ['application date', 'company name', 'job title'];

// ─── Indeed header detection ─────────────────────────────────────────────────
const INDEED_REQUIRED_HEADERS = ['employer name', 'job title', 'date applied'];

// ─── Date normalisation ──────────────────────────────────────────────────────

/**
 * Convert any reasonable date string to ISO `YYYY-MM-DD`.
 * Returns null if the date cannot be parsed.
 */
export function normaliseDate(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  try {
    const d = new Date(raw.trim());
    if (isNaN(d.getTime())) return null;
    // Use local date components to avoid UTC timezone shift (e.g. "01/15/2024" → 2024-01-14 in UTC-8)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

// ─── Format detection ────────────────────────────────────────────────────────

/**
 * Detect CSV format based on column headers.
 * Returns 'linkedin', 'indeed', or 'generic_csv'.
 */
export function detectCsvFormat(headers: string[]): ImportSource {
  const lower = headers.map((h) => h.toLowerCase().trim());

  if (LINKEDIN_REQUIRED_HEADERS.every((h) => lower.includes(h))) {
    return 'linkedin';
  }
  if (INDEED_REQUIRED_HEADERS.every((h) => lower.includes(h))) {
    return 'indeed';
  }
  return 'generic_csv';
}

// ─── LinkedIn mapping ────────────────────────────────────────────────────────

function mapLinkedInRow(row: Record<string, string>): ImportCandidate | null {
  // Header names from LinkedIn's GDPR data export
  const company = row['Company Name']?.trim();
  const position = row['Job Title']?.trim();

  if (!company || !position) return null;

  return {
    company,
    position,
    applied_date: normaliseDate(row['Application Date']),
    job_url: row['URL']?.trim() || null,
    source: 'LinkedIn',
    status: 'applied',
  };
}

// ─── Indeed mapping ──────────────────────────────────────────────────────────

function mapIndeedRow(row: Record<string, string>): ImportCandidate | null {
  const company = row['Employer Name']?.trim();
  const position = row['Job Title']?.trim();

  if (!company || !position) return null;

  return {
    company,
    position,
    applied_date: normaliseDate(row['Date Applied']),
    job_url: null, // Indeed exports don't include a direct job URL
    source: 'Indeed',
    status: 'applied',
  };
}

// ─── Generic mapping ─────────────────────────────────────────────────────────

export interface GenericFieldMapping {
  /** Column name that maps to `company` */
  company: string;
  /** Column name that maps to `position` */
  position: string;
  /** Column name that maps to `applied_date` (optional) */
  applied_date?: string;
  /** Column name that maps to `job_url` (optional) */
  job_url?: string;
}

function mapGenericRow(
  row: Record<string, string>,
  mapping: GenericFieldMapping,
): ImportCandidate | null {
  const company = row[mapping.company]?.trim();
  const position = row[mapping.position]?.trim();

  if (!company || !position) return null;

  return {
    company,
    position,
    applied_date: mapping.applied_date ? normaliseDate(row[mapping.applied_date]) : null,
    job_url: mapping.job_url ? row[mapping.job_url]?.trim() || null : null,
    source: 'CSV Import',
    status: 'applied',
  };
}

// ─── Main parse function ─────────────────────────────────────────────────────

export interface ParseCsvResult {
  format: ImportSource;
  headers: string[];
  candidates: ImportCandidate[];
  failedRowCount: number;
}

/**
 * Parse CSV content and map rows to ImportCandidate objects.
 *
 * For LinkedIn and Indeed formats the mapping is automatic.
 * For generic CSV, pass a `genericMapping` to define which columns to use.
 *
 * Rows that are missing required fields (company, position) are counted as
 * failed but do not cause the whole parse to fail.
 *
 * Results are capped at IMPORT_MAX_ROWS (500).
 */
export function parseCsv(
  content: string,
  genericMapping?: GenericFieldMapping,
): ParseCsvResult {
  // Strip BOM if present (Excel exports)
  const cleaned = content.startsWith('\uFEFF') ? content.slice(1) : content;

  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    // Don't trim values here — individual mappers handle trimming
  });

  const headers = result.meta.fields ?? [];
  const format = detectCsvFormat(headers);

  const candidates: ImportCandidate[] = [];
  let failedRowCount = 0;

  const rows = result.data.slice(0, IMPORT_MAX_ROWS);

  for (const row of rows) {
    let candidate: ImportCandidate | null = null;

    if (format === 'linkedin') {
      candidate = mapLinkedInRow(row);
    } else if (format === 'indeed') {
      candidate = mapIndeedRow(row);
    } else if (genericMapping) {
      candidate = mapGenericRow(row, genericMapping);
    } else {
      // Generic format without mapping — return raw data, wizard handles mapping
      break;
    }

    if (candidate) {
      candidates.push(candidate);
    } else {
      failedRowCount++;
    }
  }

  return { format, headers, candidates, failedRowCount };
}

// ─── Greenhouse status mapping ────────────────────────────────────────────────

import type { ApplicationStatus } from '@/types/application';

/**
 * Map a Greenhouse application status string to our ApplicationStatus enum.
 *
 * Greenhouse statuses: 'active', 'rejected', 'hired', 'converted'
 * Our statuses: 'bookmarked' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'accepted' | 'withdrawn'
 */
export function mapGreenhouseStatus(status: string): ApplicationStatus {
  switch (status?.toLowerCase()) {
    case 'rejected':
      return 'rejected';
    case 'hired':
      return 'accepted';
    case 'active':
    default:
      return 'applied';
  }
}
