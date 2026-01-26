import Anthropic from '@anthropic-ai/sdk';
import { APIError, QuotaExceededError } from './errors';
import { checkRateLimit } from './rate-limit';
import { logUsage } from './usage-logger';
import type { OperationType } from '@/types/ai';

/**
 * Anthropic AI Service
 *
 * Provides centralized access to Anthropic API with:
 * - Rate limiting
 * - Retry logic with exponential backoff
 * - Usage logging
 * - Error handling
 */
class AnthropicService {
  private client: Anthropic;
  private static instance: AnthropicService;

  private constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnthropicService {
    if (!AnthropicService.instance) {
      AnthropicService.instance = new AnthropicService();
    }
    return AnthropicService.instance;
  }

  /**
   * Create message with retry logic and usage tracking
   *
   * @param params - Anthropic message parameters
   * @param userId - Database user ID for rate limiting and logging
   * @param operationType - Type of operation for rate limiting
   * @returns Message response from Anthropic
   */
  async createMessage(
    params: Anthropic.MessageCreateParams,
    userId: string,
    operationType: OperationType
  ): Promise<Anthropic.Message> {
    const startTime = Date.now();

    try {
      // Check rate limit before making API call
      await checkRateLimit(userId, operationType);

      // Make API call with retry logic
      const response = await this.createMessageWithRetry(params);

      // Log successful usage
      const latencyMs = Date.now() - startTime;
      await logUsage({
        userId,
        operationType,
        success: true,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        modelVersion: response.model,
        latencyMs,
        inputSample: JSON.stringify(params.messages),
        outputSample: JSON.stringify(response.content),
      });

      return response;
    } catch (error) {
      // Log failed usage
      const latencyMs = Date.now() - startTime;
      await logUsage({
        userId,
        operationType,
        success: false,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        inputSample: JSON.stringify(params.messages),
      });

      throw error;
    }
  }

  /**
   * Create message with retry logic (exponential backoff)
   *
   * Retry logic:
   * - 3 attempts max
   * - Exponential backoff: 1s, 2s, 4s
   * - Retry on: network errors, 500/502/503/504
   * - Don't retry: 401, 429, 400
   */
  private async createMessageWithRetry(
    params: Anthropic.MessageCreateParams,
    attempt = 1
  ): Promise<Anthropic.Message> {
    const maxAttempts = 3;

    try {
      // Ensure stream is explicitly set to false to get Message type
      return await this.client.messages.create({
        ...params,
        stream: false,
      });
    } catch (error) {
      const shouldRetry = this.shouldRetryError(error, attempt, maxAttempts);

      if (!shouldRetry) {
        throw this.normalizeError(error);
      }

      // Exponential backoff: 2^(attempt-1) seconds
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`Retrying Anthropic API call (attempt ${attempt + 1}/${maxAttempts}) after ${delayMs}ms`);

      await this.sleep(delayMs);
      return this.createMessageWithRetry(params, attempt + 1);
    }
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetryError(error: unknown, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }

    // Retry network errors
    if (error instanceof Error && error.message.includes('network')) {
      return true;
    }

    // Retry 5xx server errors
    if (error instanceof Anthropic.APIError) {
      const status = error.status;
      return status >= 500 && status < 600;
    }

    return false;
  }

  /**
   * Normalize errors into custom error types
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      // 429 = Rate limit from Anthropic
      if (error.status === 429) {
        return new QuotaExceededError(
          'Anthropic API rate limit exceeded. Please try again later.'
        );
      }

      // 401 = Invalid API key
      if (error.status === 401) {
        return new APIError('Invalid Anthropic API key', 401, error);
      }

      // Other API errors
      return new APIError(error.message, error.status, error);
    }

    // Unknown error
    return error instanceof Error
      ? error
      : new Error('Unknown error occurred');
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Get singleton instance of Anthropic service
 */
export function getAnthropicService(): AnthropicService {
  return AnthropicService.getInstance();
}
