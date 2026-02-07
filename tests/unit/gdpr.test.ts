import { describe, expect, it } from 'vitest';
import {
  exportTypeSchema,
  requestDataExportSchema,
  requestAccountDeletionSchema,
  DELETION_GRACE_PERIOD_DAYS,
} from '@/schemas/application';

describe('GDPR Validation Schemas', () => {
  // --- exportTypeSchema ---
  describe('exportTypeSchema', () => {
    it('accepts "json"', () => {
      expect(exportTypeSchema.parse('json')).toBe('json');
    });

    it('accepts "csv"', () => {
      expect(exportTypeSchema.parse('csv')).toBe('csv');
    });

    it('rejects invalid export type', () => {
      expect(() => exportTypeSchema.parse('xml')).toThrow();
    });

    it('rejects empty string', () => {
      expect(() => exportTypeSchema.parse('')).toThrow();
    });

    it('rejects number', () => {
      expect(() => exportTypeSchema.parse(123)).toThrow();
    });

    it('rejects null', () => {
      expect(() => exportTypeSchema.parse(null)).toThrow();
    });

    it('rejects undefined', () => {
      expect(() => exportTypeSchema.parse(undefined)).toThrow();
    });
  });

  // --- requestDataExportSchema ---
  describe('requestDataExportSchema', () => {
    it('accepts valid json export request', () => {
      const result = requestDataExportSchema.parse({ export_type: 'json' });
      expect(result.export_type).toBe('json');
    });

    it('accepts valid csv export request', () => {
      const result = requestDataExportSchema.parse({ export_type: 'csv' });
      expect(result.export_type).toBe('csv');
    });

    it('rejects missing export_type', () => {
      expect(() => requestDataExportSchema.parse({})).toThrow();
    });

    it('rejects invalid export_type', () => {
      expect(() => requestDataExportSchema.parse({ export_type: 'pdf' })).toThrow();
    });

    it('rejects extra fields gracefully (strips them)', () => {
      const result = requestDataExportSchema.parse({
        export_type: 'json',
        extra_field: 'should be stripped',
      });
      expect(result.export_type).toBe('json');
      expect((result as Record<string, unknown>).extra_field).toBeUndefined();
    });
  });

  // --- requestAccountDeletionSchema ---
  describe('requestAccountDeletionSchema', () => {
    it('accepts valid deletion request with email', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
      });
      expect(result.confirmation_email).toBe('user@example.com');
      expect(result.reason).toBeUndefined();
    });

    it('accepts deletion request with reason', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'test@test.com',
        reason: 'No longer job hunting',
      });
      expect(result.reason).toBe('No longer job hunting');
    });

    it('rejects missing confirmation_email', () => {
      expect(() => requestAccountDeletionSchema.parse({})).toThrow();
    });

    it('rejects invalid email format', () => {
      expect(() =>
        requestAccountDeletionSchema.parse({ confirmation_email: 'not-an-email' })
      ).toThrow();
    });

    it('rejects empty email', () => {
      expect(() =>
        requestAccountDeletionSchema.parse({ confirmation_email: '' })
      ).toThrow();
    });

    it('accepts request without reason', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
      });
      expect(result.reason).toBeUndefined();
    });

    it('rejects reason exceeding 500 chars', () => {
      expect(() =>
        requestAccountDeletionSchema.parse({
          confirmation_email: 'user@example.com',
          reason: 'x'.repeat(501),
        })
      ).toThrow();
    });

    it('accepts reason at exactly 500 chars', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
        reason: 'x'.repeat(500),
      });
      expect(result.reason).toHaveLength(500);
    });

    it('trims whitespace from reason', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
        reason: '  leaving the platform  ',
      });
      expect(result.reason).toBe('leaving the platform');
    });

    it('transforms empty reason to undefined', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
        reason: '',
      });
      expect(result.reason).toBeUndefined();
    });

    it('transforms whitespace-only reason to undefined', () => {
      const result = requestAccountDeletionSchema.parse({
        confirmation_email: 'user@example.com',
        reason: '   ',
      });
      expect(result.reason).toBeUndefined();
    });

    it('accepts various valid email formats', () => {
      const emails = [
        'simple@example.com',
        'name.surname@domain.co.uk',
        'user+tag@gmail.com',
      ];
      for (const email of emails) {
        const result = requestAccountDeletionSchema.parse({
          confirmation_email: email,
        });
        expect(result.confirmation_email).toBe(email);
      }
    });

    it('rejects email with spaces', () => {
      expect(() =>
        requestAccountDeletionSchema.parse({
          confirmation_email: 'user @example.com',
        })
      ).toThrow();
    });
  });

  // --- Constants ---
  describe('DELETION_GRACE_PERIOD_DAYS', () => {
    it('is 30 days', () => {
      expect(DELETION_GRACE_PERIOD_DAYS).toBe(30);
    });

    it('is a positive number', () => {
      expect(DELETION_GRACE_PERIOD_DAYS).toBeGreaterThan(0);
    });

    it('is an integer', () => {
      expect(Number.isInteger(DELETION_GRACE_PERIOD_DAYS)).toBe(true);
    });
  });
});

// --- Type tests (compile-time) ---
describe('GDPR Types', () => {
  it('ExportType is a valid type', async () => {
    const { ExportType } = await import('@/types/application') as unknown as {
      ExportType: string;
    };
    // Type-level check: if this compiles, types are valid
    const jsonType: import('@/types/application').ExportType = 'json';
    const csvType: import('@/types/application').ExportType = 'csv';
    expect(jsonType).toBe('json');
    expect(csvType).toBe('csv');
  });

  it('DeletionStatus covers all states', () => {
    const statuses: import('@/types/application').DeletionStatus[] = [
      'pending',
      'cancelled',
      'processing',
      'completed',
    ];
    expect(statuses).toHaveLength(4);
  });

  it('DataExportRequest has correct shape', () => {
    const mockRequest: import('@/types/application').DataExportRequest = {
      id: '123',
      user_id: '456',
      export_type: 'json',
      status: 'completed',
      file_path: '/path/to/file',
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:01:00Z',
      expires_at: '2026-01-01T01:01:00Z',
    };
    expect(mockRequest.id).toBe('123');
    expect(mockRequest.status).toBe('completed');
  });

  it('AccountDeletionRequest has correct shape', () => {
    const mockRequest: import('@/types/application').AccountDeletionRequest = {
      id: '123',
      user_id: '456',
      status: 'pending',
      reason: 'leaving',
      scheduled_deletion_at: '2026-02-01T00:00:00Z',
      cancelled_at: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mockRequest.status).toBe('pending');
    expect(mockRequest.scheduled_deletion_at).toBeTruthy();
  });
});
