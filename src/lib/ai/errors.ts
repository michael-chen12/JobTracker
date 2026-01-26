/**
 * Custom error classes for AI service
 */

/**
 * User has exceeded their hourly rate limit
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public operationType: string,
    public limit: number,
    public resetTime: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Anthropic API quota has been exceeded
 */
export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * General API error from Anthropic
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}
