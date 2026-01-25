# System Architecture - AI Job Application Tracker

## High-Level Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS   │
│  - Server Components (data fetching)                            │
│  - Client Components (interactivity)                            │
│  - Server Actions (mutations)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Authentication Layer                        │
│              Supabase Auth (Google, LinkedIn, Microsoft)         │
│  - Session management                                           │
│  - JWT tokens                                                   │
│  - Role-based access control                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│                      API Routes & Server Actions                 │
│  - Input validation (Zod schemas)                               │
│  - Business logic                                               │
│  - Error handling                                               │
│  - Rate limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌──────────────────────┬────────────────────┬─────────────────────┐
│   Data Layer         │    Storage Layer   │    AI Layer         │
│   Supabase           │  Supabase Storage  │  Anthropic Claude   │
│   - PostgreSQL DB    │  - File uploads    │  - Resume parsing   │
│   - Real-time sync   │  - Signed URLs     │  - Job matching     │
│   - RLS policies     │  - CORS config     │  - Summarization    │
└──────────────────────┴────────────────────┴─────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Deployment & Hosting                        │
│                      Vercel (Edge Network)                       │
│  - Continuous deployment                                        │
│  - Auto-scaling                                                 │
│  - CDN distribution                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow Example: Create Application
1. User fills form in `/dashboard` (Client Component)
2. Form submission triggers Server Action `createApplication()`
3. Server Action validates input with Zod schema
4. Middleware verifies Supabase Auth JWT token
5. Server Action writes to PostgreSQL `applications` table via Supabase client
6. PostgreSQL RLS policies verify `user_id` matches authenticated user
7. Server Action triggers AI job matching (async, background)
8. Optimistic UI update shows new application immediately
9. Real-time listener updates dashboard when Supabase confirms write

---

## Folder Structure

