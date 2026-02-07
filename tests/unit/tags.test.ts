import { describe, expect, it } from 'vitest';
import { createTagSchema, updateTagSchema } from '@/schemas/application';

describe('Tag Validation Schemas', () => {
  describe('createTagSchema - name validation', () => {
    it('accepts a simple valid tag name', () => {
      const result = createTagSchema.safeParse({ name: 'Frontend' });
      expect(result.success).toBe(true);
    });

    it('accepts letters, numbers, spaces, hyphens, and underscores', () => {
      const result = createTagSchema.safeParse({ name: 'Phase_2 - Sprint 3' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createTagSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects name longer than 50 characters', () => {
      const result = createTagSchema.safeParse({ name: 'a'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('accepts name at exactly 50 characters', () => {
      const result = createTagSchema.safeParse({ name: 'a'.repeat(50) });
      expect(result.success).toBe(true);
    });

    it.each([
      'engineering@team',
      'sales/ops',
      'product.management',
      'qa+automation',
      'dev&design',
      '<script>alert(1)</script>',
    ])('rejects invalid special characters: %s', (name) => {
      const result = createTagSchema.safeParse({ name });
      expect(result.success).toBe(false);
    });

    it.each([
      'Développement',
      '工程',
      'emoji-rocket-🚀',
      'naive-cafe-ï',
    ])('rejects unicode characters outside allowed regex: %s', (name) => {
      const result = createTagSchema.safeParse({ name });
      expect(result.success).toBe(false);
    });
  });

  describe('createTagSchema - color validation', () => {
    it('applies default color when omitted', () => {
      const result = createTagSchema.parse({ name: 'Design' });
      expect(result.color).toBe('#3B82F6');
    });

    it.each([
      '#3B82F6',
      '#3b82f6',
      '#AbCdEf',
      '#000000',
      '#FFFFFF',
    ])('accepts valid hex color: %s', (color) => {
      const result = createTagSchema.safeParse({ name: 'Backend', color });
      expect(result.success).toBe(true);
    });

    it.each([
      '3B82F6',
      '#FFF',
      '#12345',
      '#1234567',
      '#GGGGGG',
      '#12_456',
      '',
    ])('rejects invalid hex color: %s', (color) => {
      const result = createTagSchema.safeParse({ name: 'Data', color });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTagSchema', () => {
    it('accepts empty object for partial updates', () => {
      const result = updateTagSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts valid partial name update', () => {
      const result = updateTagSchema.safeParse({ name: 'Interview Prep' });
      expect(result.success).toBe(true);
    });

    it('accepts valid partial color update', () => {
      const result = updateTagSchema.safeParse({ color: '#10B981' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid partial name update', () => {
      const result = updateTagSchema.safeParse({ name: 'bad/name' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid partial color update', () => {
      const result = updateTagSchema.safeParse({ color: '#ZZZZZZ' });
      expect(result.success).toBe(false);
    });
  });
});
