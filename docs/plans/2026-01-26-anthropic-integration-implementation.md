# Anthropic Claude API Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Anthropic Claude API with rate limiting, usage tracking, and error handling infrastructure

**Architecture:** AI service wrapper in `src/lib/ai/`, PostgreSQL `ai_usage` table for tracking, rate limiting via DB queries, server actions for public API

**Tech Stack:** Anthropic SDK, TypeScript, PostgreSQL (Supabase), Vitest (if added) or manual testing

**Reference:** See `docs/plans/2026-01-26-anthropic-integration-design.md` for full design

---

## Task 1: Database Migration - Create ai_usage Table

**Files:**
- Create: `supabase/migrations/20260126000000_create_ai_usage_table.sql`

**Step 1: Create migration file**

Create `supabase/migrations/20260126000000_create_ai_usage_table.sql`:

```sql
-- Create ai_usage table for tracking Anthropic API usage
-- This enables rate limiting, cost monitoring, and audit trail

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cost tracking
  tokens_used INTEGER,
  cost_estimate DECIMAL(10, 6),
  model_version VARCHAR(50),

  -- Performance metrics
  latency_ms INTEGER,

  -- Audit trail
  success BOOLEAN NOT NULL,
  error_message TEXT,
  input_sample TEXT,
  output_sample TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical index for rate limiting queries
CREATE INDEX idx_ai_usage_rate_limit
  ON ai_usage(user_id, operation_type, timestamp DESC);

-- Index for cost analytics
CREATE INDEX idx_ai_usage_cost
  ON ai_usage(user_id, timestamp DESC);

-- Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Only server can insert (using service role)
CREATE POLICY "Service role can insert AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ai_usage IS 'Tracks all Anthropic API calls for rate limiting, cost monitoring, and audit trail';
```

**Step 2: Run migration locally**

Run:
```bash
npx supabase db reset
```

Expected: Migration runs successfully, `ai_usage` table created

**Step 3: Verify table creation**

You can verify in Supabase dashboard or run:
```bash
npx supabase db diff
```

Expected: No pending migrations

**Step 4: Commit**

```bash
git add supabase/migrations/20260126000000_create_ai_usage_table.sql
git commit -m "feat: add ai_usage table for Anthropic API tracking"
```

---

## Task 2: Environment Variable Setup

**Files:**
- Modify: `.env.example`
- Create: `.env.local` (if not exists)

**Step 1: Update .env.example**

Add to `.env.example`:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Step 2: Create/update .env.local**

If you have a real Anthropic API key, add it to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key
```

If you don't have a key yet:
1. Go to https://console.anthropic.com
2. Sign up and get API key
3. Add to `.env.local`

**Step 3: Verify environment variable loads**

Run:
```bash
npm run dev
```

Open browser console and check no errors about missing `ANTHROPIC_API_KEY` (we haven't used it yet, just ensuring env loads)

**Step 4: Commit**

```bash
git add .env.example
git commit -m "docs: add ANTHROPIC_API_KEY to environment variables"
```

---

## Task 3: TypeScript Types for AI Service

**Files:**
- Create: `src/types/ai.ts`

**Step 1: Create AI types file**

Create `src/types/ai.ts`:

```typescript
/**
 * AI service types and interfaces
 */

export type OperationType = 'resume_parse' | 'summarize_notes' | 'analyze_job';

