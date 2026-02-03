import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Validation schemas (replicated for unit testing)
const bulkUpdateStatusSchema = z.object({
  applicationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one application must be selected')
    .max(50, 'Cannot update more than 50 applications at once'),
  status: z.enum([
    'bookmarked',
    'applied',
    'screening',
    'interviewing',
    'offer',
    'rejected',
    'accepted',
    'withdrawn',
  ]),
});

const bulkDeleteSchema = z.object({
  applicationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one application must be selected')
    .max(50, 'Cannot delete more than 50 applications at once'),
});

describe('Bulk Operations Validation', () => {
  describe('bulkUpdateStatusSchema', () => {
    it('should accept valid input with 1 application', () => {
      const input = {
        applicationIds: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'applied',
      };
      expect(() => bulkUpdateStatusSchema.parse(input)).not.toThrow();
    });

    it('should accept valid input with 50 applications', () => {
      const applicationIds = Array.from({ length: 50 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const input = { applicationIds, status: 'interviewing' };
      expect(() => bulkUpdateStatusSchema.parse(input)).not.toThrow();
    });

    it('should reject empty array', () => {
      const input = { applicationIds: [], status: 'applied' };
      expect(() => bulkUpdateStatusSchema.parse(input)).toThrow(
        'At least one application must be selected'
      );
    });

    it('should reject more than 50 applications', () => {
      const applicationIds = Array.from({ length: 51 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const input = { applicationIds, status: 'applied' };
      expect(() => bulkUpdateStatusSchema.parse(input)).toThrow(
        'Cannot update more than 50 applications at once'
      );
    });

    it('should reject invalid status', () => {
      const input = {
        applicationIds: ['550e8400-e29b-41d4-a716-446655440000'],
        status: 'InvalidStatus',
      };
      expect(() => bulkUpdateStatusSchema.parse(input)).toThrow();
    });

    it('should reject invalid UUID format', () => {
      const input = {
        applicationIds: ['not-a-uuid'],
        status: 'applied',
      };
      expect(() => bulkUpdateStatusSchema.parse(input)).toThrow();
    });

    it('should accept all valid statuses', () => {
      const validStatuses = [
        'bookmarked',
        'applied',
        'screening',
        'interviewing',
        'offer',
        'rejected',
        'accepted',
        'withdrawn',
      ];

      validStatuses.forEach((status) => {
        const input = {
          applicationIds: ['550e8400-e29b-41d4-a716-446655440000'],
          status,
        };
        expect(() => bulkUpdateStatusSchema.parse(input)).not.toThrow();
      });
    });
  });

  describe('bulkDeleteSchema', () => {
    it('should accept valid input with 1 application', () => {
      const input = {
        applicationIds: ['550e8400-e29b-41d4-a716-446655440000'],
      };
      expect(() => bulkDeleteSchema.parse(input)).not.toThrow();
    });

    it('should accept valid input with 50 applications', () => {
      const applicationIds = Array.from({ length: 50 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const input = { applicationIds };
      expect(() => bulkDeleteSchema.parse(input)).not.toThrow();
    });

    it('should reject empty array', () => {
      const input = { applicationIds: [] };
      expect(() => bulkDeleteSchema.parse(input)).toThrow(
        'At least one application must be selected'
      );
    });

    it('should reject more than 50 applications', () => {
      const applicationIds = Array.from({ length: 51 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      );
      const input = { applicationIds };
      expect(() => bulkDeleteSchema.parse(input)).toThrow(
        'Cannot delete more than 50 applications at once'
      );
    });

    it('should reject invalid UUID format', () => {
      const input = { applicationIds: ['not-a-uuid'] };
      expect(() => bulkDeleteSchema.parse(input)).toThrow();
    });

    it('should reject mixed valid and invalid UUIDs', () => {
      const input = {
        applicationIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          'invalid-uuid',
        ],
      };
      expect(() => bulkDeleteSchema.parse(input)).toThrow();
    });
  });
});