```
JobApplicationApp/
├── .claude/
│   └── CLAUDE.md                      # Project instructions for Claude Code
├── .github/
│   └── workflows/
│       ├── ci.yml                     # CI: lint, build, test on PR
│       └── deploy.yml                 # CD: deploy to Vercel on merge to main
├── public/
│   ├── images/                        # Static images, logos
│   └── favicon.ico
├── src/
│   ├── app/                           # Next.js App Router pages
│   │   ├── (auth)/                    # Auth layout group
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page with OAuth buttons
│   │   │   └── signup/
│   │   │       └── page.tsx           # Signup page
│   │   ├── (dashboard)/               # Dashboard layout group (protected)
│   │   │   ├── layout.tsx             # Dashboard shell with navigation
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           # Main dashboard with analytics
│   │   │   │   ├── loading.tsx        # Loading skeleton
│   │   │   │   └── error.tsx          # Error boundary
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx           # Applications list/kanban view
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # Application detail page
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx   # Edit application form
│   │   │   │   └── new/
│   │   │   │       └── page.tsx       # New application form
│   │   │   ├── contacts/
│   │   │   │   ├── page.tsx           # Contacts list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # Contact detail page
│   │   │   │   └── new/
│   │   │   │       └── page.tsx       # New contact form
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # User profile with parsed resume data
│   │   │   ├── settings/
│   │   │   │   └── page.tsx           # Settings (notifications, privacy, export)
│   │   │   └── analytics/
│   │   │       └── page.tsx           # Detailed analytics dashboard
│   │   ├── api/                       # API routes (legacy, prefer Server Actions)
│   │   │   ├── applications/
│   │   │   │   ├── route.ts           # GET /api/applications, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # GET, PATCH, DELETE /api/applications/[id]
│   │   │   ├── contacts/
│   │   │   │   └── route.ts
│   │   │   ├── ai/
│   │   │   │   ├── parse-resume/
│   │   │   │   │   └── route.ts       # POST /api/ai/parse-resume
│   │   │   │   ├── match-job/
│   │   │   │   │   └── route.ts       # POST /api/ai/match-job
│   │   │   │   └── summarize-notes/
│   │   │   │       └── route.ts       # POST /api/ai/summarize-notes
│   │   │   └── upload/
│   │   │       └── route.ts           # POST /api/upload (resume/documents)
│   │   ├── layout.tsx                 # Root layout with auth provider
│   │   ├── page.tsx                   # Landing page (public)
│   │   ├── globals.css                # Tailwind imports and global styles
│   │   └── not-found.tsx              # 404 page
│   ├── components/                    # Reusable UI components
│   │   ├── ui/                        # shadcn/ui components (installed)
│   │   │   ├── button.tsx             # ✅ Button component
│   │   │   ├── dialog.tsx             # ✅ Modal/Dialog component
│   │   │   ├── form.tsx               # ✅ React Hook Form wrapper
│   │   │   ├── input.tsx              # ✅ Text input component
│   │   │   ├── textarea.tsx           # ✅ Multi-line text input
│   │   │   ├── select.tsx             # ✅ Dropdown select component
│   │   │   ├── label.tsx              # ✅ Form label component
│   │   │   ├── calendar.tsx           # ✅ Date picker component
│   │   │   ├── popover.tsx            # ✅ Popover component
│   │   │   ├── collapsible.tsx        # ✅ Collapsible section component
│   │   │   ├── toast.tsx              # ✅ Toast notification component
│   │   │   └── toaster.tsx            # ✅ Toast container component
│   │   ├── applications/
│   │   │   ├── ApplicationFormDialog.tsx  # ✅ Main form for creating applications
│   │   │   ├── FormSection.tsx            # ✅ Visual grouping for form fields
│   │   │   ├── SalaryRangeInput.tsx       # ✅ Compound salary range input (min/max/currency)
│   │   │   ├── TwoColumnRow.tsx           # ✅ Responsive two-column grid layout
│   │   │   ├── ApplicationCard.tsx        # TODO: Application card for kanban
│   │   │   ├── ApplicationTable.tsx       # TODO: TanStack Table wrapper
│   │   │   ├── KanbanBoard.tsx            # TODO: Kanban view with dnd-kit
│   │   │   ├── StatusBadge.tsx            # TODO: Color-coded status badge
│   │   │   └── MatchScoreBadge.tsx        # TODO: AI match score display
│   │   ├── contacts/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   └── InteractionTimeline.tsx
│   │   ├── notes/
│   │   │   ├── NotesSection.tsx           # ✅ Main notes orchestrator with collapsible section
│   │   │   ├── NotesList.tsx              # ✅ Notes list container with empty state
│   │   │   ├── NoteItem.tsx               # ✅ Individual note with expand/delete
│   │   │   └── AddNoteForm.tsx            # ✅ Inline note creation form
│   │   ├── dashboard/
│   │   │   ├── DashboardClient.tsx        # ✅ Client component with form dialog and notes integration
│   │   │   ├── MetricsCard.tsx            # TODO: Analytics metric display
│   │   │   ├── ApplicationTrendChart.tsx  # TODO: Trend visualization
│   │   │   ├── StatusPieChart.tsx         # TODO: Status distribution chart
│   │   │   └── WinsCelebration.tsx        # TODO: Milestone celebration modal
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Top navigation bar
│   │   │   ├── Sidebar.tsx            # Side navigation (desktop)
│   │   │   ├── MobileNav.tsx          # Bottom nav (mobile)
│   │   │   └── UserMenu.tsx           # User dropdown menu
│   │   ├── shared/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FileUpload.tsx         # Drag-drop file upload
│   │   │   └── SearchBar.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── AuthProvider.tsx       # Client-side auth context
│   ├── lib/                           # Utilities and configurations
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase client SDK config
│   │   │   ├── server.ts              # Supabase server client config
│   │   │   ├── auth.ts                # Auth utilities
│   │   │   ├── database.ts            # Database helper functions
│   │   │   └── storage.ts             # Storage helper functions
│   │   ├── ai/
│   │   │   ├── anthropic.ts           # Claude API client wrapper
│   │   │   ├── prompts.ts             # Prompt templates
│   │   │   ├── resume-parser.ts       # Resume parsing logic
│   │   │   ├── job-matcher.ts         # Job matching algorithm
│   │   │   └── rate-limiter.ts        # AI rate limiting
│   │   ├── utils/
│   │   │   ├── date.ts                # Date formatting utilities
│   │   │   ├── validation.ts          # Common validation helpers
│   │   │   ├── format.ts              # Number/currency formatting
│   │   │   ├── noteHelpers.ts         # ✅ Note formatting, colors, relative time
│   │   │   └── cn.ts                  # Tailwind class name merger
│   │   └── constants.ts               # App-wide constants
│   ├── types/                         # TypeScript type definitions
│   │   ├── application.ts             # Application-related types
│   │   ├── contact.ts                 # Contact-related types
│   │   ├── user.ts                    # User profile types
│   │   ├── ai.ts                      # AI response types
│   │   └── index.ts                   # Barrel export
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Auth state hook
│   │   ├── useApplications.ts         # Supabase applications hook
│   │   ├── useContacts.ts             # Supabase contacts hook
│   │   ├── useDebounce.ts             # Debounce hook
│   │   └── useLocalStorage.ts         # LocalStorage hook
│   ├── actions/                       # Server Actions
│   │   ├── applications.ts            # Application CRUD actions
│   │   ├── contacts.ts                # Contact CRUD actions
│   │   ├── ai.ts                      # AI operation actions
│   │   └── user.ts                    # User profile actions
│   ├── middleware.ts                  # Next.js middleware (auth check)
│   └── schemas/                       # Zod validation schemas
│       ├── application.ts             # Application validation schemas
│       ├── contact.ts                 # Contact validation schemas
│       └── user.ts                    # User validation schemas
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── ai/
│   │   │   │   └── resume-parser.test.ts
│   │   │   └── utils/
│   │   │       └── validation.test.ts
│   │   ├── components/
│   │   │   └── ApplicationCard.test.tsx
│   │   └── actions/
│   │       └── applications.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   └── applications.test.ts
│   │   └── database/
│   │       └── rls-policies.test.ts
│   └── e2e/
│       ├── auth.spec.ts               # E2E: login, signup, logout
│       ├── application-crud.spec.ts   # E2E: create, edit, delete app
│       ├── kanban.spec.ts             # E2E: drag-drop, status change
│       └── ai-features.spec.ts        # E2E: resume upload, job match
├── supabase/
│   ├── migrations/                    # Database migration files
│   │   └── *.sql                      # SQL migration scripts
│   ├── functions/                     # Supabase Edge Functions (optional)
│   │   ├── generate-insights/
│   │   │   └── index.ts               # Daily insights generation
│   │   └── on-application-create/
│   │       └── index.ts               # Database trigger for AI matching
│   └── config.toml                    # Supabase configuration
├── .env.example                       # Environment variables template
├── .env.local                         # Local environment variables (gitignored)
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
├── vitest.config.ts                   # Vitest configuration
├── playwright.config.ts               # Playwright configuration
├── package.json
├── PROJECT_BRIEF.md                   # This document
├── MVP_BACKLOG.md                     # Development backlog
├── ARCHITECTURE.md                    # Architecture documentation
└── README.md                          # Setup and usage guide
```

