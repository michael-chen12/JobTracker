import { vi } from 'vitest';
import { checkRateLimit, getRemainingQuota } from '../rate-limit';
import { RateLimitError } from '../errors';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const createCountBuilder = (count: number | null, error: unknown = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockResolvedValue({ count, error }),
});

const createOldestBuilder = (timestamp: string | null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: timestamp ? { timestamp } : null }),
});

describe('rate-limit', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('checkRateLimit allows requests under the limit', async () => {
    const from = vi.fn().mockReturnValue(createCountBuilder(3));
    vi.mocked(createClient).mockResolvedValue({ from } as any);

    await expect(checkRateLimit('user-1', 'job_analysis')).resolves.toBeUndefined();
  });

  test('checkRateLimit throws when limit exceeded', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-30T12:00:00Z'));

    const from = vi
      .fn()
      .mockReturnValueOnce(createCountBuilder(10))
      .mockReturnValueOnce(createOldestBuilder('2026-01-30T11:10:00Z'));

    vi.mocked(createClient).mockResolvedValue({ from } as any);

    try {
      await checkRateLimit('user-1', 'job_analysis');
      throw new Error('Expected checkRateLimit to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      const rateError = error as RateLimitError;
      expect(rateError.limit).toBe(10);
      expect(rateError.resetTime.toISOString()).toBe('2026-01-30T12:10:00.000Z');
    }
  });

  test('getRemainingQuota returns remaining count', async () => {
    const from = vi.fn().mockReturnValue(createCountBuilder(4));
    vi.mocked(createClient).mockResolvedValue({ from } as any);

    const remaining = await getRemainingQuota('user-1', 'job_analysis');
    expect(remaining).toBe(6);
  });
});
