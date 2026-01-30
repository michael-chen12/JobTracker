import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicService } from './anthropic';
import { APIError } from './errors';

export interface ScrapingResult {
  description: string;
  source: 'scraped' | 'failed' | 'unsupported';
  error?: string;
}

const BLOCKED_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
];

const EXTRACT_JOB_SYSTEM_PROMPT = `Extract the job description from this webpage text.

Focus on:
- Job title and company
- Job requirements (required skills, years of experience, education)
- Responsibilities and duties
- Qualifications and preferred skills
- Company description (brief)

Ignore:
- Navigation menus, footers, ads
- Application instructions
- Other job listings on the page
- Legal disclaimers

Return only the cleaned job description text (max 2000 words).`;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function shouldRetryResponse(response: Response): boolean {
  return RETRYABLE_STATUS.has(response.status);
}

function shouldRetryError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  // Network or transient errors
  if (error.name === 'AbortError') {
    return true;
  }

  return error.message.toLowerCase().includes('fetch');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtmlTags(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract job description from HTML text using Claude
 */
async function extractJobDescriptionWithClaude(
  htmlText: string,
  userId: string
): Promise<string> {
  const anthropic = getAnthropicService();

  const response = await anthropic.createMessage(
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: EXTRACT_JOB_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: htmlText,
        },
      ],
    },
    userId,
    'job_analysis' // Use job_analysis operation type
  );

  const firstContent = response.content[0];
  if (!firstContent || firstContent.type !== 'text') {
    throw new APIError('Failed to extract job description', 500);
  }

  return firstContent.text;
}

/**
 * Fetch job description from URL
 *
 * Strategy:
 * 1. Check if URL is from a blocked domain (LinkedIn, Indeed, etc.)
 * 2. Try simple HTTP fetch with timeout
 * 3. Use Claude to extract the job description from HTML
 * 4. Return graceful error if fails
 *
 * @param jobUrl - URL of the job posting
 * @param userId - Database user ID for API tracking
 * @returns Job description text or error information
 */
export async function fetchJobDescription(
  jobUrl: string,
  userId: string
): Promise<ScrapingResult> {
  try {
    // 1. Parse and check domain
    const url = new URL(jobUrl);
    const domain = url.hostname.toLowerCase();

    // Check if domain is blocked
    const isBlocked = BLOCKED_DOMAINS.some((blocked) =>
      domain.includes(blocked)
    );

    if (isBlocked) {
      return {
        description: '',
        source: 'unsupported',
        error:
          'This job board requires manual copy-paste. Please add the job description in the field below.',
      };
    }

    // 2. Try to fetch HTML with timeout and retry
    let response: Response | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        response = await fetch(jobUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; JobTrackerBot/1.0; +https://jobtracker.app)',
          },
          signal: controller.signal,
        });

        if (!response.ok && shouldRetryResponse(response) && attempt < 2) {
          await sleep(500 * attempt);
          continue;
        }

        break;
      } catch (error) {
        lastError = error;

        if (shouldRetryError(error) && attempt < 2) {
          await sleep(500 * attempt);
          continue;
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!response) {
      throw lastError ?? new Error('Failed to fetch job description');
    }

    if (!response.ok) {
      return {
        description: '',
        source: 'failed',
        error: `Failed to fetch job page (HTTP ${response.status}). Please paste the description manually.`,
      };
    }

    const html = await response.text();

    // 3. Quick sanity check - did we get blocked?
    const lowerHtml = html.toLowerCase();
    if (
      lowerHtml.includes('captcha') ||
      lowerHtml.includes('access denied') ||
      lowerHtml.includes('please verify') ||
      html.length < 500
    ) {
      return {
        description: '',
        source: 'failed',
        error:
          "Couldn't auto-fetch job description (access blocked). Please paste it manually.",
      };
    }

    // 4. Strip HTML tags, keep text
    const cleanedText = stripHtmlTags(html).slice(0, 15000);

    // 5. Let Claude extract the job description
    const jobDescription = await extractJobDescriptionWithClaude(
      cleanedText,
      userId
    );

    return {
      description: jobDescription,
      source: 'scraped',
    };
  } catch (error) {
    // Handle timeout/abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        description: '',
        source: 'failed',
        error: 'Request timed out. Please paste the job description manually.',
      };
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        description: '',
        source: 'failed',
        error: 'Network error. Please check your connection or paste manually.',
      };
    }

    // Handle invalid URL
    if (error instanceof TypeError && error.message.includes('URL')) {
      return {
        description: '',
        source: 'failed',
        error: 'Invalid job URL. Please check the URL or paste manually.',
      };
    }

    // API errors from Claude
    if (error instanceof APIError) {
      return {
        description: '',
        source: 'failed',
        error: 'Failed to extract job description. Please paste manually.',
      };
    }

    // Generic error
    console.error('Unexpected error in fetchJobDescription:', error);
    return {
      description: '',
      source: 'failed',
      error: 'Unexpected error occurred. Please paste the description manually.',
    };
  }
}
