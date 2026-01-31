/**
 * Notes Summarizer - AI service for generating summaries from application notes
 *
 * Ticket #14: Notes Summarization
 *
 * Features:
 * - Uses Claude Haiku for cost efficiency (~$0.0001 per summary with caching)
 * - System prompt caching for 90% token reduction
 * - Structured JSON output with insights, actions, follow-ups
 * - Handles edge cases: empty notes, invalid JSON, character limits
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicService } from './anthropic';
import { checkRateLimit } from './rate-limit';
import { logUsage } from './usage-logger';
import { RateLimitError, APIError } from './errors';
import type { NotesSummary } from '@/types/ai';
import type { ApplicationNote } from '@/types/application';

const MAX_NOTES_CHARS = 5000; // Maximum characters for notes input
const MAX_NOTE_LENGTH = 2000; // Maximum length per individual note

/**
 * System prompt for notes summarization with cache control
 * Cached to save ~90% of tokens on repeated calls
 */
const NOTES_SUMMARY_SYSTEM_PROMPT = `You are an expert career advisor analyzing notes from a job application.

Your task:
1. Read all notes chronologically (newest first)
2. Identify key themes and patterns
3. Extract actionable insights
4. Recommend concrete next steps

Focus on:
- Interview feedback and hiring manager comments
- Technical requirements or skill gaps mentioned
- Timeline information (deadlines, follow-up dates)
- Cultural fit observations
- Red flags or concerns
- Outstanding questions or action items
- Contact information and networking opportunities

Return ONLY valid JSON matching this EXACT schema (no markdown, no explanations):
{
  "summary": "2-3 sentence overview of the application status and key developments",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "actionItems": ["action 1", "action 2", "action 3"],
  "followUpNeeds": ["follow-up 1", "follow-up 2"]
}

Guidelines:
- summary: Concise overview (2-3 sentences max)
- insights: 3-5 key findings or observations
- actionItems: 3-5 specific tasks the user should complete
- followUpNeeds: 2-3 people to contact, deadlines, or time-sensitive items
- Use active voice and be specific
- Prioritize recent information over older notes`;

/**
 * Sanitize note content to prevent prompt injection and limit length
 */
function sanitizeNote(content: string): string {
  return content
    // Remove potential prompt injection patterns
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    // Limit length per note
    .substring(0, MAX_NOTE_LENGTH)
    .trim();
}

/**
 * Format notes for Claude input
 */
function formatNotesForPrompt(
  notes: ApplicationNote[],
  company: string,
  position: string,
  status: string
): { notesText: string; truncated: boolean } {
  // Sort by created_at descending (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let notesText = '';
  let truncated = false;
  let includedCount = 0;

  // Build notes text, stopping if we exceed character limit
  for (const note of sortedNotes) {
    const sanitizedContent = sanitizeNote(note.content);
    const noteDate = new Date(note.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const noteEntry = `[${noteDate}] ${sanitizedContent}\n\n`;

    // Check if adding this note would exceed limit
    if (notesText.length + noteEntry.length > MAX_NOTES_CHARS) {
      truncated = true;
      break;
    }

    notesText += noteEntry;
    includedCount++;
  }

  // Construct user message
  const userMessage = `JOB APPLICATION: ${company} - ${position}
STATUS: ${status}

NOTES (${includedCount} total${truncated ? `, showing most recent` : ''}, newest first):

${notesText.trim()}

Analyze these notes and provide a structured summary following the JSON schema.`;

  return { notesText: userMessage, truncated };
}

/**
 * Parse and validate Claude's JSON response
 */
function parseAndValidateResponse(content: string): NotesSummary {
  // Remove markdown code blocks if present
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
  }

  try {
    const parsed = JSON.parse(cleanedContent);

    // Validate required fields
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Missing or invalid summary field');
    }
    if (!Array.isArray(parsed.insights)) {
      throw new Error('Missing or invalid insights field');
    }
    if (!Array.isArray(parsed.actionItems)) {
      throw new Error('Missing or invalid actionItems field');
    }
    if (!Array.isArray(parsed.followUpNeeds)) {
      throw new Error('Missing or invalid followUpNeeds field');
    }

    return {
      summary: parsed.summary.substring(0, 500), // Limit summary length
      insights: parsed.insights.slice(0, 5), // Max 5 insights
      actionItems: parsed.actionItems.slice(0, 5), // Max 5 actions
      followUpNeeds: parsed.followUpNeeds.slice(0, 3), // Max 3 follow-ups
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
 * Summarize application notes using Claude AI
 *
 * @param notes - Array of application notes to summarize
 * @param application - Application details for context
 * @param userId - User ID for rate limiting and usage tracking
 * @returns NotesSummary with insights, actions, and follow-ups
 * @throws RateLimitError if rate limit exceeded
 * @throws APIError if Claude API fails
 */
export async function summarizeApplicationNotes(
  notes: ApplicationNote[],
  application: { company: string; position: string; status: string },
  userId: string
): Promise<{ summary: NotesSummary; truncated: boolean }> {
  const startTime = Date.now();

  // Validate inputs
  if (!notes || notes.length === 0) {
    throw new APIError('No notes to summarize', 400);
  }

  // Check rate limit (50 summaries per hour)
  await checkRateLimit(userId, 'summarize_notes');

  // Format notes for prompt
  const { notesText, truncated } = formatNotesForPrompt(
    notes,
    application.company,
    application.position,
    application.status
  );

  try {
    // Get Anthropic service
    const anthropic = await getAnthropicService();

    // Create message with Claude
    const message = await anthropic.createMessage(
      {
        model: 'claude-3-haiku-20240307', // Cost-efficient model
        max_tokens: 1024,
        temperature: 0.3, // Lower temperature for more consistent output
        system: [
          {
            type: 'text',
            text: NOTES_SUMMARY_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }, // Cache system prompt
          },
        ],
        messages: [
          {
            role: 'user',
            content: notesText,
          },
        ],
      },
      userId,
      'summarize_notes'
    );

    // Extract text content
    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new APIError('Unexpected response type from Claude', 500);
    }

    // Parse and validate response
    const summary = parseAndValidateResponse(content.text);

    // Log successful usage
    const latencyMs = Date.now() - startTime;
    await logUsage({
      userId,
      operationType: 'summarize_notes',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      modelVersion: 'claude-3-haiku-20240307',
      latencyMs,
      success: true,
      inputSample: notesText.substring(0, 500),
      outputSample: content.text.substring(0, 500),
      metadata: {
        notesCount: notes.length,
        truncated,
        company: application.company,
        position: application.position,
      },
    });

    return { summary, truncated };
  } catch (error) {
    // Log failed usage
    const latencyMs = Date.now() - startTime;
    await logUsage({
      userId,
      operationType: 'summarize_notes',
      tokensUsed: 0,
      modelVersion: 'claude-3-haiku-20240307',
      latencyMs,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      inputSample: notesText.substring(0, 500),
      metadata: {
        notesCount: notes.length,
        truncated,
      },
    });

    // Re-throw specific errors
    if (error instanceof RateLimitError || error instanceof APIError) {
      throw error;
    }

    // Wrap unknown errors
    throw new APIError(
      'Failed to generate notes summary. Please try again.',
      500,
      error
    );
  }
}
