# Anthropic Claude API Integration - Design Document

**Date:** 2026-01-26
**Ticket:** #10 - Anthropic Claude API Integration Setup
**Status:** Design Complete - Ready for Implementation

---

## Overview

This document outlines the design for integrating Anthropic's Claude API into the job application tracker. The integration provides AI-powered features including resume parsing, notes summarization, and job description analysis.

## Architecture

### Core Components

1. **AI Service Layer** (`src/lib/ai/anthropic.ts`)
   - Wrapper around `@anthropic-ai/sdk`
   - Handles initialization, retry logic, error handling
   - Implements rate limiting checks before API calls
   - Logs all usage to PostgreSQL

2. **PostgreSQL Tables**
   - `ai_usage`: Full audit trail of all AI operations
   - Stores: user_id, operation_type, tokens, cost, latency, success/failure, input/output samples

3. **Server Actions** (`src/actions/ai.ts`)
   - Public API for components to call AI features
   - Three main actions: `parseResume()`, `summarizeNotes()`, `analyzeJobMatch()`
   - Each action checks rate limits, calls AI service, logs usage

### Data Flow

```
Component → Server Action → Rate Limit Check → AI Service → Anthropic API
                ↓                                    ↓
            Log usage                           Track metrics
```

---

## Implementation Details

### 1. AI Service (`src/lib/ai/anthropic.ts`)

**Singleton Pattern:**

```typescript
class AnthropicService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async createMessage(params, operationType, userId) {
    // 1. Check rate limit (query ai_usage table)
    // 2. Call API with retry (3 attempts, exponential backoff)
    // 3. Log usage to database
    // 4. Return result or throw error
  }
}

export function getAnthropicService(): AnthropicService {
  // Return singleton instance
}
```

**Retry Logic:**
- 3 attempts with exponential backoff: 1s, 2s, 4s
- Retry on: Network errors, 500/502/503/504 status codes
- Don't retry: 401 (auth), 429 (rate limit), 400 (bad request)

**Prompt Caching:**
- Use Anthropic's native prompt caching
- Mark system prompts with `cache_control: { type: "ephemeral" }`
- Reduces cost by ~90% for repeated system prompts

**Error Types:**
```typescript
class RateLimitError extends Error {}      // User exceeded hourly quota
class QuotaExceededError extends Error {}  // Anthropic account quota hit
class APIError extends Error {}            // Other API failures
```

---

### 2. Database Schema

**Table: `ai_usage`**

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'resume_parse', 'summarize_notes', 'analyze_job'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cost tracking
  tokens_used INTEGER,
  cost_estimate DECIMAL(10, 6), -- USD estimate
  model_version VARCHAR(50), -- e.g., 'claude-3-5-sonnet-20241022'

  -- Performance metrics
  latency_ms INTEGER,

  -- Audit trail
  success BOOLEAN NOT NULL,
  error_message TEXT,
  input_sample TEXT, -- First 500 chars for debugging
  output_sample TEXT, -- First 500 chars for debugging
  metadata JSONB, -- Extra context (e.g., application_id, file_size)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical index for rate limiting queries
CREATE INDEX idx_ai_usage_rate_limit
  ON ai_usage(user_id, operation_type, timestamp DESC);

-- Index for cost analytics
CREATE INDEX idx_ai_usage_cost
  ON ai_usage(user_id, timestamp DESC);
