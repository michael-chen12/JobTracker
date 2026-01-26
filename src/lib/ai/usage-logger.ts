import { createClient } from '@/lib/supabase/server';
import type { OperationType } from '@/types/ai';

interface LogUsageParams {
  userId: string;
  operationType: OperationType;
  success: boolean;
  tokensUsed?: number;
  modelVersion?: string;
  latencyMs?: number;
  errorMessage?: string;
  inputSample?: string;
  outputSample?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log AI operation to database for audit trail and cost tracking
 *
 * Truncates input/output samples to 500 chars for privacy and storage efficiency
 */
export async function logUsage(params: LogUsageParams): Promise<void> {
  const supabase = await createClient();

  // Estimate cost based on tokens (Claude 3.5 Sonnet pricing)
  // Input: $3/MTok, Output: $15/MTok
  const costEstimate = params.tokensUsed
    ? calculateCost(params.tokensUsed)
    : null;

  // Truncate samples to 500 chars
  const inputSample = params.inputSample?.substring(0, 500);
  const outputSample = params.outputSample?.substring(0, 500);

  const { error } = await supabase.from('ai_usage').insert({
    user_id: params.userId,
    operation_type: params.operationType,
    timestamp: new Date().toISOString(),
    tokens_used: params.tokensUsed,
    cost_estimate: costEstimate,
    model_version: params.modelVersion,
    latency_ms: params.latencyMs,
    success: params.success,
    error_message: params.errorMessage,
    input_sample: inputSample,
    output_sample: outputSample,
    metadata: params.metadata,
  });

  if (error) {
    // Don't throw - logging failure shouldn't break the operation
    console.error('Failed to log AI usage:', error);
  }
}

/**
 * Estimate cost in USD based on tokens
 *
 * Based on Claude 3.5 Sonnet pricing:
 * - Input: $3/MTok, Output: $15/MTok
 * - Assumes 60% input, 40% output split
 */
function calculateCost(tokens: number): number {
  // Simplified: assume 60% input, 40% output
  const inputTokens = Math.floor(tokens * 0.6);
  const outputTokens = Math.floor(tokens * 0.4);

  const inputCostPerMillion = 3.0; // $3/MTok
  const outputCostPerMillion = 15.0; // $15/MTok

  const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;

  return inputCost + outputCost;
}
