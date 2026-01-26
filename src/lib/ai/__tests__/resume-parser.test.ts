import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic service
const mockCreateMessage = vi.fn();
vi.mock('../anthropic', () => ({
  getAnthropicService: () => ({
    createMessage: mockCreateMessage,
  }),
}));

// Import after mocking
import { parseResumeText, ResumeParseError } from '../resume-parser';

describe('resume-parser', () => {
  const mockUserId = 'test-user-123';
  const mockResumeText = `
    John Doe
    Senior Software Engineer
    Skills: JavaScript, TypeScript, React, Node.js
    Experience: Tech Corp (2020-Present), Junior Dev (2018-2020)
    Education: BS Computer Science, Tech University, 2018
  `;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseResumeText', () => {
    it('should successfully parse valid resume text', async () => {
      const mockParsedData = {
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Software Engineer',
            startDate: '2020-01',
            endDate: null,
            description: null,
          },
        ],
        education: [
          {
            institution: 'Tech University',
            degree: 'BS',
            field: 'Computer Science',
            graduationDate: '2018',
          },
        ],
        contact: {
          email: 'john@example.com',
          phone: null,
          linkedin: null,
        },
        summary: 'Experienced software engineer',
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockParsedData),
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      const result = await parseResumeText({
        text: mockResumeText,
        userId: mockUserId,
      });

      expect(result).toEqual(mockParsedData);

      // Verify API call was made correctly
      expect(mockCreateMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4096,
          system: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              cache_control: { type: 'ephemeral' },
            }),
          ]),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Parse this resume'),
            }),
          ]),
        }),
        mockUserId,
        'resume_parse'
      );
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const mockParsedData = {
        skills: ['Python'],
        experience: [],
        education: [],
        contact: null,
        summary: null,
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_124',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: `\`\`\`json\n${JSON.stringify(mockParsedData)}\n\`\`\``,
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      const result = await parseResumeText({
        text: mockResumeText,
        userId: mockUserId,
      });

      expect(result).toEqual(mockParsedData);
    });

    it('should throw ResumeParseError for non-text response', async () => {
      const mockResponse: Anthropic.Message = {
        id: 'msg_125',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'tool_use',
            id: 'tool_123',
            name: 'test_tool',
            input: {},
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow(ResumeParseError);
    });

    it('should throw ResumeParseError for invalid JSON', async () => {
      const mockResponse: Anthropic.Message = {
        id: 'msg_126',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow(ResumeParseError);
    });

    it('should validate required fields - skills missing', async () => {
      const invalidData = {
        experience: [],
        education: [],
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_127',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidData),
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow('missing skills array');
    });

    it('should validate required fields - experience missing', async () => {
      const invalidData = {
        skills: ['Python'],
        education: [],
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_128',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidData),
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow('missing experience array');
    });

    it('should validate required fields - education missing', async () => {
      const invalidData = {
        skills: ['Python'],
        experience: [],
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_129',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: JSON.stringify(invalidData),
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow('missing education array');
    });

    it('should wrap API errors in ResumeParseError', async () => {
      mockCreateMessage.mockRejectedValue(new Error('API error'));

      await expect(
        parseResumeText({ text: mockResumeText, userId: mockUserId })
      ).rejects.toThrow(ResumeParseError);
    });

    it('should use prompt caching in system message', async () => {
      const mockParsedData = {
        skills: ['Test'],
        experience: [],
        education: [],
        contact: null,
        summary: null,
      };

      const mockResponse: Anthropic.Message = {
        id: 'msg_130',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockParsedData),
            citations: [],
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 200,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation: null,
          server_tool_use: null,
          service_tier: null,
        },
      };

      mockCreateMessage.mockResolvedValue(mockResponse);

      await parseResumeText({ text: mockResumeText, userId: mockUserId });

      // Verify cache control is set
      const callArgs = mockCreateMessage.mock.calls[0];
      const systemMessage = callArgs?.[0]?.system?.[0];

      expect(systemMessage).toBeDefined();
      expect(systemMessage.cache_control).toEqual({ type: 'ephemeral' });
    });
  });
});