```

**Rate Limiting Implementation:**

```typescript
async function checkRateLimit(
  userId: string,
  operationType: string
): Promise<boolean> {
  const limits = {
    'resume_parse': 10,      // per hour
    'summarize_notes': 50,   // per hour
    'analyze_job': 20        // per hour
  };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('operation_type', operationType)
    .gte('timestamp', oneHourAgo.toISOString());

  return count < limits[operationType];
}
```

---

### 3. Server Actions (`src/actions/ai.ts`)

**Pattern: Auth → Rate Limit → AI Call → Return**

```typescript
export async function parseResume(
  fileContent: string,
  fileName: string
) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 2. Get user DB ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) return { error: 'User not found' };

  // 3. Rate limit check
  const canProceed = await checkRateLimit(dbUser.id, 'resume_parse');
  if (!canProceed) {
    return {
      error: 'Rate limit exceeded. You can parse 10 resumes per hour. Try again later.'
    };
  }

  // 4. Call AI service
  try {
    const anthropic = getAnthropicService();
    const result = await anthropic.parseResume(fileContent, dbUser.id, {
      fileName,
      fileSize: fileContent.length
    });

    return { data: result };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    console.error('Resume parsing error:', error);
    return { error: 'Failed to parse resume. Please try again.' };
  }
}
```

**Three Main Actions (MVP Scope):**

1. **`parseResume(fileContent, fileName)`** - Ticket #12
   - Rate limit: 10/hour per user
   - Input: PDF/DOCX text content (max 100KB)
   - Output: `{ skills: string[], experience: Experience[], education: Education[] }`

2. **`summarizeNotes(applicationId)`** - Ticket #14
   - Rate limit: 50/hour per user
   - Input: All notes for an application (max 5000 chars)
   - Output: `{ summary: string, insights: string[], actionItems: string[] }`

3. **`analyzeJobMatch(applicationId, jobDescription)`** - Ticket #13
   - Rate limit: 20/hour per user
   - Input: Job description + user profile from DB
   - Output: `{ score: number, matchingSkills: string[], missingSkills: string[], explanation: string }`

---

## Testing Strategy

### Unit Tests

**File: `src/lib/ai/__tests__/anthropic.test.ts`**

```typescript
describe('AnthropicService', () => {
  it('should retry on network errors', async () => {
    // Mock network failure then success
    // Verify 2 attempts made
  });

  it('should not retry on 400 errors', async () => {
    // Mock 400 bad request
    // Verify only 1 attempt made
  });

  it('should apply prompt caching headers', async () => {
    // Verify cache_control in API call
  });

  it('should throw RateLimitError when user quota exceeded', async () => {
    // Mock rate limit check returning false
    // Verify error thrown
  });
});
```

**File: `src/actions/__tests__/ai.test.ts`**

```typescript
describe('AI Server Actions', () => {
  it('should reject unauthenticated requests', async () => {
    // Mock no user session
    const result = await parseResume('content', 'resume.pdf');
    expect(result.error).toBe('Unauthorized');
  });

  it('should enforce rate limits', async () => {
    // Mock 10 existing calls in past hour
    const result = await parseResume('content', 'resume.pdf');
    expect(result.error).toContain('Rate limit exceeded');
  });

  it('should log usage to database', async () => {
    // Call action
    // Verify ai_usage table has new row
  });
});
```

### Manual Testing Checklist

- [ ] Verify Anthropic API key works (test with simple prompt)
- [ ] Test rate limiting by making 11 resume parse requests in a row
- [ ] Check `ai_usage` table populates with correct data
- [ ] Verify error messages display properly in UI components
- [ ] Test retry logic by temporarily blocking network
- [ ] Verify prompt caching reduces cost (check Anthropic dashboard)

---

## Environment Variables

**Add to `.env.example`:**

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Security Notes:**
- API key is server-side only (never exposed to client)
- Stored in environment variables (not committed to git)
- For production, use Vercel environment variables or similar

---

## Cost Monitoring

**Monthly Cost Query:**

```sql
SELECT
  operation_type,
  COUNT(*) as total_calls,
  SUM(tokens_used) as total_tokens,
  SUM(cost_estimate) as total_cost_usd,
  AVG(latency_ms) as avg_latency_ms
FROM ai_usage
WHERE timestamp >= NOW() - INTERVAL '30 days'
  AND success = true
GROUP BY operation_type
ORDER BY total_cost_usd DESC;
```

**Per-User Usage:**

```sql
SELECT
  u.email,
  COUNT(*) as calls_last_30d,
  SUM(ai.cost_estimate) as cost_usd
FROM ai_usage ai
JOIN users u ON ai.user_id = u.id
WHERE ai.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY cost_usd DESC
LIMIT 10;
```

**Estimated Costs (based on Claude 3.5 Sonnet pricing):**

- Resume parsing: ~$0.015 per parse (2K input + 1K output tokens)
- Notes summarization: ~$0.005 per summary (500 input + 200 output tokens)
- Job analysis: ~$0.020 per analysis (3K input + 1K output tokens)

**Monthly estimates for active user:**
- 10 resume parses: $0.15
- 20 note summaries: $0.10
- 10 job analyses: $0.20
- **Total per active user: ~$0.45/month**

With prompt caching, reduce by ~50% → **~$0.22/month per active user**

---

## Documentation

### README Update

Add new section:

```markdown
## AI Features

This app uses Anthropic's Claude API for AI-powered features.

### Setup

1. Get API key from https://console.anthropic.com
2. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Run migrations to create `ai_usage` table

### Features

- **Resume Parsing**: Extract skills, experience, education from PDF/DOCX
- **Notes Summarization**: AI-generated summaries of application notes
- **Job Matching**: Analyze job descriptions against your profile

### Rate Limits

