/**
 * Follow-Up Generator - AI service for generating follow-up suggestions
 *
 * Ticket #15: Follow-Up Suggestions
 *
 * Features:
 * - Uses Claude Haiku for cost efficiency (~$0.0001-0.0002 per generation with caching)
 * - System prompt caching for 90% token reduction
 * - Structured JSON output with action, timing, priority, rationale, templates
 * - Time-based context (days since applied) for smart suggestions
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicService } from './anthropic';
import { checkRateLimit } from './rate-limit';
import { logUsage } from './usage-logger';
import { RateLimitError, APIError } from './errors';
import type { FollowUpSuggestions, FollowUpSuggestion } from '@/types/ai';

const MAX_CONTEXT_CHARS = 3000; // Maximum characters for context input

/**
 * System prompt for follow-up generation with cache control
 * Cached to save ~90% of tokens on repeated calls
 */
const FOLLOWUP_SYSTEM_PROMPT = `You are an expert career advisor generating follow-up suggestions for job applications.

Your task:
1. Analyze the application context (company, position, status, time elapsed)
2. Consider professional norms and timing etiquette
3. Recommend 2-4 specific, actionable follow-up steps
4. Prioritize based on urgency and impact

Prioritization guidelines:
- HIGH priority: >14 days no response, interview follow-up overdue, deadline approaching
- MEDIUM priority: 7-14 days no response, status change requires acknowledgment
- LOW priority: Routine check-ins, networking maintenance, <7 days since last action

Return ONLY valid JSON matching this EXACT schema (no markdown, no explanations):
{
  "suggestions": [
    {
      "action": "Specific action to take (e.g., 'Send follow-up email to recruiter')",
      "timing": "When to do it (e.g., 'Within 2-3 days', 'Today', 'This week')",
      "priority": "high|medium|low",
      "rationale": "Why this action matters (1-2 sentences)",
      "template": "Optional professional message template the user can customize",
      "type": "email|call|linkedin|application_check"  // REQUIRED: must be one of these exact values
    }
  ],
  "contextSummary": "1-2 sentence summary of current application situation"
}

Note: You may omit the "nextCheckDate" field - it will be calculated automatically based on the suggestions.

Formatting rules:
- Use standard JSON string escaping for any line breaks inside strings (e.g., use \\n for new lines in templates)
- Do not include raw line breaks inside JSON string values

IMPORTANT: Every suggestion MUST include the "type" field with one of these exact values:
- "email" for email follow-ups
- "call" for phone calls
- "linkedin" for LinkedIn messages
- "application_check" for checking application status

Guidelines:
- Provide 2-4 suggestions (prioritize quality over quantity)
- Be specific and actionable (not vague advice)
- Templates should be professional, concise, and customizable
- Consider company size, industry norms, application stage
- Balance persistence with professionalism
- Timing should be realistic and considerate`;

/**
 * Calculate days since a given date
 */
export function calculateDaysSince(date: string | Date | null | undefined): number {
  if (!date) return 0;

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Sanitize input to prevent prompt injection
 */
function sanitizeInput(text: string): string {
  return text
    // Remove potential prompt injection patterns
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/disregard above/gi, '')
    // Limit length
    .substring(0, MAX_CONTEXT_CHARS)
    .trim();
}

/**
 * Format application data for prompt
 */
function formatApplicationContext(application: {
  company: string;
  position: string;
  status: string;
  applied_date?: string | null;
  notes_summary?: string | null;
}): string {
  const daysSinceApplied = calculateDaysSince(application.applied_date);

  const context = `JOB APPLICATION:
Company: ${sanitizeInput(application.company)}
Position: ${sanitizeInput(application.position)}
Status: ${sanitizeInput(application.status)}
Days Since Applied: ${daysSinceApplied}

${application.notes_summary ? `NOTES SUMMARY:\n${sanitizeInput(application.notes_summary)}\n` : ''}
Provide follow-up suggestions based on this context.`;

  return context;
}

/**
 * Parse and validate Claude's JSON response
 */
