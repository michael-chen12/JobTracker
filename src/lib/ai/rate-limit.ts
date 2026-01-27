import { createClient } from '@/lib/supabase/server';
import { RateLimitError } from '@/lib/ai/errors';
import type { OperationType, RateLimitConfig } from '@/types/ai';

const RATE_LIMITS: RateLimitConfig = {
  resume_parse: 10,
  summarize_notes: 50,
  job_analysis: 20,
};

/**
 * Check if user has exceeded rate limit for operation
 *
 * @param userId - Database user ID (not auth ID)
 * @param operationType - Type of AI operation
 * @throws RateLimitError if limit exceeded
 */
export async function checkRateLimit(
  userId: string,
  operationType: OperationType
): Promise<void> {
  const supabase = await createClient();

  const limit = RATE_LIMITS[operationType];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count operations in the past hour
  const { count, error } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('operation_type', operationType)
    .gte('timestamp', oneHourAgo.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    throw new Error('Failed to check rate limit');
  }

  if (count !== null && count >= limit) {
    // Get the oldest operation timestamp to calculate accurate reset time
    const { data: oldestOp } = await supabase
      .from('ai_usage')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('operation_type', operationType)
      .gte('timestamp', oneHourAgo.toISOString())
      .order('timestamp', { ascending: true })
      .limit(1)
      .single();

    // Reset time is when the oldest operation expires (1 hour after it was created)
    const resetTime = oldestOp
      ? new Date(new Date(oldestOp.timestamp).getTime() + 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    throw new RateLimitError(
      `Rate limit exceeded for ${operationType}. Limit: ${limit} per hour. Try again after ${resetTime.toLocaleString()}.`,
      operationType,
      limit,
      resetTime
    );
  }
}

/**
 * Get remaining quota for user
 *
 * @param userId - Database user ID
 * @param operationType - Type of AI operation
 * @returns Remaining count before hitting limit
 */
export async function getRemainingQuota(
  userId: string,
  operationType: OperationType
): Promise<number> {
  const supabase = await createClient();

  const limit = RATE_LIMITS[operationType];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { count, error } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('operation_type', operationType)
    .gte('timestamp', oneHourAgo.toISOString());

  if (error || count === null) {
    return limit; // Return full limit on error (fail open)
  }

  return Math.max(0, limit - count);
}
