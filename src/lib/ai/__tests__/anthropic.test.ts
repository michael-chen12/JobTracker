import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Comprehensive unit tests for Anthropic AI Service
 *
 * Tests cover:
 * - Retry logic with mock API failures
 * - Non-retry scenarios (401, 429, 400 errors)
 * - Successful API calls with usage logging
 * - Rate limiting integration
 * - Singleton pattern enforcement
 */

// Create a shared mock messages object that will be used across all tests
const mockMessages = {
  create: vi.fn(),
};

// Mock the dependencies BEFORE importing the service
vi.mock('@anthropic-ai/sdk', () => {
  // Add APIError class for error creation
  class APIError extends Error {
    constructor(
      public status: number,
      public error: any,
      message: string,
      public headers: any
    ) {
      super(message);
      this.name = 'APIError';
    }
  }

  class MockAnthropic {
    messages = mockMessages;
    constructor(_config: any) {}
  }

  (MockAnthropic as any).APIError = APIError;

  return {
    default: MockAnthropic,
  };
});

vi.mock('../rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('../usage-logger', () => ({
  logUsage: vi.fn(),
}));

// Import AFTER mocking
import AnthropicSDK from '@anthropic-ai/sdk';
import { getAnthropicService } from '../anthropic';
import { APIError, QuotaExceededError } from '../errors';
import { checkRateLimit } from '../rate-limit';
import { logUsage } from '../usage-logger';