---

## Data Model (PostgreSQL Tables)

### Database Schema

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  role TEXT CHECK (role IN ('job_seeker', 'recruiter')) DEFAULT 'job_seeker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  experience JSONB DEFAULT '[]',  -- Array of {company, title, startDate, endDate, description}
  education JSONB DEFAULT '[]',   -- Array of {institution, degree, field, graduationDate}
  contact JSONB,                  -- {email, phone, linkedin}
  resume_url TEXT,                -- Supabase Storage URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{"email": true, "push": false, "followUpReminders": true}',
  privacy JSONB DEFAULT '{"dataSharing": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn')) DEFAULT 'applied',
  location TEXT,
  work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
  salary JSONB,                        -- {min, max, currency}
  application_date TIMESTAMPTZ NOT NULL,
  job_url TEXT,
  job_description TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_analysis JSONB,                -- {matchingSkills, missingSkills, experienceMatch, explanation}
  next_follow_up TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  referral_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ               -- Soft delete
);

-- Application notes table
CREATE TABLE public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application documents table
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('cover_letter', 'portfolio', 'correspondence', 'other')) DEFAULT 'other',
  storage_url TEXT NOT NULL,           -- Supabase Storage URL
  size BIGINT NOT NULL,                -- Bytes
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application interactions table (future)
CREATE TABLE public.application_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email', 'call', 'interview')) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  linkedin_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  relationship_strength INTEGER CHECK (relationship_strength >= 0 AND relationship_strength <= 100) DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact interactions table
CREATE TABLE public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('email_sent', 'email_received', 'call', 'meeting', 'linkedin_message')) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('follow_up', 'milestone', 'insight')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('first_application', 'first_response', 'first_interview', '10_applications', 'first_offer')) NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- AI usage tracking table
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT CHECK (operation IN ('resume_parse', 'job_match', 'summarize_notes', 'follow_up_suggest')) NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,        -- USD
  success BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'          -- {cachedPrompt, modelVersion}
);

