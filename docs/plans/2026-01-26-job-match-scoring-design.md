# Job Description Analysis & Match Scoring - Design Document

**Date:** 2026-01-26
**Ticket:** #13
**Status:** Design Complete - Ready for Implementation

## Overview

Implement AI-powered job description analysis that compares job requirements against user's resume to generate a 0-100 match score with detailed insights. This helps users prioritize applications and identify skill gaps.

## Goals

- **Auto-analyze** job match on application creation (if URL/description exists)
- **Manual re-analyze** button for updates
- **Hybrid scoring**: Formula-based calculation (fast, predictable) + Claude contextual adjustment (nuanced, intelligent)
- **Cost-efficient**: ~$0.002 per analysis (~$0.0002 with prompt caching)
- **Mobile-first** UI with progressive disclosure
- **Rate limiting**: 10 analyses/hour (base tier, future monetization)

---

## Architecture

### Core Flow

```
User creates application with job_url or job_description
    ↓
Auto-trigger analysis (async background job)
    ↓
1. Extract job description
   - If job_url: Try HTML scraping → Claude extraction
   - If blocked/fails: Fall back to manual job_description field
   - If neither: Return error
    ↓
2. Fetch user's resume data
   - Skills from user_profiles.skills
   - Experience from user_experience table
   - Education from user_education table
    ↓
3. Calculate base match score (formula-based, no AI cost)
   - Skills: 40pts (% of required skills user has)
   - Experience: 30pts (years + relevance)
   - Education: 15pts (degree level match)
   - Other: 15pts (location, job type, salary)
    ↓
4. Claude contextual adjustment (±10 points)
   - Review base score + reasoning
   - Adjust for nuanced factors (career trajectory, transferable skills)
   - Generate detailed analysis with actionable insights
    ↓
5. Store results in database
   - applications.match_score (0-100)
   - applications.match_analysis (JSONB with full breakdown)
   - applications.analyzed_at (timestamp)
    ↓
6. Track AI usage
   - ai_usage table (user_id, operation_type, tokens, cost)
   - Rate limit enforcement
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| Job Scraper | `lib/ai/job-scraper.ts` | Fetch HTML, extract description with Claude |
| Match Scorer | `lib/ai/match-scorer.ts` | Calculate base score + Claude adjustment |
| Rate Limiter | `lib/ai/rate-limiter.ts` | Enforce 10/hour limit |
| Server Action | `actions/analyze-job.ts` | Orchestrate analysis flow |
| UI Badge | `components/applications/MatchScoreBadge.tsx` | Score display on cards |
| UI Details | `components/applications/MatchAnalysisCard.tsx` | Full analysis view |

---

## Scoring Algorithm

### Base Score Calculation (No AI Cost)

#### 1. Skills Match (40 points)

```typescript
// Extract required skills from job description (simple regex + keyword matching)
const requiredSkills = extractSkillsFromJobDescription(jobDescription);
const userSkills = userProfile.skills; // From parsed resume

// Fuzzy matching: "React" matches "React.js", "ReactJS"
const matchingSkills = requiredSkills.filter(skill =>
  userSkills.some(userSkill =>
    normalizeSkill(skill) === normalizeSkill(userSkill)
  )
);

const skillsScore = (matchingSkills.length / requiredSkills.length) * 40;
```

**Example:**
- Job requires: ["React", "TypeScript", "Node.js", "Kubernetes", "AWS"]
- User has: ["React", "TypeScript", "Node.js", "Python"]
- Matching: 3/5 = 60% → **24/40 points**

#### 2. Experience Match (30 points)

```typescript
// Required years from job description (e.g., "5+ years experience")
const requiredYears = extractRequiredYears(jobDescription); // 5

// Calculate user's experience
const userTotalYears = calculateTotalExperience(userExperience); // 7
const userRelevantYears = calculateRelevantExperience(
  userExperience,
  jobDescription // Match on similar titles/industries
); // 4

// Scoring logic:
// - Full points if relevant years >= required (30pts)
// - 20pts if total years >= required but relevant < required
// - Partial credit otherwise
// - Bonus: +5pts if exceeding by 2+ years
```

**Example:**
- Job requires: 5 years
- User has: 7 total, 4 relevant
- Score: 20 + 2 = **22/30 points**

#### 3. Education Match (15 points)

```typescript
// Extract degree requirement (Bachelor's, Master's, PhD, or none)
const requiredDegree = extractRequiredDegree(jobDescription);
const userHighestDegree = getHighestDegree(userEducation);

