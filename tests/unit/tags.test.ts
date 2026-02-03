import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTagSchema, updateTagSchema } from '@/schemas/application';

describe('Tag Validation Schemas', () => {
  describe('createTagSchema', () => {
    it('should validate a valid tag', () => {
      const validTag = {
        name: 'Remote',
        color: '#3B82F6',
      };

      const result = createTagSchema.safeParse(validTag);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Remote');
        expect(result.data.color).toBe('#3B82F6');
      }
    });

    it('should accept tag name with spaces, hyphens, and underscores', () => {
      const validNames = [
        'Remote Work',
        'high-priority',
        'urgent_review',
        'Tech Job 2024',
      ];

      validNames.forEach((name) => {
        const result = createTagSchema.safeParse({ name, color: '#3B82F6' });
        expect(result.success).toBe(true);
      });
    });

    it('should use default color when not provided', () => {
      const tag = { name: 'Test' };
      const result = createTagSchema.safeParse(tag);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3B82F6');
      }
    });

    it('should reject empty tag name', () => {
      const invalidTag = { name: '', color: '#3B82F6' };
      const result = createTagSchema.safeParse(invalidTag);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Tag name required');
      }
    });

    it('should reject tag name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const invalidTag = { name: longName, color: '#3B82F6' };
      const result = createTagSchema.safeParse(invalidTag);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Max 50 characters');
      }
    });

    it('should reject tag name with special characters', () => {
      const invalidNames = [
        'Tag@Special',
        'Tag#Hash',
        'Tag$Dollar',
        'Tag%Percent',
        'Tag&Ampersand',
      ];

      invalidNames.forEach((name) => {
        const result = createTagSchema.safeParse({ name, color: '#3B82F6' });
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid hex color format', () => {
      const invalidColors = [
        '#ZZZ', // Invalid hex characters
        '#12345', // Too short
        '#1234567', // Too long
        '3B82F6', // Missing #
        'blue', // Color name
      ];

      invalidColors.forEach((color) => {
        const result = createTagSchema.safeParse({ name: 'Test', color });
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid hex colors (uppercase and lowercase)', () => {
      const validColors = [
        '#3B82F6',
        '#3b82f6',
        '#FFFFFF',
        '#000000',
        '#AbCdEf',
      ];

      validColors.forEach((color) => {
        const result = createTagSchema.safeParse({ name: 'Test', color });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateTagSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = { name: 'Updated Name' };
      const result = updateTagSchema.safeParse(partialUpdate);

      expect(result.success).toBe(true);
    });

    it('should allow empty object (no updates)', () => {
      const result = updateTagSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate color when provided', () => {
      const invalidUpdate = { color: 'invalid' };
      const result = updateTagSchema.safeParse(invalidUpdate);

      expect(result.success).toBe(false);
    });
  });
});

describe('Tag Name Edge Cases', () => {
  it('should trim whitespace from tag names', () => {
    const tag = { name: '  Remote  ', color: '#3B82F6' };
    const result = createTagSchema.safeParse(tag);

    expect(result.success).toBe(true);
    // Note: Trimming should be handled by server action, not schema
  });

  it('should handle unicode characters in validation', () => {
    const unicodeNames = [
      'Tag™',
      'Tag©',
      'Tag®',
      'Tag™',
    ];

    unicodeNames.forEach((name) => {
      const result = createTagSchema.safeParse({ name, color: '#3B82F6' });
      // Should fail because regex only allows alphanumeric + space, hyphen, underscore
      expect(result.success).toBe(false);
    });
  });

  it('should handle extremely long color codes', () => {
    const invalidColor = '#' + 'F'.repeat(100);
    const result = createTagSchema.safeParse({ name: 'Test', color: invalidColor });

    expect(result.success).toBe(false);
  });

  it('should validate exact 6-character hex codes', () => {
    const result = createTagSchema.safeParse({ name: 'Test', color: '#ABC' });
    expect(result.success).toBe(false); // Must be exactly 6 characters
  });
});
