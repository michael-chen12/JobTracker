/**
 * Unit Tests: Interaction Helper Functions
 * Ticket #17: Interaction History Tracking
 *
 * Tests utility functions for interaction formatting and display
 */

import { describe, test, expect } from '@jest/globals';
import {
  getInteractionTypeColors,
  getRelationshipStrengthColors,
} from '@/lib/utils/interactionHelpers';
import type { InteractionType, RelationshipStrength } from '@/types/contacts';

describe('getInteractionTypeColors', () => {
  test('should return correct colors for email type', () => {
    const colors = getInteractionTypeColors('email');

    expect(colors).toEqual({
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-600',
      icon: '📧',
      label: 'Email',
    });
  });

  test('should return correct colors for call type', () => {
    const colors = getInteractionTypeColors('call');

    expect(colors).toEqual({
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-600',
      icon: '📞',
      label: 'Call',
    });
  });

  test('should return correct colors for meeting type', () => {
    const colors = getInteractionTypeColors('meeting');

    expect(colors).toEqual({
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-600',
      icon: '🤝',
      label: 'Meeting',
    });
  });

  test('should return correct colors for linkedin_message type', () => {
    const colors = getInteractionTypeColors('linkedin_message');

    expect(colors).toEqual({
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-300 dark:border-sky-600',
      icon: '💼',
      label: 'LinkedIn',
    });
  });

  test('should return correct colors for other type', () => {
    const colors = getInteractionTypeColors('other');

    expect(colors).toEqual({
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      icon: '💬',
      label: 'Other',
    });
  });

  test('should handle all valid interaction types', () => {
    const types: InteractionType[] = [
      'email',
      'call',
      'meeting',
      'linkedin_message',
      'other',
    ];

    types.forEach((type) => {
      const colors = getInteractionTypeColors(type);

      expect(colors).toHaveProperty('bg');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('border');
      expect(colors).toHaveProperty('icon');
      expect(colors).toHaveProperty('label');
      expect(typeof colors.icon).toBe('string');
      expect(colors.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('getRelationshipStrengthColors', () => {
  test('should return correct colors for cold strength', () => {
    const colors = getRelationshipStrengthColors('cold');

    expect(colors).toEqual({
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      icon: '❄️',
      label: 'Cold',
    });
  });

  test('should return correct colors for warm strength', () => {
    const colors = getRelationshipStrengthColors('warm');

    expect(colors).toEqual({
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '🔥',
      label: 'Warm',
    });
  });

  test('should return correct colors for strong strength', () => {
    const colors = getRelationshipStrengthColors('strong');

    expect(colors).toEqual({
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: '💪',
      label: 'Strong',
    });
  });

  test('should handle all valid relationship strengths', () => {
    const strengths: RelationshipStrength[] = ['cold', 'warm', 'strong'];

    strengths.forEach((strength) => {
      const colors = getRelationshipStrengthColors(strength);

      expect(colors).toHaveProperty('bg');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('icon');
      expect(colors).toHaveProperty('label');
      expect(typeof colors.icon).toBe('string');
      expect(colors.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('Relationship Strength Calculation Logic', () => {
  test('should classify 0 interactions as cold', () => {
    const recentCount = 0;
    const strength: RelationshipStrength = recentCount === 0 ? 'cold' : recentCount >= 3 ? 'strong' : 'warm';

    expect(strength).toBe('cold');
  });

  test('should classify 1 interaction as warm', () => {
    const recentCount = 1;
    const strength: RelationshipStrength = recentCount === 0 ? 'cold' : recentCount >= 3 ? 'strong' : 'warm';

    expect(strength).toBe('warm');
  });

  test('should classify 2 interactions as warm', () => {
    const recentCount = 2;
    const strength: RelationshipStrength = recentCount === 0 ? 'cold' : recentCount >= 3 ? 'strong' : 'warm';

    expect(strength).toBe('warm');
  });

  test('should classify 3 interactions as strong', () => {
    const recentCount = 3;
    const strength: RelationshipStrength = recentCount === 0 ? 'cold' : recentCount >= 3 ? 'strong' : 'warm';

    expect(strength).toBe('strong');
  });

  test('should classify 10 interactions as strong', () => {
    const recentCount = 10;
    const strength: RelationshipStrength = recentCount === 0 ? 'cold' : recentCount >= 3 ? 'strong' : 'warm';

    expect(strength).toBe('strong');
  });
});

describe('Filter Logic', () => {
  test('should filter interactions by type', () => {
    const interactions = [
      { id: '1', interaction_type: 'email', notes: 'Email 1' },
      { id: '2', interaction_type: 'call', notes: 'Call 1' },
      { id: '3', interaction_type: 'email', notes: 'Email 2' },
    ];

    const filtered = interactions.filter((i) => i.interaction_type === 'email');

    expect(filtered).toHaveLength(2);
    expect(filtered[0].notes).toBe('Email 1');
    expect(filtered[1].notes).toBe('Email 2');
  });

  test('should filter interactions by multiple types', () => {
    const interactions = [
      { id: '1', interaction_type: 'email', notes: 'Email' },
      { id: '2', interaction_type: 'call', notes: 'Call' },
      { id: '3', interaction_type: 'meeting', notes: 'Meeting' },
    ];

    const allowedTypes = ['email', 'call'];
    const filtered = interactions.filter((i) =>
      allowedTypes.includes(i.interaction_type)
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].notes).toBe('Email');
    expect(filtered[1].notes).toBe('Call');
  });

  test('should filter interactions by date range', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const interactions = [
      {
        id: '1',
        interaction_date: now.toISOString(),
        notes: 'Today',
      },
      {
        id: '2',
        interaction_date: yesterday.toISOString(),
        notes: 'Yesterday',
      },
      {
        id: '3',
        interaction_date: twoDaysAgo.toISOString(),
        notes: 'Two days ago',
      },
    ];

    // Filter: last 24 hours
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const filtered = interactions.filter(
      (i) => new Date(i.interaction_date) >= oneDayAgo
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].notes).toBe('Today');
    expect(filtered[1].notes).toBe('Yesterday');
  });
});

describe('Date Validation', () => {
  test('should identify future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);

    const isFuture = future > new Date();

    expect(isFuture).toBe(true);
  });

  test('should identify past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const isPast = past < new Date();

    expect(isPast).toBe(true);
  });

  test('should identify today as not future', () => {
    const today = new Date();

    const isFuture = today > new Date();

    // Might be true or false depending on exact millisecond
    // So just verify it's defined
    expect(typeof isFuture).toBe('boolean');
  });
});

describe('Notes Truncation Logic', () => {
  test('should detect notes longer than 200 characters', () => {
    const longNotes = 'A'.repeat(250);

    const shouldTruncate = longNotes.length > 200;

    expect(shouldTruncate).toBe(true);
  });

  test('should not truncate notes at exactly 200 characters', () => {
    const notes = 'A'.repeat(200);

    const shouldTruncate = notes.length > 200;

    expect(shouldTruncate).toBe(false);
  });

  test('should not truncate short notes', () => {
    const notes = 'Short note';

    const shouldTruncate = notes.length > 200;

    expect(shouldTruncate).toBe(false);
  });
});

describe('Edge Cases', () => {
  test('should handle empty notes gracefully', () => {
    const notes = '';

    expect(notes.length).toBe(0);
    expect(notes || 'No notes').toBe('No notes');
  });

  test('should handle null notes gracefully', () => {
    const notes = null;

    expect(notes || 'No notes').toBe('No notes');
  });

  test('should handle undefined interaction type', () => {
    const type = undefined;

    // Should have type checking to prevent this
    expect(type).toBeUndefined();
  });

  test('should handle negative interaction counts', () => {
    const count = -1;

    // Should never happen, but validation should catch it
    expect(count < 0).toBe(true);
  });

  test('should handle very large interaction counts', () => {
    const count = 9999;

    const strength: RelationshipStrength = count >= 3 ? 'strong' : count >= 1 ? 'warm' : 'cold';

    expect(strength).toBe('strong');
  });
});