// Scoring:
// - Exact match or higher: 15 points
// - One level below: 10 points (Bachelor's when Master's required)
// - Two levels below: 5 points
// - No requirement: 15 points (everyone qualifies)
```

**Degree Hierarchy:**
- PhD (4)
- Master's (3)
- Bachelor's (2)
- Associate's (1)
- None (0)

#### 4. Other Factors (15 points)

```typescript
// Location preference (5 points)
const locationMatch = matchLocation(jobLocation, userPreferredLocations);
// Exact match: 5pts, Same city: 4pts, Remote: 5pts, No preference: 3pts

// Job type match (5 points) - remote/hybrid/onsite/contract
const jobTypeMatch = matchJobType(jobType, userPreferredJobTypes);
// Match: 5pts, Compatible: 3pts, Mismatch: 0pts

// Salary alignment (5 points)
const salaryMatch = matchSalaryExpectation(jobSalary, userExpectation);
// Within range: 5pts, Below: 2pts, Above: 4pts, Unknown: 3pts
```

**Total Base Score:** Sum of all components (0-100)

---

### Claude Contextual Adjustment (±10 points)

After calculating the base score, Claude reviews it and adjusts for nuanced factors:

**What Claude Considers:**
- Career trajectory alignment (upward progression, lateral move, step back)
- Transferable skills not captured by keyword matching
- Red flags (overqualified, underqualified, career gaps)
- Cultural fit indicators from job description
- Industry transitions (related vs. unrelated)

**Prompt Design:**

```typescript
const MATCH_ADJUSTMENT_SYSTEM_PROMPT = `You are a career advisor reviewing a job match analysis.

Your task:
1. Review the base match score and its breakdown
2. Identify contextual factors the formula couldn't capture
3. Adjust the score by -10 to +10 points (be conservative)
4. Provide detailed analysis with actionable insights

Return ONLY valid JSON matching this schema:
{
  "adjusted_score": number (0-100),
  "adjustment": number (-10 to +10),
  "reasoning": string,
  "matching_skills": string[],
  "missing_skills": string[],
  "strengths": string[],
  "concerns": string[],
  "recommendations": string[]
}`;

const userMessage = `
BASE MATCH SCORE: ${baseScore}/100

BREAKDOWN:
- Skills: ${skillsScore}/40 (${matchingSkills.length}/${requiredSkills.length} match)
- Experience: ${experienceScore}/30 (${userRelevantYears} years relevant)
- Education: ${educationScore}/15 (${userHighestDegree} vs ${requiredDegree} required)
- Other: ${otherScore}/15

USER PROFILE:
Skills: ${userProfile.skills.join(', ')}
Experience: ${formatExperience(userExperience)}
Education: ${formatEducation(userEducation)}

JOB REQUIREMENTS:
${jobDescription.slice(0, 3000)} // Limit for token efficiency

Analyze and adjust the score.
`;
```

**Cost Optimization:**
- Use **Claude 3 Haiku** (`claude-3-haiku-20240307`)
- Cache system prompt (5-min TTL) → 90% cost reduction
- Limit job description to 3000 chars
- **Estimated cost:** ~$0.002 per analysis (~$0.0002 with caching)

**Storage Format:**

```typescript
// applications.match_analysis (JSONB)
{
  base_score: 75,
  adjusted_score: 78,
  adjustment: +3,
  reasoning: "Strong technical skills compensate for slightly less experience. Demonstrates fast learning ability.",
  matching_skills: ["React", "TypeScript", "Node.js"],
  missing_skills: ["Kubernetes", "AWS"],
  strengths: [
    "Solid technical foundation in required stack",
    "Demonstrates continuous learning",
    "Relevant project experience"
  ],
  concerns: [
    "Limited cloud infrastructure experience",
    "No team leadership experience mentioned"
  ],
  recommendations: [
    "Highlight collaborative projects in cover letter",
    "Emphasize quick ramp-up in previous roles",
    "Consider taking AWS certification course"
  ]
}
```

---

## Job URL Scraping

### Strategy

Simple HTML fetch + Claude extraction (fallback to manual on failure)

**Realistic Expectations:**
- ✅ Works: Company career pages (Greenhouse, Lever, Workable), simple job boards
- ❌ Often blocked: LinkedIn, Indeed, Glassdoor (require login/JS rendering)

### Implementation

```typescript
// lib/ai/job-scraper.ts