-- Insights table (generated by Edge Functions)
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_of TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,              -- {applicationsSubmitted, responsesReceived, interviewsScheduled, averageMatchScore}
  burnout_signals TEXT[] DEFAULT '{}', -- e.g., ["high_volume", "low_responses"]
  suggestions TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Indexes

```sql
-- Applications table indexes
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_user_status_date ON public.applications(user_id, status, application_date DESC);
CREATE INDEX idx_applications_user_created ON public.applications(user_id, created_at DESC);
CREATE INDEX idx_applications_deleted ON public.applications(deleted_at) WHERE deleted_at IS NULL;

-- Application notes indexes
CREATE INDEX idx_application_notes_app_id ON public.application_notes(application_id);
CREATE INDEX idx_application_notes_created ON public.application_notes(application_id, created_at DESC);

-- Application documents indexes
CREATE INDEX idx_application_docs_app_id ON public.application_documents(application_id);

-- Contacts table indexes
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_user_interaction ON public.contacts(user_id, last_interaction DESC);

-- Contact interactions indexes
CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_date ON public.contact_interactions(contact_id, date DESC);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read_created ON public.notifications(user_id, read, created_at DESC);

-- AI usage indexes
CREATE INDEX idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX idx_ai_usage_timestamp ON public.ai_usage(user_id, timestamp DESC);

-- Insights indexes
CREATE INDEX idx_insights_user_week ON public.insights(user_id, week_of DESC);
```

---

## API Routes Overview

### Authentication Routes (Supabase Auth SDK)
- `POST /api/auth/login` - OAuth login (handled by Supabase)
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/callback` - OAuth callback handler

### Application Routes
- `GET /api/applications` - List user's applications (paginated, filtered)
  - Query params: `status`, `page`, `limit`, `sortBy`, `search`
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Fetch single application
- `PATCH /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Soft delete application

### Contact Routes
- `GET /api/contacts` - List user's contacts
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Fetch single contact
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### AI Routes
- `POST /api/ai/parse-resume` - Parse uploaded resume
  - Body: `{ resumeUrl: string }`
  - Response: `{ skills, experience, education }`
- `POST /api/ai/match-job` - Match job description to profile
  - Body: `{ applicationId: string }`
  - Response: `{ matchScore, analysis }`
- `POST /api/ai/summarize-notes` - Summarize application notes
  - Body: `{ applicationId: string }`
  - Response: `{ summary, actionItems }`
- `POST /api/ai/suggest-followup` - Generate follow-up suggestions
  - Body: `{ applicationId: string }`
  - Response: `{ suggestions: [{ action, timing, message }] }`

### Upload Routes
- `POST /api/upload/resume` - Upload resume file
  - Body: `multipart/form-data`
  - Response: `{ url: string, fileName: string }`
- `POST /api/upload/document` - Upload document to application
  - Body: `multipart/form-data`
  - Response: `{ url: string, documentId: string }`

### Analytics Routes
- `GET /api/analytics/dashboard` - Fetch dashboard metrics
  - Response: `{ totalApps, responseRate, interviewRate, trends }`
- `GET /api/analytics/insights` - Fetch weekly insights
  - Response: `{ metrics, burnoutSignals, suggestions }`

### Export Routes
- `POST /api/export/data` - Generate data export
  - Response: `{ exportId: string, downloadUrl: string }`
- `POST /api/account/delete` - Request account deletion

---

## Frontend Pages and Components

### Public Pages
- `/` - Landing page with product overview, CTA
- `/login` - Authentication page with OAuth buttons
- `/signup` - Sign-up page (redirects to OAuth)

### Protected Pages (Dashboard Layout)
- `/dashboard` - Main dashboard with analytics overview
- `/dashboard/applications` - Applications list/kanban view
- `/dashboard/applications/[id]` - Application detail page
- `/dashboard/applications/new` - New application form
- `/dashboard/contacts` - Contacts list
- `/dashboard/contacts/[id]` - Contact detail with interactions
- `/dashboard/profile` - User profile with parsed resume data
- `/dashboard/settings` - Notification, privacy, account settings
- `/dashboard/analytics` - Detailed analytics and insights

### Key Component Hierarchy

