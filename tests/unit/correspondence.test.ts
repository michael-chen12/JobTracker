import { describe, expect, it } from 'vitest';
import {
  correspondenceDirectionSchema,
  createCorrespondenceSchema,
  CORRESPONDENCE_DIRECTION_LABELS,
} from '@/schemas/application';
import { getDirectionConfig } from '@/lib/utils/correspondenceHelpers';
import type { CorrespondenceDirection } from '@/types/application';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Correspondence Validation Schemas', () => {
  describe('correspondenceDirectionSchema', () => {
    it('accepts "inbound"', () => {
      const result = correspondenceDirectionSchema.safeParse('inbound');
      expect(result.success).toBe(true);
    });

    it('accepts "outbound"', () => {
      const result = correspondenceDirectionSchema.safeParse('outbound');
      expect(result.success).toBe(true);
    });

    it('rejects invalid direction', () => {
      const result = correspondenceDirectionSchema.safeParse('sideways');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = correspondenceDirectionSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects number', () => {
      const result = correspondenceDirectionSchema.safeParse(1);
      expect(result.success).toBe(false);
    });
  });

  describe('createCorrespondenceSchema', () => {
    const validInput = {
      application_id: validUUID,
      subject: 'Interview Invitation',
      sender: 'recruiter@company.com',
      direction: 'inbound' as const,
    };

    it('accepts valid inbound correspondence', () => {
      const result = createCorrespondenceSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('accepts valid outbound correspondence', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        direction: 'outbound',
        recipient: 'recruiter@company.com',
        sender: 'me@email.com',
      });
      expect(result.success).toBe(true);
    });

    it('accepts correspondence with all optional fields', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        recipient: 'me@email.com',
        correspondence_date: '2026-02-07T10:00:00.000Z',
        notes: 'Discussed next steps in the process',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing subject', () => {
      const { subject, ...noSubject } = validInput;
      const result = createCorrespondenceSchema.safeParse(noSubject);
      expect(result.success).toBe(false);
    });

    it('rejects empty subject', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        subject: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects subject exceeding 500 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        subject: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('accepts subject at exactly 500 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        subject: 'x'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing sender', () => {
      const { sender, ...noSender } = validInput;
      const result = createCorrespondenceSchema.safeParse(noSender);
      expect(result.success).toBe(false);
    });

    it('rejects empty sender', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        sender: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects sender exceeding 255 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        sender: 'x'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing direction', () => {
      const { direction, ...noDirection } = validInput;
      const result = createCorrespondenceSchema.safeParse(noDirection);
      expect(result.success).toBe(false);
    });

    it('rejects invalid direction value', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        direction: 'forward',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid application_id (not UUID)', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        application_id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing application_id', () => {
      const { application_id, ...noAppId } = validInput;
      const result = createCorrespondenceSchema.safeParse(noAppId);
      expect(result.success).toBe(false);
    });

    it('rejects notes exceeding 2000 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        notes: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts notes at exactly 2000 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        notes: 'x'.repeat(2000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects recipient exceeding 255 chars', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        recipient: 'x'.repeat(256),
      });
      expect(result.success).toBe(false);
    });

    it('defaults correspondence_date to now when omitted', () => {
      const before = new Date().toISOString();
      const result = createCorrespondenceSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        const date = new Date(result.data.correspondence_date);
        expect(date.getTime()).toBeGreaterThanOrEqual(new Date(before).getTime() - 1000);
      }
    });

    it('trims whitespace from notes', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        notes: '  some notes with spaces  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('some notes with spaces');
      }
    });

    it('transforms empty recipient to undefined', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        recipient: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recipient).toBeUndefined();
      }
    });

    it('transforms empty notes to undefined', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        notes: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('rejects invalid date format for correspondence_date', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        correspondence_date: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid ISO 8601 date for correspondence_date', () => {
      const result = createCorrespondenceSchema.safeParse({
        ...validInput,
        correspondence_date: '2026-01-15T09:30:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.correspondence_date).toBe('2026-01-15T09:30:00.000Z');
      }
    });
  });
});

describe('Correspondence Constants', () => {
  describe('CORRESPONDENCE_DIRECTION_LABELS', () => {
    it('has labels for both directions', () => {
      expect(Object.keys(CORRESPONDENCE_DIRECTION_LABELS)).toHaveLength(2);
    });

    it('maps inbound to "Received"', () => {
      expect(CORRESPONDENCE_DIRECTION_LABELS['inbound']).toBe('Received');
    });

    it('maps outbound to "Sent"', () => {
      expect(CORRESPONDENCE_DIRECTION_LABELS['outbound']).toBe('Sent');
    });
  });
});

describe('getDirectionConfig', () => {
  it('returns correct config for inbound', () => {
    const config = getDirectionConfig('inbound');
    expect(config.label).toBe('Received');
    expect(config.icon).toBe('📥');
    expect(config.bg).toContain('blue');
    expect(config.text).toContain('blue');
  });

  it('returns correct config for outbound', () => {
    const config = getDirectionConfig('outbound');
    expect(config.label).toBe('Sent');
    expect(config.icon).toBe('📤');
    expect(config.bg).toContain('green');
    expect(config.text).toContain('green');
  });

  it.each(['inbound', 'outbound'] as CorrespondenceDirection[])(
    'config for %s has all required keys',
    (direction) => {
      const config = getDirectionConfig(direction);
      expect(config).toHaveProperty('bg');
      expect(config).toHaveProperty('text');
      expect(config).toHaveProperty('border');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('label');
    }
  );

  it('inbound and outbound have different icons', () => {
    const inbound = getDirectionConfig('inbound');
    const outbound = getDirectionConfig('outbound');
    expect(inbound.icon).not.toBe(outbound.icon);
  });

  it('inbound and outbound have different labels', () => {
    const inbound = getDirectionConfig('inbound');
    const outbound = getDirectionConfig('outbound');
    expect(inbound.label).not.toBe(outbound.label);
  });

  it('inbound and outbound have different color schemes', () => {
    const inbound = getDirectionConfig('inbound');
    const outbound = getDirectionConfig('outbound');
    expect(inbound.bg).not.toBe(outbound.bg);
    expect(inbound.text).not.toBe(outbound.text);
  });
});