interface ScrapingResult {
  description: string;
  source: 'scraped' | 'failed' | 'unsupported';
}

async function fetchJobDescription(jobUrl: string): Promise<ScrapingResult> {
  // 1. Check if URL is from known problematic domain
  const domain = new URL(jobUrl).hostname;
  const blockedDomains = ['linkedin.com', 'indeed.com', 'glassdoor.com'];

  if (blockedDomains.some(d => domain.includes(d))) {
    return {
      description: '',
      source: 'unsupported',
    };
  }

  // 2. Try simple fetch with timeout and retry
  try {
    const response = await fetch(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobTrackerBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return { description: '', source: 'failed' };
    }

    const html = await response.text();

    // 3. Quick sanity check - did we get blocked?
    if (html.includes('captcha') || html.includes('Access Denied') || html.length < 500) {
      return { description: '', source: 'failed' };
    }

    // 4. Strip HTML tags, keep text
    const cleanedText = stripHtmlTags(html).slice(0, 15000);

    // 5. Let Claude extract the job description
    const jobDescription = await extractJobDescriptionWithClaude(cleanedText);

    return { description: jobDescription, source: 'scraped' };

  } catch (error) {
    return { description: '', source: 'failed' };
  }
}
```

**Claude Extraction Prompt:**

```typescript
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
```

### Fallback Logic

```typescript
// In analyze-job.ts server action

let jobDescription = application.job_description || '';

// If job_description is empty but job_url exists, try scraping
if (!jobDescription && application.job_url) {
  const result = await fetchJobDescription(application.job_url);

  if (result.source === 'unsupported') {
    return {
      error: 'This job board requires manual copy-paste. Please add the job description in the field below.'
    };
  }

  if (result.source === 'failed') {
    return {
      error: 'Couldn\'t fetch job description automatically. Please paste it manually.'
    };
  }

  jobDescription = result.description;
}

// If still empty, return error
if (!jobDescription) {
  return {
    error: 'No job description available. Please add a description or job URL.'
  };
}
```

---

## UI Components (Mobile-First)

### 1. Match Score Badge (Application Cards)

**Location:** Dashboard list/kanban, application cards

```typescript
// components/applications/MatchScoreBadge.tsx