```
RootLayout (auth provider, toast provider)
└── DashboardLayout (protected route, sidebar, navbar)
    ├── Dashboard Page
    │   ├── MetricsCard (total apps, response rate, etc.)
    │   ├── ApplicationTrendChart (bar chart)
    │   ├── StatusPieChart
    │   └── WinsCelebration (milestone modal)
    ├── Applications Page
    │   ├── ViewToggle (table vs. kanban)
    │   ├── FilterBar (status, date range, search)
    │   ├── ApplicationTable (TanStack Table)
    │   │   └── ApplicationRow
    │   │       ├── StatusBadge
    │   │       ├── MatchScoreBadge
    │   │       └── ActionsDropdown
    │   └── KanbanBoard (dnd-kit)
    │       └── KanbanColumn
    │           └── ApplicationCard (draggable)
    └── Application Detail Page
        ├── ApplicationHeader (company, position, status)
        ├── InlineEditFields (location, salary, etc.)
        ├── MatchAnalysis (AI score, skills comparison)
        ├── NotesSection
        │   ├── NotesList
        │   └── AddNoteForm
        ├── DocumentsSection
        │   ├── DocumentsList
        │   └── FileUpload
        └── FollowUpSuggestions (AI-generated)
```

---

## AI Integration Patterns

### Claude API Integration Architecture

```
User Action → Server Action → AI Service → Claude API → Parse Response → Supabase PostgreSQL
```

### 1. Resume Parsing Flow

```typescript
// src/lib/ai/resume-parser.ts

import Anthropic from '@anthropic-ai/sdk';
import { extractTextFromPDF } from '@/lib/utils/pdf';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseResume(resumeUrl: string) {
  // 1. Download and extract text from resume
  const resumeText = await extractTextFromPDF(resumeUrl);

  // 2. Call Claude API with prompt caching
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: RESUME_PARSING_SYSTEM_PROMPT, // Cached
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: resumeText
      }
    ]
  });

  // 3. Parse JSON response
  const parsed = JSON.parse(response.content[0].text);

  // 4. Validate with Zod schema
  return resumeSchema.parse(parsed);
}
```

**Cost Optimization:**
- System prompt cached for 5 minutes (75% cost reduction on cache hits)
- Average resume: 800 input tokens, 500 output tokens
- Cost per parse: ~$0.008 (with caching: ~$0.002)

---

### 2. Job Matching Flow

```typescript
// src/lib/ai/job-matcher.ts

export async function matchJobToProfile(
  jobDescription: string,
  userProfile: UserProfile
) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: JOB_MATCHING_SYSTEM_PROMPT, // Cached
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          jobDescription,
          userSkills: userProfile.skills,
          userExperience: userProfile.experience,
          userEducation: userProfile.education
        })
      }
    ]
  });

  return matchAnalysisSchema.parse(JSON.parse(response.content[0].text));
}
```

**Scoring Algorithm:**
- Skills match: 40% weight (semantic matching, not keyword)
- Experience relevance: 30% weight (years + domain alignment)
- Education: 15% weight
- Other factors: 15% weight (location, certifications)

---

### 3. Rate Limiting Strategy

```typescript
// src/lib/ai/rate-limiter.ts

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function checkRateLimit(
  userId: string,
  operation: 'resume_parse' | 'job_match' | 'summarize'
): Promise<boolean> {
  const limits = {
    resume_parse: { max: 10, window: 3600 }, // 10 per hour
    job_match: { max: 20, window: 3600 },
    summarize: { max: 50, window: 3600 }
  };

  const limit = limits[operation];
  const windowStart = new Date(Date.now() - limit.window * 1000);

  // Count recent usage
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('operation', operation)
    .gte('timestamp', windowStart.toISOString());

  if (error) throw error;

  return (count || 0) < limit.max;
}
```

---

### 4. PII Redaction Before Logging

```typescript
// src/lib/utils/pii-redaction.ts

export function redactPII(text: string): string {
  return text
    .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
}
```

---

## Security Architecture

### 1. Authentication & Authorization

**Supabase Auth Configuration:**
```typescript
// src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server-side Auth:**
```typescript
// src/lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