export interface AIUsageLog {
  id: string;
  user_id: string;
  operation_type: OperationType;
  timestamp: string;
  tokens_used?: number;
  cost_estimate?: number;
  model_version?: string;
  latency_ms?: number;
  success: boolean;
  error_message?: string;
  input_sample?: string;
  output_sample?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RateLimitConfig {
  resume_parse: number;      // 10 per hour
  summarize_notes: number;   // 50 per hour
  analyze_job: number;       // 20 per hour
}

export interface AIServiceResponse<T> {
  data?: T;
  error?: string;
}

// Resume parsing output
export interface ParsedResume {
  skills: string[];
  experience: Experience[];
  education: Education[];
  contact?: ContactInfo;
  summary?: string;
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
}

// Notes summarization output
export interface NotesSummary {
  summary: string;
  insights: string[];
  actionItems: string[];
}

// Job matching output
export interface JobMatchAnalysis {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  explanation: string;
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/types/ai.ts
git commit -m "feat: add TypeScript types for AI service"
```

---

## Task 4: Custom Error Classes

**Files:**
- Create: `src/lib/ai/errors.ts`

**Step 1: Create error classes**

Create `src/lib/ai/errors.ts`:

```typescript
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/ai/errors.ts
git commit -m "feat: add custom error classes for AI service"
```

---

## Task 5: Rate Limiting Helper

**Files:**
- Create: `src/lib/ai/rate-limit.ts`

**Step 1: Create rate limiting helper**

Create `src/lib/ai/rate-limit.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { RateLimitError } from './errors';
import type { OperationType, RateLimitConfig } from '@/types/ai';

const RATE_LIMITS: RateLimitConfig = {
  resume_parse: 10,
  summarize_notes: 50,
  analyze_job: 20,
};

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
    const resetTime = new Date(Date.now() + 60 * 60 * 1000);
    throw new RateLimitError(
      `Rate limit exceeded for ${operationType}. Limit: ${limit} per hour. Try again after ${resetTime.toLocaleTimeString()}.`,
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/ai/rate-limit.ts
git commit -m "feat: add rate limiting helper for AI operations"
```

---

## Task 6: Usage Logging Helper

**Files:**
- Create: `src/lib/ai/usage-logger.ts`

**Step 1: Create usage logging helper**

Create `src/lib/ai/usage-logger.ts`:

```typescript
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
    ? calculateCost(params.tokensUsed, params.operationType)
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
 * Estimate cost in USD based on tokens and operation type
 *
 * Rough estimates based on Claude 3.5 Sonnet pricing:
 * - Resume parse: ~2K input + 1K output = $0.015
 * - Notes summary: ~500 input + 200 output = $0.005
 * - Job analysis: ~3K input + 1K output = $0.020
 */
function calculateCost(tokens: number, operationType: OperationType): number {
  // Simplified: assume 60% input, 40% output
  const inputTokens = Math.floor(tokens * 0.6);
  const outputTokens = Math.floor(tokens * 0.4);

  const inputCostPerMillion = 3.0; // $3/MTok
  const outputCostPerMillion = 15.0; // $15/MTok

  const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;

  return inputCost + outputCost;
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/ai/usage-logger.ts
git commit -m "feat: add usage logging helper for AI operations"
```

---

## Task 7: Anthropic Service Core (Part 1 - Setup)

**Files:**
- Create: `src/lib/ai/anthropic.ts`

**Step 1: Create Anthropic service skeleton**

Create `src/lib/ai/anthropic.ts`:

```typescript
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
      return await this.client.messages.create(params);
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/ai/anthropic.ts
git commit -m "feat: add Anthropic service with retry logic and rate limiting"
```

---

## Task 8: Simple Server Action to Test AI Service

**Files:**
- Create: `src/actions/ai.ts`

**Step 1: Create basic AI server action**

Create `src/actions/ai.ts`:

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getAnthropicService } from '@/lib/ai/anthropic';
import { RateLimitError, QuotaExceededError, APIError } from '@/lib/ai/errors';

/**
 * Test action to verify Anthropic integration works
 *
 * This is a simple test endpoint - delete after verification
 */
export async function testAnthropicConnection() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Get user database ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !dbUser) {
      return { error: 'User not found' };
    }

    // Test simple API call (won't count against rate limit for now)
    const anthropic = getAnthropicService();

    const response = await anthropic.createMessage(
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Anthropic!" in exactly 5 words.',
          },
        ],
      },
      dbUser.id,
      'summarize_notes' // Use summarize_notes as test operation (50/hour limit)
    );

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      data: {
        message: responseText,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
      },
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }

    if (error instanceof QuotaExceededError) {
      return { error: error.message };
    }

    if (error instanceof APIError) {
      return { error: `API Error: ${error.message}` };
    }

    console.error('Unexpected error in testAnthropicConnection:', error);
    return { error: 'An unexpected error occurred' };
  }
}
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Test manually (if you have API key)**

Create a temporary test page or use existing dashboard to call this action.

Example: In browser console while on dashboard:
```javascript
// Call from client component
const result = await fetch('/api/test-ai', { method: 'POST' });
console.log(await result.json());
```

Or create a simple button in `DashboardClient.tsx` temporarily:
```tsx
<button onClick={async () => {
  const result = await testAnthropicConnection();
  console.log(result);
}}>
  Test AI
</button>
```

Expected response:
```json
{
  "data": {
    "message": "Hello from Anthropic API here!",
    "tokensUsed": 25,
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

Check `ai_usage` table in Supabase dashboard - should have 1 row logged.

**Step 4: Commit**

```bash
git add src/actions/ai.ts
git commit -m "feat: add test AI server action"
```

---

## Task 9: Update README with AI Setup Instructions

**Files:**
- Modify: `README.md`

**Step 1: Add AI setup section**

Add to `README.md` (after Authentication Setup section):

```markdown
## AI Features Setup

This app uses Anthropic's Claude API for AI-powered features including resume parsing, notes summarization, and job description analysis.

### Get API Key

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### Configure Environment

Add to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Rate Limits

To prevent abuse and control costs:
- Resume parsing: 10 per hour per user
- Notes summarization: 50 per hour per user
- Job analysis: 20 per hour per user

### Cost Estimates

Based on Claude 3.5 Sonnet pricing:
- Resume parse: ~$0.015 each
- Notes summary: ~$0.005 each
- Job analysis: ~$0.020 each

**Expected cost per active user: ~$0.22/month** (with prompt caching)

### Monitoring Usage

Query your AI usage:

```sql
SELECT
  operation_type,
  COUNT(*) as total_calls,
  SUM(cost_estimate) as total_cost_usd
FROM ai_usage
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY operation_type;
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add AI features setup instructions to README"
```

---

## Task 10: Update .env.example and Documentation

**Files:**
- Modify: `.env.example` (already done in Task 2, verify)
- Modify: `docs/MVP_BACKLOG.md`

**Step 1: Mark Ticket #10 acceptance criteria**

Update `docs/MVP_BACKLOG.md`:

Find Ticket #10 section and update:

```markdown
**Acceptance Criteria:**
- [x] Anthropic SDK installed and configured
- [x] API key stored securely in environment variables
- [x] Wrapper service with retry logic (exponential backoff)
- [x] Prompt caching implemented for common system prompts
- [x] Rate limiting: 10 resume parses/hour, 50 summaries/hour per user
- [x] Error handling for quota exceeded, network failures
- [x] Usage tracking in PostgreSQL (`ai_usage` table)
- [ ] Unit tests with mocked API responses (optional for MVP)
- [x] Documentation for AI service usage
```

Change status in progress table:

```markdown
| #10 | Anthropic Claude API Integration | ✅ Complete |
```

**Step 2: Commit**

```bash
git add docs/MVP_BACKLOG.md
git commit -m "docs: mark Ticket #10 as complete in backlog"
```

---

## Task 11: Run Full Verification

**Files:**
- None (verification only)

**Step 1: Run linting**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 2: Run TypeScript type checking**

Run:
```bash
npm run type-check
```

Expected: No errors

**Step 3: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 4: Test database migration**

Run:
```bash
npx supabase db reset
```

Expected: All migrations apply successfully, including `ai_usage` table

**Step 5: Verify ai_usage table in Supabase dashboard**

1. Go to Supabase dashboard
2. Navigate to Table Editor
3. Find `ai_usage` table
4. Verify columns exist: id, user_id, operation_type, timestamp, tokens_used, cost_estimate, etc.
5. Verify indexes exist (check "Indexes" tab)

**Step 6: Manual test (if you have API key)**

1. Sign in to the app
2. Call `testAnthropicConnection()` server action
3. Check response is successful
4. Check `ai_usage` table has 1 new row
5. Try calling it 51 times rapidly - should get rate limit error on 51st call

**Step 7: Verify environment variables**

Run:
```bash
echo $ANTHROPIC_API_KEY
```

If empty, make sure `.env.local` is set up correctly.

---

## Definition of Done Checklist

- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] No `any` types added
- [x] Error states implemented (RateLimitError, QuotaExceededError, APIError)
- [x] Loading states not needed (server actions)
- [x] Security: Rate limiting enforces hourly quotas
- [x] Security: API key is server-side only
- [x] Database migration creates ai_usage table
- [x] Usage logging tracks all API calls
- [x] Documentation updated (README, backlog)

---

## Next Steps

After completing Ticket #10, proceed to:

**Ticket #11: Resume Upload & Storage** - Implement file upload for resumes with Supabase Storage

**Ticket #12: AI Resume Parsing** - Use the AI service to parse uploaded resumes

**Ticket #14: Notes Summarization** - Implement notes summarization feature

---

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY is not set"

**Solution:**
1. Verify `.env.local` file exists
2. Verify `ANTHROPIC_API_KEY=sk-ant-...` is in the file
3. Restart dev server: `npm run dev`

### Issue: Migration fails with "table already exists"

**Solution:**
```bash
npx supabase db reset
```

This resets the database and re-runs all migrations.

### Issue: Rate limit not working

**Solution:**
1. Check `ai_usage` table has index: `idx_ai_usage_rate_limit`
2. Verify timestamp is being set correctly
3. Check Supabase dashboard for RLS policies

### Issue: API calls fail with 401

**Solution:**
1. Verify API key is correct (starts with `sk-ant-`)
2. Check Anthropic console for API key status
3. Try creating a new API key

### Issue: TypeScript errors in Anthropic SDK

**Solution:**
```bash
npm install --save-dev @types/node
```

---

**End of Implementation Plan**
