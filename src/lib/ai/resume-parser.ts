/**
 * AI Resume Parsing Service
 * Uses Claude AI to extract structured information from resume text
 */

import { getAnthropicService } from './anthropic';
import type { ParsedResume } from '@/types/ai';

/**
 * Custom error for resume parsing failures
 */
export class ResumeParseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'ResumeParseError';
  }
}

/**
 * System prompt for Claude resume parsing with prompt caching
 * This prompt is cached for 5 minutes to reduce costs by ~90%
 */
const RESUME_PARSING_SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the resume text provided.

Return ONLY valid JSON matching this exact schema:
{
  "skills": string[],
  "experience": [
    {
      "company": string,
      "title": string,
      "startDate": string,  // YYYY-MM or YYYY format
      "endDate": string | null,  // null if current position
      "description": string | null
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "field": string | null,
      "graduationDate": string | null  // YYYY-MM or YYYY format
    }
  ],
  "contact": {
    "email": string | null,
    "phone": string | null,
    "linkedin": string | null
  } | null,
  "summary": string | null
}

Rules:
- Extract ALL skills mentioned (technical, soft skills, tools, languages)
- List experiences in chronological order (most recent first)
- If dates are ranges, use startDate and endDate
- Set endDate to null for current positions
- Extract contact info if present
- Create a brief professional summary (2-3 sentences) if objective/summary exists
- Return valid JSON only, no markdown formatting`;

/**
 * Parse resume text using Claude AI
 */
export async function parseResumeText(input: {
  text: string;
  userId: string;
}): Promise<ParsedResume> {
  const { text, userId } = input;

  try {
    const anthropic = getAnthropicService();

    // Call Claude with prompt caching enabled
    const response = await anthropic.createMessage(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: RESUME_PARSING_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }, // Cache this prompt for 5 minutes
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Parse this resume:\n\n${text}`,
          },
        ],
      },
      userId,
      'resume_parse'
    );

    // Extract JSON from response
    const contentBlock = response.content[0];
    if (!contentBlock || contentBlock.type !== 'text') {
      throw new ResumeParseError('Expected text response from Claude');
    }

    const responseText = contentBlock.text.trim();

    // Try to parse JSON
    let parsedData: ParsedResume;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      throw new ResumeParseError(
        'Failed to parse Claude response as JSON',
        parseError
      );
    }

    // Validate required fields
    if (!parsedData.skills || !Array.isArray(parsedData.skills)) {
      throw new ResumeParseError('Invalid parsed data: missing skills array');
    }

    if (!parsedData.experience || !Array.isArray(parsedData.experience)) {
      throw new ResumeParseError(
        'Invalid parsed data: missing experience array'
      );
    }

    if (!parsedData.education || !Array.isArray(parsedData.education)) {
      throw new ResumeParseError('Invalid parsed data: missing education array');
    }

    return parsedData;
  } catch (error) {
    if (error instanceof ResumeParseError) {
      throw error;
    }

    throw new ResumeParseError(
      `Resume parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}