**Middleware Protection:**
```typescript
// src/middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.delete(name);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

---

### 2. PostgreSQL Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Applications table policies
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

-- Application notes policies
CREATE POLICY "Users can view notes for own applications"
  ON public.application_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_notes.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage notes for own applications"
  ON public.application_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_notes.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Application documents policies
CREATE POLICY "Users can view documents for own applications"
  ON public.application_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage documents for own applications"
  ON public.application_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_documents.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Contacts table policies
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Contact interactions policies
CREATE POLICY "Users can view interactions for own contacts"
  ON public.contact_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage interactions for own contacts"
  ON public.contact_interactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_interactions.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Notifications policies (read-only for users, write via service role)
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Milestones policies (read-only for users)
CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT
  USING (auth.uid() = user_id);

-- AI usage policies (read-only for users)
CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Insights policies (read-only for users)
CREATE POLICY "Users can view own insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 3. Supabase Storage Security Policies

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Resumes bucket policies
CREATE POLICY "Users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.extension(name) = 'pdf' OR storage.extension(name) = 'docx')
  );

CREATE POLICY "Users can view own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents bucket policies
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (
      storage.extension(name) IN ('pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png')
    )
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

### 4. Input Validation (Zod Schemas)

```typescript
// src/schemas/application.ts

import { z } from 'zod';

export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn']),
  location: z.string().max(100).optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  salary: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    currency: z.string().length(3).default('USD')
  }).optional(),
  applicationDate: z.date(),
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([])
});

export const updateApplicationSchema = createApplicationSchema.partial();
```

**Usage in Server Action:**
```typescript
// src/actions/applications.ts

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function createApplication(data: unknown) {
  // 1. Validate input
  const validatedData = createApplicationSchema.parse(data);

  // 2. Get authenticated user
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 3. Insert into PostgreSQL
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      ...validatedData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return { id: application.id };
}
```

---

## Deployment Strategy

### Vercel Configuration

```json
// vercel.json (optional)

{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

### GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit

      - name: Run build
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Environment Configuration

```bash
# .env.example

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Performance Optimization Strategy

### 1. Code Splitting
- Use `next/dynamic` for heavy components (Kanban, Charts)
- Lazy load AI features (resume parser modal)

### 2. Data Fetching
- Server Components for initial data fetch
- Client-side pagination with optimistic updates
- Prefetch on link hover

### 3. Caching
- Supabase query results cached for 1 hour (stale-while-revalidate)
- AI prompt caching (5-minute TTL)
- Static assets with 1-year cache via Vercel CDN

### 4. Bundle Size
- Tree-shake unused shadcn components
- Use `@anthropic-ai/sdk` instead of full SDK
- Target: <100KB initial JavaScript bundle

### 5. Monitoring
- Vercel Analytics for performance tracking
- Core Web Vitals tracking
- Supabase query performance analysis via dashboard
- Error tracking with Sentry or Vercel Error Monitoring

---

## Testing Strategy

### Unit Tests (Vitest)
- All utility functions (`src/lib/utils/*`)
- Zod schemas validation
- AI prompt parsing logic

### Integration Tests (Vitest + Supabase Local)
- API routes with Supabase local instance
- Server Actions with authentication
- PostgreSQL RLS policies verification

### E2E Tests (Playwright)
- Critical user flows:
  - Auth: Sign up → Sign in → Sign out
  - CRUD: Create app → Edit → Delete
  - Kanban: Drag card → Status change
  - AI: Upload resume → Parse → Job match

### Coverage Target
- Unit: 80%+
- Integration: 60%+
- E2E: Critical paths covered

---

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- Semantic HTML (`<main>`, `<nav>`, `<article>`)
- ARIA labels for interactive elements
- Keyboard navigation support (kanban drag-drop)
- Focus management (modals, dialogs)
- Color contrast ratio: 4.5:1 minimum

### Screen Reader Support
- Status announcements on CRUD operations
- Live regions for dynamic content (AI parsing progress)
- Skip links for navigation

### Testing Tools
- axe DevTools for automated accessibility audits
- Manual keyboard navigation testing
- NVDA/JAWS screen reader testing

---

## Future Architecture Enhancements

### 1. Real-Time Collaboration (Recruiter Features)
- Supabase real-time subscriptions for team updates
- Presence detection with Supabase Presence
- Comment threads with conflict resolution

### 2. Offline Support
- Service Worker with Workbox
- IndexedDB for local application cache
- Sync queue for offline writes

### 3. Advanced Search
- Algolia integration for full-text search
- Faceted filtering (skills, experience level, location)

### 4. Mobile App
- React Native with shared business logic
- Supabase client for mobile
- Push notifications via Supabase Edge Functions

### 5. Analytics & Machine Learning
- Analytics integration with PostHog or Mixpanel
- User behavior tracking with Vercel Analytics
- Predictive modeling (application success prediction)

---

This architecture provides a solid foundation for building an employer-grade job application tracker with AI assistance, optimized for performance, security, and scalability.
