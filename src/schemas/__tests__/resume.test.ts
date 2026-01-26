import { describe, it, expect } from 'vitest';
import { resumeUploadSchema } from '../resume';

describe('resumeUploadSchema', () => {
  it('should validate valid PDF file', () => {
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = resumeUploadSchema.safeParse({ file, size: 1024 * 1024 });
    expect(result.success).toBe(true);
  });

  it('should validate valid DOCX file', () => {
    const file = new File(['content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const result = resumeUploadSchema.safeParse({ file, size: 1024 * 1024 });
    expect(result.success).toBe(true);
  });

  it('should reject file larger than 5MB', () => {
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const result = resumeUploadSchema.safeParse({ file, size: 6 * 1024 * 1024 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('5MB');
    }
  });

  it('should reject invalid file type', () => {
    const file = new File(['content'], 'resume.txt', { type: 'text/plain' });
    const result = resumeUploadSchema.safeParse({ file, size: 1024 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('PDF or DOCX');
    }
  });
});