describe('AnthropicService', () => {
  // Test data
  const mockUserId = 'test-user-123';
  const mockOperationType = 'resume_parse' as const;
  const mockParams: Anthropic.MessageCreateParams = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Test message' }],
  };

  const mockSuccessResponse: Anthropic.Message = {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: 'Test response', citations: [] }],
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    } as Anthropic.Message['usage'],
  };

  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Get reference to the shared mock create function
    mockCreate = mockMessages.create;

    vi.clearAllMocks();

    // Default mock behaviors
    mockCreate.mockResolvedValue(mockSuccessResponse);
    vi.mocked(checkRateLimit).mockResolvedValue(undefined);
    vi.mocked(logUsage).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = getAnthropicService();
      const instance2 = getAnthropicService();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Successful API Calls', () => {
    it('should successfully create a message and log usage', async () => {
      const service = getAnthropicService();
      const result = await service.createMessage(mockParams, mockUserId, mockOperationType);

      // Verify rate limit check was called
      expect(checkRateLimit).toHaveBeenCalledWith(mockUserId, mockOperationType);

      // Verify API call was made with correct params
      expect(mockCreate).toHaveBeenCalledWith({
        ...mockParams,
        stream: false,
      });

      // Verify successful usage was logged
      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          operationType: mockOperationType,
          success: true,
          tokensUsed: 30, // 10 input + 20 output
          modelVersion: 'claude-3-5-sonnet-20241022',
          latencyMs: expect.any(Number),
          inputSample: expect.any(String),
          outputSample: expect.any(String),
        })
      );

      // Verify result is correct
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should measure latency correctly', async () => {
      mockCreate.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockSuccessResponse;
      });

      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      // Verify latency was measured (should be at least 100ms)
      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          latencyMs: expect.any(Number),
        })
      );

      const logCall = vi.mocked(logUsage).mock.calls[0]?.[0];
      // Allow for timing precision - expect at least 90ms (test adds 100ms delay but timing may vary)
      expect(logCall?.latencyMs).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should check rate limit before making API call', async () => {
      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      // Verify rate limit was checked
      expect(checkRateLimit).toHaveBeenCalledWith(mockUserId, mockOperationType);
      // Verify API call was made
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should not make API call if rate limit is exceeded', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      vi.mocked(checkRateLimit).mockRejectedValue(rateLimitError);

      const service = getAnthropicService();

      await expect(
        service.createMessage(mockParams, mockUserId, mockOperationType)
      ).rejects.toThrow('Rate limit exceeded');

      // Verify API call was never made
      expect(mockCreate).not.toHaveBeenCalled();

      // Verify failed usage was logged
      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: 'Rate limit exceeded',
        })
      );
    });
  });

  describe('Retry Logic - Network Errors', () => {
    it('should retry on network errors and succeed on second attempt', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCreate
        .mockRejectedValueOnce(new Error('network error occurred'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      const result = await service.createMessage(mockParams, mockUserId, mockOperationType);

      // Verify retry happened
      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retrying Anthropic API call (attempt 2/3)')
      );

      // Verify successful result
      expect(result).toEqual(mockSuccessResponse);

      consoleLogSpy.mockRestore();
    });

    it('should use exponential backoff for retries', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCreate
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      const startTime = Date.now();
      await service.createMessage(mockParams, mockUserId, mockOperationType);
      const endTime = Date.now();

      // Verify all retry attempts
      expect(mockCreate).toHaveBeenCalledTimes(3);

      // Verify exponential backoff messages (1s, 2s delays)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('after 1000ms')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('after 2000ms')
      );

      // Verify total time is at least 3 seconds (1s + 2s delays)
      expect(endTime - startTime).toBeGreaterThanOrEqual(3000);

      consoleLogSpy.mockRestore();
    });

    it('should throw error after max retry attempts', async () => {
      const networkError = new Error('network connection failed');
      mockCreate.mockRejectedValue(networkError);

      const service = getAnthropicService();

      await expect(
        service.createMessage(mockParams, mockUserId, mockOperationType)
      ).rejects.toThrow('network connection failed');

      // Verify max attempts (3) were made
      expect(mockCreate).toHaveBeenCalledTimes(3);

      // Verify failed usage was logged
      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: 'network connection failed',
        })
      );
    });
  });

  describe('Retry Logic - 5xx Server Errors', () => {
    it('should retry on 500 error and succeed', async () => {
      const error500 = new AnthropicSDK.APIError(
        500,
        { error: { type: 'api_error', message: 'Internal server error' } },
        'Internal server error',
        new Headers()
      );

      mockCreate
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      const result = await service.createMessage(mockParams, mockUserId, mockOperationType);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should retry on 502 Bad Gateway error', async () => {
      const error502 = new AnthropicSDK.APIError(
        502,
        { error: { type: 'api_error', message: 'Bad gateway' } },
        'Bad gateway',
        new Headers()
      );

      mockCreate
        .mockRejectedValueOnce(error502)
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 Service Unavailable error', async () => {
      const error503 = new AnthropicSDK.APIError(
        503,
        { error: { type: 'api_error', message: 'Service unavailable' } },
        'Service unavailable',
        new Headers()
      );

      mockCreate
        .mockRejectedValueOnce(error503)
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on 504 Gateway Timeout error', async () => {
      const error504 = new AnthropicSDK.APIError(
        504,
        { error: { type: 'api_error', message: 'Gateway timeout' } },
        'Gateway timeout',
        new Headers()
      );

      mockCreate
        .mockRejectedValueOnce(error504)
        .mockResolvedValueOnce(mockSuccessResponse);

      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Non-Retry Scenarios', () => {
    it('should not retry on 401 Unauthorized error', async () => {
      const error401 = new AnthropicSDK.APIError(
        401,
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        'Invalid API key',
        new Headers()
      );

      mockCreate.mockRejectedValue(error401);

      const service = getAnthropicService();

      await expect(
        service.createMessage(mockParams, mockUserId, mockOperationType)
      ).rejects.toThrow(APIError);

      // Verify only one attempt was made (no retries)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 429 Rate Limit error', async () => {
      const error429 = new AnthropicSDK.APIError(
        429,
        { error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        new Headers()
      );

      mockCreate.mockRejectedValue(error429);

      const service = getAnthropicService();

      await expect(
        service.createMessage(mockParams, mockUserId, mockOperationType)
      ).rejects.toThrow(QuotaExceededError);

      // Verify only one attempt was made (no retries)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400 Bad Request error', async () => {
      const error400 = new AnthropicSDK.APIError(
        400,
        { error: { type: 'invalid_request_error', message: 'Invalid request' } },
        'Invalid request',
        new Headers()
      );

      mockCreate.mockRejectedValue(error400);

      const service = getAnthropicService();

      await expect(
        service.createMessage(mockParams, mockUserId, mockOperationType)
      ).rejects.toThrow(APIError);

      // Verify only one attempt was made (no retries)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Normalization', () => {
    it('should normalize 401 error to APIError with status code', async () => {
      const error401 = new AnthropicSDK.APIError(
        401,
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        'Invalid API key',
        new Headers()
      );

      mockCreate.mockRejectedValue(error401);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(401);
        expect((error as APIError).message).toContain('Invalid Anthropic API key');
      }
    });

    it('should normalize 429 error to QuotaExceededError', async () => {
      const error429 = new AnthropicSDK.APIError(
        429,
        { error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        new Headers()
      );

      mockCreate.mockRejectedValue(error429);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(QuotaExceededError);
        expect((error as QuotaExceededError).message).toContain('Anthropic API rate limit exceeded');
      }
    });

    it('should normalize other APIErrors to APIError', async () => {
      const error400 = new AnthropicSDK.APIError(
        400,
        { error: { type: 'invalid_request_error', message: 'Invalid params' } },
        'Invalid params',
        new Headers()
      );

      mockCreate.mockRejectedValue(error400);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(400);
        expect((error as APIError).message).toBe('Invalid params');
      }
    });

    it('should handle unknown errors gracefully', async () => {
      mockCreate.mockRejectedValue('string error');

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Unknown error occurred');
      }
    });

    it('should preserve Error instances', async () => {
      const customError = new Error('Custom error message');
      mockCreate.mockRejectedValue(customError);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBe(customError);
        expect((error as Error).message).toBe('Custom error message');
      }
    });
  });

  describe('Usage Logging on Failure', () => {
    it('should log failed usage when API call fails', async () => {
      const apiError = new Error('API failure');
      mockCreate.mockRejectedValue(apiError);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
      } catch {
        // Expected to throw
      }

      // Verify failed usage was logged
      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          operationType: mockOperationType,
          success: false,
          errorMessage: 'API failure',
          latencyMs: expect.any(Number),
          inputSample: expect.any(String),
        })
      );

      // Verify no tokens were logged on failure
      const logCall = vi.mocked(logUsage).mock.calls[0]?.[0]!;
      expect(logCall.tokensUsed).toBeUndefined();
      expect(logCall.outputSample).toBeUndefined();
    });

    it('should log failed usage when rate limit is exceeded', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      vi.mocked(checkRateLimit).mockRejectedValue(rateLimitError);

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
      } catch {
        // Expected to throw
      }

      expect(logUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: 'Rate limit exceeded',
        })
      );
    });
  });

  describe('Input/Output Sampling', () => {
    it('should include input and output samples in successful logging', async () => {
      const service = getAnthropicService();
      await service.createMessage(mockParams, mockUserId, mockOperationType);

      const logCall = vi.mocked(logUsage).mock.calls[0]?.[0]!;

      // Verify input sample contains message data
      expect(logCall.inputSample).toBeDefined();
      expect(logCall.inputSample).toContain('user');
      expect(logCall.inputSample).toContain('Test message');

      // Verify output sample contains response data
      expect(logCall.outputSample).toBeDefined();
      expect(logCall.outputSample).toContain('text');
      expect(logCall.outputSample).toContain('Test response');
    });

    it('should include input sample in failed logging', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const service = getAnthropicService();

      try {
        await service.createMessage(mockParams, mockUserId, mockOperationType);
      } catch {
        // Expected to throw
      }

      const logCall = vi.mocked(logUsage).mock.calls[0]?.[0]!;

      // Verify input sample is still logged on failure
      expect(logCall.inputSample).toBeDefined();
      expect(logCall.inputSample).toContain('Test message');

      // Verify no output sample on failure
      expect(logCall.outputSample).toBeUndefined();
    });
  });
});
