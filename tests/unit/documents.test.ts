import { describe, expect, it } from 'vitest';
import {
  documentTypeSchema,
  uploadDocumentSchema,
  DOCUMENT_MAX_FILE_SIZE,
  DOCUMENT_MAX_TOTAL_SIZE,
  DOCUMENT_ACCEPTED_MIME_TYPES,
  DOCUMENT_TYPE_LABELS,
} from '@/schemas/application';
import { formatFileSize } from '@/lib/utils/formatters';

describe('Document Validation Schemas', () => {
  describe('documentTypeSchema', () => {
    it.each([
      'resume',
      'cover_letter',
      'portfolio',
      'transcript',
      'correspondence',
      'other',
    ])('accepts valid document type: %s', (type) => {
      const result = documentTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });

    it('rejects invalid document type', () => {
      const result = documentTypeSchema.safeParse('invalid_type');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = documentTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('uploadDocumentSchema', () => {
    it('accepts valid upload input', () => {
      const result = uploadDocumentSchema.safeParse({
        application_id: '550e8400-e29b-41d4-a716-446655440000',
        document_type: 'cover_letter',
      });
      expect(result.success).toBe(true);
    });

    it('defaults document_type to "other" when not provided', () => {
      const result = uploadDocumentSchema.safeParse({
        application_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document_type).toBe('other');
      }
    });

    it('rejects invalid UUID for application_id', () => {
      const result = uploadDocumentSchema.safeParse({
        application_id: 'not-a-uuid',
        document_type: 'resume',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing application_id', () => {
      const result = uploadDocumentSchema.safeParse({
        document_type: 'resume',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid document_type', () => {
      const result = uploadDocumentSchema.safeParse({
        application_id: '550e8400-e29b-41d4-a716-446655440000',
        document_type: 'unknown',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Document Constants', () => {
  describe('DOCUMENT_MAX_FILE_SIZE', () => {
    it('is 10MB in bytes', () => {
      expect(DOCUMENT_MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('DOCUMENT_MAX_TOTAL_SIZE', () => {
    it('is 50MB in bytes', () => {
      expect(DOCUMENT_MAX_TOTAL_SIZE).toBe(50 * 1024 * 1024);
    });
  });

  describe('DOCUMENT_ACCEPTED_MIME_TYPES', () => {
    it('includes PDF', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toContain('application/pdf');
    });

    it('includes DOCX', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('includes TXT', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toContain('text/plain');
    });

    it('includes JPEG', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toContain('image/jpeg');
    });

    it('includes PNG', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toContain('image/png');
    });

    it('has exactly 5 accepted types', () => {
      expect(DOCUMENT_ACCEPTED_MIME_TYPES).toHaveLength(5);
    });
  });

  describe('DOCUMENT_TYPE_LABELS', () => {
    it('has labels for all 6 document types', () => {
      expect(Object.keys(DOCUMENT_TYPE_LABELS)).toHaveLength(6);
    });

    it.each([
      ['resume', 'Resume'],
      ['cover_letter', 'Cover Letter'],
      ['portfolio', 'Portfolio'],
      ['transcript', 'Transcript'],
      ['correspondence', 'Correspondence'],
      ['other', 'Other'],
    ])('maps %s to %s', (key, label) => {
      expect(DOCUMENT_TYPE_LABELS[key]).toBe(label);
    });
  });
});

describe('formatFileSize', () => {
  it('returns "0 B" for null', () => {
    expect(formatFileSize(null)).toBe('0 B');
  });

  it('returns "0 B" for 0', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('formats fractional megabytes', () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('formats 10MB (max file size) correctly', () => {
    expect(formatFileSize(DOCUMENT_MAX_FILE_SIZE)).toBe('10.0 MB');
  });

  it('formats 50MB (max total size) correctly', () => {
    expect(formatFileSize(DOCUMENT_MAX_TOTAL_SIZE)).toBe('50.0 MB');
  });
});