- Resume parsing: 10 per hour
- Notes summarization: 50 per hour
- Job analysis: 20 per hour
```

### Code Documentation

All public functions include JSDoc:

```typescript
/**
 * Parse a resume file and extract structured data
 *
 * @param fileContent - Text content of resume (PDF/DOCX extracted)
 * @param fileName - Original filename for logging
 * @returns Structured resume data or error
 *
 * @throws RateLimitError if user has exceeded 10 parses per hour
 * @throws APIError if Anthropic API fails
 *
 * @example
 * const result = await parseResume(pdfText, 'resume.pdf');
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data.skills);
 * }
 */
```

---

## Migration File

**File: `supabase/migrations/YYYYMMDDHHMMSS_create_ai_usage_table.sql`**

```sql
-- Create ai_usage table for tracking Anthropic API usage
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

-- Indexes
CREATE INDEX idx_ai_usage_rate_limit
  ON ai_usage(user_id, operation_type, timestamp DESC);

CREATE INDEX idx_ai_usage_cost
  ON ai_usage(user_id, timestamp DESC);

-- Row Level Security
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
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

---

## Implementation Checklist

### Phase 1: Infrastructure (Ticket #10)
- [ ] Create migration for `ai_usage` table
- [ ] Add `ANTHROPIC_API_KEY` to environment variables
- [ ] Implement `src/lib/ai/anthropic.ts` service
- [ ] Implement rate limiting helper
- [ ] Implement usage logging helper
- [ ] Add error classes
- [ ] Write unit tests for service
- [ ] Update README with AI setup instructions

### Phase 2: Resume Parsing (Ticket #12)
- [ ] Implement `parseResume()` server action
- [ ] Create resume parsing prompt template
- [ ] Add file upload component (PDF/DOCX)
- [ ] Display parsed data in profile page
- [ ] Write E2E test

### Phase 3: Notes Summarization (Ticket #14)
- [ ] Implement `summarizeNotes()` server action
- [ ] Create summarization prompt template
- [ ] Add "Summarize" button to application detail page
- [ ] Display summary with insights and action items
- [ ] Write E2E test

### Phase 4: Job Matching (Ticket #13)
- [ ] Implement `analyzeJobMatch()` server action
- [ ] Create job analysis prompt template
- [ ] Add "Analyze Job" button to application detail
- [ ] Display match score with visual indicator
- [ ] Show matching/missing skills
- [ ] Write E2E test

---

## Future Enhancements (Post-MVP)

1. **Batch Operations**: Process multiple resumes/summaries in one API call
2. **Background Jobs**: Use Supabase Edge Functions for long-running operations
3. **Advanced Caching**: Cache full responses in PostgreSQL with TTL
4. **User Quota Dashboard**: Show usage statistics in settings
5. **Custom Rate Limits**: Allow users to upgrade for higher limits
6. **Multi-Model Support**: Add GPT-4 or other models as fallback
7. **Streaming Responses**: Use Claude's streaming API for real-time feedback
8. **Cost Alerts**: Email users when approaching monthly budget

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API costs spiral out of control | High | Rate limiting, cost monitoring queries, alerts |
| Rate limiting too restrictive | Medium | Start conservative, gather user feedback, adjust limits |
| Anthropic API downtime | Medium | Retry logic, graceful degradation, clear error messages |
| Privacy concerns with audit trail | Medium | Truncate input/output samples, allow users to opt out |
| Database performance from logging | Low | Indexes on query columns, archive old data |

---

## Success Metrics

**MVP Success (Ticket #10):**
- [ ] All AI features work without errors
- [ ] Rate limiting prevents abuse
- [ ] Cost per active user stays under $1/month
- [ ] Average API latency under 3 seconds
- [ ] Zero API key leaks or security issues

**Long-term Success:**
- 70%+ users try at least one AI feature
- Resume parsing accuracy >85% (user feedback)
- Job match scores correlate with interview success
- AI features reduce time spent on manual tasks by 30%

---

## Appendix: Anthropic API Reference

**Models:**
- `claude-3-5-sonnet-20241022` (recommended): Best quality, $3/MTok input, $15/MTok output
- `claude-3-5-haiku-20241022` (fast/cheap): Good for summaries, $0.80/MTok input, $4/MTok output

**Prompt Caching:**
- First 1024 tokens of prompt can be cached
- Cache TTL: 5 minutes
- Write cost: 1.25x, Read cost: 0.1x (90% savings on cache hits)

**Rate Limits (default):**
- 50 requests/min
- 40,000 tokens/min input
- 8,000 tokens/min output

**Error Codes:**
- 400: Invalid request
- 401: Invalid API key
- 429: Rate limit exceeded
- 500/502/503/504: Server errors (retry)

---

**End of Design Document**