<div className="flex items-center gap-2">
  {matchScore !== null ? (
    <>
      {/* Score badge with color coding */}
      <Badge
        variant={getScoreVariant(matchScore)}
        className="font-semibold"
      >
        {matchScore}% Match
      </Badge>

      {/* Re-analyze button (icon only on mobile) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReanalyze}
        disabled={isAnalyzing}
        className="h-8 w-8 p-0 md:w-auto md:px-3"
      >
        <RefreshCw className={cn(
          "h-4 w-4",
          isAnalyzing && "animate-spin"
        )} />
        <span className="hidden md:inline ml-2">Re-analyze</span>
      </Button>
    </>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      className="text-xs md:text-sm"
    >
      {isAnalyzing ? "Analyzing..." : "Analyze Match"}
    </Button>
  )}
</div>
```

**Color Coding:**
- 80-100: `variant="success"` (Green) - Excellent match
- 60-79: `variant="default"` (Blue) - Good match
- 40-59: `variant="warning"` (Yellow) - Fair match
- 0-39: `variant="destructive"` (Red) - Poor match

### 2. Detailed Analysis Card (Application Detail Page)

**Location:** `/dashboard/applications/[id]` - Below application info

```typescript
// components/applications/MatchAnalysisCard.tsx

<Card className="w-full">
  <CardHeader className="pb-3">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h3 className="text-lg font-semibold">Match Analysis</h3>

      <div className="flex items-center gap-3">
        {/* Circular progress for mobile */}
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          <CircularProgress value={matchScore} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg md:text-xl font-bold">{matchScore}</span>
          </div>
        </div>

        <Button
          onClick={handleReanalyze}
          disabled={isAnalyzing}
          size="sm"
        >
          {isAnalyzing ? "Analyzing..." : "Re-analyze"}
        </Button>
      </div>
    </div>
  </CardHeader>

  <CardContent className="space-y-6">
    {/* Score Breakdown - Stacked on mobile, side-by-side on desktop */}
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
      <div className="space-y-2">
        <ProgressBar label="Skills" value={skillsScore} max={40} />
        <ProgressBar label="Experience" value={expScore} max={30} />
        <ProgressBar label="Education" value={eduScore} max={15} />
        <ProgressBar label="Other Factors" value={otherScore} max={15} />
      </div>
    </div>

    {/* Skills - Chips/Tags */}
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Matching Skills</h4>
      <div className="flex flex-wrap gap-2">
        {matchingSkills.map(skill => (
          <Badge key={skill} variant="success" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Missing Skills</h4>
      <div className="flex flex-wrap gap-2">
        {missingSkills.map(skill => (
          <Badge key={skill} variant="warning" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>
    </div>

    {/* Strengths - List */}
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Your Strengths</h4>
      <ul className="space-y-2">
        {strengths.map((strength, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Concerns - List */}
    {concerns.length > 0 && (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Potential Concerns</h4>
        <ul className="space-y-2">
          {concerns.map((concern, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>{concern}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Recommendations - List */}
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Recommendations</h4>
      <ul className="space-y-2">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* AI Reasoning - Collapsible */}
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronDown className="h-4 w-4" />
        Show AI Analysis Details
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="text-sm">{reasoning}</p>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Analyzed on {formatDate(analyzedAt)}</p>
            <p>Base Score: {baseScore} → Adjusted: {adjustedScore} ({adjustment > 0 ? '+' : ''}{adjustment})</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </CardContent>
</Card>
```

### 3. Auto-Analysis Flow

```typescript
// In application form submission

async function onSubmit(data: ApplicationFormData) {
  try {
    // 1. Create/update application
    const app = await createApplication(data);

    // 2. If job info exists, trigger analysis
    if (data.job_url || data.job_description) {
      // Show loading toast
      const analysisToast = toast.loading("Analyzing job match...");

      // Run analysis in background
      analyzeJobMatch(app.id)
        .then(result => {
          toast.dismiss(analysisToast);

          if (result.success) {
            toast.success(`Match score: ${result.score}%`, {
              description: "View details in the application page"
            });
          } else {
            toast.error(result.error);
          }
        })
        .catch(error => {
          toast.dismiss(analysisToast);
          toast.error("Analysis failed. You can re-analyze from the application page.");
        });
    }

    // 3. Navigate to application detail
    router.push(`/dashboard/applications/${app.id}`);

  } catch (error) {
    toast.error("Failed to create application");
  }
}
```

### 4. Loading States

```typescript
// Progressive loading for better mobile UX

{isAnalyzing && (
  <div className="flex flex-col items-center gap-4 py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />

    <div className="text-center space-y-1">
      <p className="text-sm font-medium">
        {step === 'scraping' && "Fetching job description..."}
        {step === 'calculating' && "Calculating base score..."}
        {step === 'analyzing' && "AI is analyzing fit..."}
      </p>
      <p className="text-xs text-muted-foreground">
        This may take 10-15 seconds
      </p>
    </div>

    <Progress value={progress} className="w-full max-w-xs" />
  </div>
)}
```

---

## Rate Limiting

### Implementation

```typescript
// lib/ai/rate-limiter.ts

interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkAnalysisRateLimit(userId: string): Promise<RateLimitCheck> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count analyses in last hour from ai_usage table
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('operation_type', 'job_analysis')
    .gte('created_at', oneHourAgo.toISOString());

  const used = count || 0;
  const limit = 10; // Base tier limit (configurable per user tier in future)

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000),
  };
}
```

### Error Handling

```typescript
// In analyze-job server action

const rateLimit = await checkAnalysisRateLimit(userId);

if (!rateLimit.allowed) {
  return {
    error: `Analysis limit reached. You've used all 10 analyses this hour. Resets at ${rateLimit.resetAt.toLocaleTimeString()}.`
  };
}

// After successful analysis, log usage
await logAIUsage({
  user_id: userId,
  operation_type: 'job_analysis',
  model: 'claude-3-haiku-20240307',
  input_tokens: response.usage.input_tokens,
  output_tokens: response.usage.output_tokens,
  cache_read_tokens: response.usage.cache_read_input_tokens || 0,
  cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
  cost: calculateCost(response.usage),
});
```

---

## Error Handling Matrix

| Error Type | User Message | UI Action | Retry |
|------------|--------------|-----------|-------|
| No job description | "Please add a job description or URL to analyze" | Show input field | No |
| Scraping failed | "Couldn't auto-fetch. Please paste description manually" | Open textarea | No |
| Unsupported site | "This job board requires manual copy-paste" | Show instructions | No |
| Rate limit hit | "10/10 analyses used. Resets at 3:45 PM" | Show countdown + upgrade CTA | No |
| No resume data | "Upload your resume first to enable match scoring" | Link to profile page | No |
| Claude API error | "Analysis failed. Please try again" | Retry button | Yes |
| Network timeout | "Request timed out. Check connection" | Retry button | Yes |
| Invalid response | "Failed to parse analysis. Try again" | Retry button | Yes |

---

## Database Schema

### Existing Tables (No Changes Needed)

```sql
-- applications table already has:
match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
match_analysis JSONB,
analyzed_at TIMESTAMPTZ,

-- ai_usage table for tracking:
id UUID PRIMARY KEY,
user_id UUID NOT NULL,
operation_type TEXT NOT NULL, -- 'job_analysis'
model TEXT NOT NULL,
input_tokens INTEGER,
output_tokens INTEGER,
cache_read_tokens INTEGER,
cache_creation_tokens INTEGER,
cost NUMERIC(10, 6),
created_at TIMESTAMPTZ DEFAULT NOW()
```

### match_analysis JSONB Structure

```typescript
interface MatchAnalysis {
  base_score: number;
  adjusted_score: number;
  adjustment: number;
  reasoning: string;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}
```

---

## Implementation Checklist

### Phase 1: Core Scoring Logic
- [ ] `lib/ai/job-scraper.ts` - HTML fetching + Claude extraction
- [ ] `lib/ai/match-scorer.ts` - Base score calculation + Claude adjustment
- [ ] `lib/ai/rate-limiter.ts` - Rate limit checking
- [ ] `actions/analyze-job.ts` - Server action orchestration
- [ ] Unit tests for scoring functions

### Phase 2: UI Components (Mobile-First)
- [ ] `components/applications/MatchScoreBadge.tsx` - Score badge
- [ ] `components/applications/MatchAnalysisCard.tsx` - Detailed view
- [ ] `components/ui/circular-progress.tsx` - Circular progress indicator
- [ ] `components/ui/progress-bar.tsx` - Linear progress with labels
- [ ] Responsive layouts (mobile-first breakpoints)

### Phase 3: Integration
- [ ] Integrate badge into application cards (list + kanban)
- [ ] Add analysis card to application detail page
- [ ] Auto-trigger on application create/update
- [ ] Loading states + error handling
- [ ] Toast notifications

### Phase 4: Testing
- [ ] Unit tests for base score calculation
- [ ] Unit tests for rate limiting
- [ ] Integration tests for server action
- [ ] E2E test: Create app with job URL → Verify analysis
- [ ] E2E test: Re-analyze existing application
- [ ] Mobile responsive testing

### Phase 5: Documentation
- [ ] Update MVP_BACKLOG.md (mark #13 complete)
- [ ] Add usage documentation
- [ ] Cost tracking dashboard

---

## Future Enhancements (Post-MVP)

1. **Browser Extension** - For blocked sites, extension can copy job description from current tab
2. **Tier-based Limits** - 10/hour (free), 50/hour (pro), unlimited (enterprise)
3. **Batch Analysis** - Analyze multiple applications at once from dashboard
4. **Trend Analysis** - Track match scores over time, suggest skill development
5. **Smart Notifications** - Alert when high-match jobs are added
6. **Export Analysis** - Download match analysis as PDF for reference
7. **Comparison View** - Side-by-side comparison of multiple job matches

---

## Success Metrics

- **Adoption:** >80% of applications with job descriptions get analyzed
- **Accuracy:** User feedback on match score accuracy (survey)
- **Cost:** Average <$0.002 per analysis (target <$0.0002 with caching)
- **Performance:** Analysis completes in <15 seconds
- **Mobile UX:** >70% of analyses initiated from mobile devices

---

## Notes

- Prioritize mobile-first design throughout
- Keep scraping pragmatic - graceful fallback > fighting anti-bot measures
- Use Haiku for cost efficiency (Sonnet if accuracy issues arise)
- Cache aggressively (system prompts, user profiles)
- Clear, actionable error messages
- Progressive disclosure (show essentials, hide details)
