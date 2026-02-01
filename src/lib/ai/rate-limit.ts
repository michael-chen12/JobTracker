import { createClient } from '@/lib/supabase/server';
import { RateLimitError } from '@/lib/ai/errors';
import type { OperationType, RateLimitConfig } from '@/types/ai';

const RATE_LIMITS: RateLimitConfig = {
  resume_parse: 10,
  summarize_notes: 50,
  job_analysis: 10,
  generate_followups: 30,
};

const OPERATION_LABELS: Record<OperationType, string> = {
  resume_parse: 'resume parsing',
  summarize_notes: 'notes summarization',
  job_analysis: 'job analysis',
  generate_followups: 'follow-up generation',
};

function formatResetTime(resetTime: Date): string {
  return resetTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

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

    const label = OPERATION_LABELS[operationType] ?? operationType;

    throw new RateLimitError(
      `Rate limit reached. You've used all ${limit} ${label} actions this hour. Resets at ${formatResetTime(resetTime)}.`,
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