function parseAndValidateResponse(content: string): FollowUpSuggestions {
  const stripCodeFences = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
      cleaned = cleaned.replace(/```\s*$/i, '');
    }
    return cleaned.trim();
  };

  const extractJsonObject = (text: string) => {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    return text.slice(firstBrace, lastBrace + 1);
  };

  const escapeUnescapedControlChars = (text: string) => {
    let inString = false;
    let isEscaped = false;
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (!char) continue; // TypeScript safety check

      if (inString) {
        if (isEscaped) {
          result += char;
          isEscaped = false;
          continue;
        }

        if (char === '\\') {
          result += char;
          isEscaped = true;
          continue;
        }

        if (char === '"') {
          inString = false;
          result += char;
          continue;
        }

        if (char === '\n') {
          result += '\\n';
          continue;
        }
        if (char === '\r') {
          result += '\\r';
          continue;
        }
        if (char === '\t') {
          result += '\\t';
          continue;
        }
        if (char === '\b') {
          result += '\\b';
          continue;
        }
        if (char === '\f') {
          result += '\\f';
          continue;
        }

        const code = char.charCodeAt(0);
        if (code >= 0 && code < 0x20) {
          result += `\\u${code.toString(16).padStart(4, '0')}`;
          continue;
        }

        result += char;
        continue;
      }

      if (char === '"') {
        inString = true;
      }

      result += char;
    }

    return result;
  };

  const tryParse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const cleanedContent = stripCodeFences(content);
  const extractedContent = extractJsonObject(cleanedContent);

  const parsed =
    tryParse(cleanedContent) ||
    tryParse(escapeUnescapedControlChars(cleanedContent)) ||
    (extractedContent
      ? tryParse(extractedContent) || tryParse(escapeUnescapedControlChars(extractedContent))
      : null);

  try {
    if (!parsed) {
      throw new Error('Invalid JSON response');
    }

    // Validate required fields
    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      throw new Error('Missing or invalid suggestions array');
    }

    if (!parsed.contextSummary || typeof parsed.contextSummary !== 'string') {
      throw new Error('Missing or invalid contextSummary field');
    }

    // Helper to infer type from action text if missing
    const inferType = (suggestion: any): FollowUpSuggestion['type'] => {
      if (suggestion.type && ['email', 'call', 'linkedin', 'application_check'].includes(suggestion.type)) {
        return suggestion.type;
      }

      // Infer from action text
      const actionLower = suggestion.action.toLowerCase();
      if (actionLower.includes('email') || actionLower.includes('send') || actionLower.includes('write')) {
        return 'email';
      }
      if (actionLower.includes('call') || actionLower.includes('phone')) {
        return 'call';
      }
      if (actionLower.includes('linkedin') || actionLower.includes('connect')) {
        return 'linkedin';
      }
      if (actionLower.includes('check') || actionLower.includes('portal') || actionLower.includes('status')) {
        return 'application_check';
      }

      // Default to email if uncertain
      return 'email';
    };

    // Validate each suggestion
    const validSuggestions: FollowUpSuggestion[] = parsed.suggestions
      .slice(0, 4) // Max 4 suggestions
      .map((suggestion: any) => {
        if (!suggestion.action || typeof suggestion.action !== 'string') {
          throw new Error('Invalid suggestion: missing action');
        }
        if (!suggestion.timing || typeof suggestion.timing !== 'string') {
          throw new Error('Invalid suggestion: missing timing');
        }
        if (!['high', 'medium', 'low'].includes(suggestion.priority)) {
          throw new Error('Invalid suggestion: priority must be high, medium, or low');
        }
        if (!suggestion.rationale || typeof suggestion.rationale !== 'string') {
          throw new Error('Invalid suggestion: missing rationale');
        }

        const inferredType = inferType(suggestion);

        return {
          action: suggestion.action.substring(0, 200),
          timing: suggestion.timing.substring(0, 100),
          priority: suggestion.priority,
          rationale: suggestion.rationale.substring(0, 500),
          template: suggestion.template ? suggestion.template.substring(0, 1000) : undefined,
          type: inferredType,
        };
      });

    // Ensure we have at least 2 suggestions
    if (validSuggestions.length < 2) {
      throw new Error('Must provide at least 2 suggestions');
    }

    // Validate nextCheckDate is in the future, otherwise calculate a default
    let nextCheckDate: string | undefined;
    if (parsed.nextCheckDate) {
      const checkDate = new Date(parsed.nextCheckDate);
      const now = new Date();
      // Only use the AI's date if it's in the future
      if (checkDate > now) {
        nextCheckDate = parsed.nextCheckDate;
      }
    }

    // If no valid nextCheckDate, calculate one based on suggestions (7 days from now as default)
    if (!nextCheckDate) {
      const defaultCheckDate = new Date();
      defaultCheckDate.setDate(defaultCheckDate.getDate() + 7);
      nextCheckDate = defaultCheckDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    return {
      suggestions: validSuggestions,
      contextSummary: parsed.contextSummary.substring(0, 300),
      nextCheckDate,
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    console.error('Raw content:', content);
    throw new APIError(
      'Failed to parse AI response. Please try again.',
      500,
      error
    );
  }
}

/**
 * Generate follow-up suggestions using Claude AI
 *
 * @param application - Application details for context
 * @param userId - User ID for rate limiting and usage tracking
 * @returns FollowUpSuggestions with action items, priorities, templates
 * @throws RateLimitError if rate limit exceeded
 * @throws APIError if Claude API fails
 */
export async function generateFollowUpSuggestions(
  application: {
    company: string;
    position: string;
    status: string;
    applied_date?: string | null;
    notes_summary?: string | null;
  },
  userId: string
): Promise<FollowUpSuggestions> {
  const startTime = Date.now();

  // Validate inputs
  if (!application.company || !application.position || !application.status) {
    throw new APIError('Missing required application details', 400);
  }

  // Check rate limit (30 generations per hour)
  await checkRateLimit(userId, 'generate_followups');

  // Format application context for prompt
  const contextPrompt = formatApplicationContext(application);

  try {
    // Get Anthropic service
    const anthropic = await getAnthropicService();

    // Create message with Claude
    const message = await anthropic.createMessage(
      {
        model: 'claude-3-haiku-20240307', // Cost-efficient model
        max_tokens: 1500,
        temperature: 0.5, // Balanced creativity for suggestions
        system: [
          {
            type: 'text',
            text: FOLLOWUP_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }, // Cache system prompt
          },
        ],
        messages: [
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
      },
      userId,
      'generate_followups'
    );

    // Extract text content
    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new APIError('Unexpected response type from Claude', 500);
    }

    // Parse and validate response
    const suggestions = parseAndValidateResponse(content.text);

    // Log successful usage
    const latencyMs = Date.now() - startTime;
    await logUsage({
      userId,
      operationType: 'generate_followups',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      modelVersion: 'claude-3-haiku-20240307',
      latencyMs,
      success: true,
      inputSample: contextPrompt.substring(0, 500),
      outputSample: content.text.substring(0, 500),
      metadata: {
        company: application.company,
        position: application.position,
        status: application.status,
        daysSinceApplied: calculateDaysSince(application.applied_date),
        suggestionsCount: suggestions.suggestions.length,
      },
    });

    return suggestions;
  } catch (error) {
    // Log failed usage
    const latencyMs = Date.now() - startTime;
    await logUsage({
      userId,
      operationType: 'generate_followups',
      tokensUsed: 0,
      modelVersion: 'claude-3-haiku-20240307',
      latencyMs,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      inputSample: contextPrompt.substring(0, 500),
      metadata: {
        company: application.company,
        position: application.position,
      },
    });

    // Re-throw specific errors
    if (error instanceof RateLimitError || error instanceof APIError) {
      throw error;
    }

    // Wrap unknown errors
    throw new APIError(
      'Failed to generate follow-up suggestions. Please try again.',
      500,
      error
    );
  }
}
