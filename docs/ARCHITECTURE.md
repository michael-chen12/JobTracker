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
│              Firebase Auth (Google, LinkedIn, Microsoft)         │
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
│   Cloud Firestore    │  Firebase Storage  │  Anthropic Claude   │
│   - NoSQL database   │  - File uploads    │  - Resume parsing   │
│   - Real-time sync   │  - Signed URLs     │  - Job matching     │
│   - Security rules   │  - CORS config     │  - Summarization    │
└──────────────────────┴────────────────────┴─────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Deployment & Hosting                        │
│            Firebase App Hosting + Cloud Functions                │
│  - Continuous deployment                                        │
│  - Auto-scaling                                                 │
│  - CDN distribution                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow Example: Create Application
1. User fills form in `/dashboard` (Client Component)
2. Form submission triggers Server Action `createApplication()`
3. Server Action validates input with Zod schema
4. Middleware verifies Firebase Auth JWT token
5. Server Action writes to Firestore `applications` collection
6. Firestore security rules verify `userId` matches authenticated user
7. Server Action triggers AI job matching (async, background)
8. Optimistic UI update shows new application immediately
9. Real-time listener updates dashboard when Firestore confirms write

---

## Folder Structure

```
JobApplicationApp/
├── .claude/
│   └── CLAUDE.md                      # Project instructions for Claude Code
├── .github/
│   └── workflows/
│       ├── ci.yml                     # CI: lint, build, test on PR
│       └── deploy.yml                 # CD: deploy to Firebase on merge to main
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
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (other shadcn components)
│   │   ├── applications/
│   │   │   ├── ApplicationCard.tsx    # Application card for kanban
│   │   │   ├── ApplicationTable.tsx   # TanStack Table wrapper
│   │   │   ├── ApplicationForm.tsx    # Create/edit form
│   │   │   ├── KanbanBoard.tsx        # Kanban view with dnd-kit
│   │   │   ├── StatusBadge.tsx        # Color-coded status badge
│   │   │   └── MatchScoreBadge.tsx    # AI match score display
│   │   ├── contacts/
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   └── InteractionTimeline.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricsCard.tsx        # Analytics metric display
│   │   │   ├── ApplicationTrendChart.tsx
│   │   │   ├── StatusPieChart.tsx
│   │   │   └── WinsCelebration.tsx    # Milestone celebration modal
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
│   │   ├── firebase/
│   │   │   ├── client.ts              # Firebase client SDK config
│   │   │   ├── admin.ts               # Firebase Admin SDK config (server)
│   │   │   ├── auth.ts                # Auth utilities
│   │   │   ├── firestore.ts           # Firestore helper functions
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
│   │   ├── useApplications.ts         # Firestore applications hook
│   │   ├── useContacts.ts             # Firestore contacts hook
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
│   │   └── firestore/
│   │       └── security-rules.test.ts
│   └── e2e/
│       ├── auth.spec.ts               # E2E: login, signup, logout
│       ├── application-crud.spec.ts   # E2E: create, edit, delete app
│       ├── kanban.spec.ts             # E2E: drag-drop, status change
│       └── ai-features.spec.ts        # E2E: resume upload, job match
├── firestore/
│   ├── firestore.rules                # Firestore security rules
│   └── firestore.indexes.json         # Composite index definitions
├── storage/
│   └── storage.rules                  # Firebase Storage security rules
├── functions/                         # Cloud Functions (optional)
│   ├── src/
│   │   ├── index.ts                   # Function exports
│   │   ├── scheduled/
│   │   │   └── generate-insights.ts   # Daily insights generation
│   │   └── triggers/
│   │       └── on-application-create.ts # Firestore trigger for AI matching
│   └── package.json
├── .env.example                       # Environment variables template
├── .env.local                         # Local environment variables (gitignored)
├── firebase.json                      # Firebase project configuration
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

## Data Model (Firestore Collections)

### Collections Structure

```
firestore/
├── users/                             # Top-level collection
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── role: 'job_seeker' | 'recruiter'
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       ├── profile/                   # Subcollection
│       │   └── {profileId}/           # Single document 'main'
│       │       ├── skills: string[]
│       │       ├── experience: Array<{
│       │       │     company: string
│       │       │     title: string
│       │       │     startDate: string
│       │       │     endDate: string | null
│       │       │     description: string
│       │       │   }>
│       │       ├── education: Array<{
│       │       │     institution: string
│       │       │     degree: string
│       │       │     field: string
│       │       │     graduationDate: string
│       │       │   }>
│       │       ├── contact: {
│       │       │     email: string
│       │       │     phone: string
│       │       │     linkedin: string
│       │       │   }
│       │       └── resumeUrl: string  # Firebase Storage URL
│       └── settings/
│           └── {settingsId}/          # Single document 'preferences'
│               ├── notifications: {
│               │     email: boolean
│               │     push: boolean
│               │     followUpReminders: boolean
│               │   }
│               └── privacy: {
│                     dataSharing: boolean
│                   }
├── applications/                      # Top-level collection
│   └── {applicationId}/
│       ├── userId: string             # Indexed
│       ├── company: string
│       ├── position: string
│       ├── status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn'
│       ├── location: string | null
│       ├── workMode: 'remote' | 'hybrid' | 'onsite' | null
│       ├── salary: {
│       │     min: number | null
│       │     max: number | null
│       │     currency: string
│       │   } | null
│       ├── applicationDate: Timestamp # Indexed
│       ├── jobUrl: string | null
│       ├── jobDescription: string | null
│       ├── matchScore: number | null  # 0-100
│       ├── matchAnalysis: {
│       │     matchingSkills: string[]
│       │     missingSkills: string[]
│       │     experienceMatch: number
│       │     explanation: string
│       │   } | null
│       ├── nextFollowUp: Timestamp | null
│       ├── tags: string[]
│       ├── referralContactId: string | null # Reference to contacts collection
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       ├── deletedAt: Timestamp | null # Soft delete
│       ├── notes/                     # Subcollection
│       │   └── {noteId}/
│       │       ├── content: string
│       │       ├── createdAt: Timestamp
│       │       └── updatedAt: Timestamp
│       ├── documents/                 # Subcollection
│       │   └── {documentId}/
│       │       ├── name: string
│       │       ├── type: 'cover_letter' | 'portfolio' | 'correspondence' | 'other'
│       │       ├── storageUrl: string # Firebase Storage URL
│       │       ├── size: number       # Bytes
│       │       └── uploadedAt: Timestamp
│       └── interactions/              # Subcollection (future)
│           └── {interactionId}/
│               ├── type: 'email' | 'call' | 'interview'
│               ├── date: Timestamp
│               └── notes: string
├── contacts/                          # Top-level collection
│   └── {contactId}/
│       ├── userId: string             # Indexed
│       ├── name: string
│       ├── email: string | null
│       ├── phone: string | null
│       ├── company: string | null
│       ├── title: string | null
│       ├── linkedinUrl: string | null
│       ├── notes: string
│       ├── tags: string[]
│       ├── relationshipStrength: number # 0-100, calculated from interactions
│       ├── lastInteraction: Timestamp | null
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       └── interactions/              # Subcollection
│           └── {interactionId}/
│               ├── type: 'email_sent' | 'email_received' | 'call' | 'meeting' | 'linkedin_message'
│               ├── date: Timestamp
│               ├── notes: string
│               └── outcome: string | null
├── notifications/                     # Top-level collection
│   └── {notificationId}/
│       ├── userId: string             # Indexed
│       ├── type: 'follow_up' | 'milestone' | 'insight'
│       ├── title: string
│       ├── message: string
│       ├── read: boolean
│       ├── actionUrl: string | null
│       ├── createdAt: Timestamp
│       └── expiresAt: Timestamp | null
├── milestones/                        # Top-level collection
│   └── {milestoneId}/
│       ├── userId: string             # Indexed
│       ├── type: 'first_application' | 'first_response' | 'first_interview' | '10_applications' | 'first_offer'
│       ├── achievedAt: Timestamp
│       └── metadata: Record<string, any>
├── aiUsage/                           # Top-level collection
│   └── {usageId}/
│       ├── userId: string             # Indexed
│       ├── operation: 'resume_parse' | 'job_match' | 'summarize_notes' | 'follow_up_suggest'
│       ├── tokensUsed: number
│       ├── cost: number               # USD
│       ├── success: boolean
│       ├── timestamp: Timestamp
│       └── metadata: {
│             cachedPrompt: boolean
│             modelVersion: string
│           }
└── insights/                          # Top-level collection (Cloud Functions generated)
    └── {insightId}/
        ├── userId: string             # Indexed
        ├── weekOf: Timestamp
        ├── metrics: {
        │     applicationsSubmitted: number
        │     responsesReceived: number
        │     interviewsScheduled: number
        │     averageMatchScore: number
        │   }
        ├── burnoutSignals: string[]   # e.g., ["high_volume", "low_responses"]
        ├── suggestions: string[]
        └── generatedAt: Timestamp
```

### Composite Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "applicationDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "contacts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastInteraction", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## API Routes Overview

### Authentication Routes (Firebase Auth SDK)
- `POST /api/auth/login` - OAuth login (handled by Firebase)
- `POST /api/auth/logout` - Sign out

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
User Action → Server Action → AI Service → Claude API → Parse Response → Firestore
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

import { Redis } from '@upstash/redis'; // Optional: use Firestore instead

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
  const key = `ratelimit:${userId}:${operation}`;

  // Use Firestore transaction for rate limiting
  const count = await incrementUsageCount(userId, operation);

  return count <= limit.max;
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

**Firebase Auth Configuration:**
```javascript
// src/lib/firebase/auth.ts

import { getAuth } from 'firebase/auth';
import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();
export const linkedinProvider = new OAuthProvider('linkedin.com');
export const microsoftProvider = new OAuthProvider('microsoft.com');
```

**Middleware Protection:**
```typescript
// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decodedToken = await verifyIdToken(token);

    // Add userId to request headers for server actions
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.uid);

    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/applications/:path*']
};
```

---

### 2. Firestore Security Rules

```javascript
// firestore/firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function: user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);

      match /profile/{profileId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }

      match /settings/{settingId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }

    // Applications collection
    match /applications/{applicationId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);

      match /notes/{noteId} {
        allow read, write: if isAuthenticated() && isOwner(get(/databases/$(database)/documents/applications/$(applicationId)).data.userId);
      }

      match /documents/{documentId} {
        allow read, write: if isAuthenticated() && isOwner(get(/databases/$(database)/documents/applications/$(applicationId)).data.userId);
      }
    }

    // Contacts collection
    match /contacts/{contactId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);

      match /interactions/{interactionId} {
        allow read, write: if isAuthenticated() && isOwner(get(/databases/$(database)/documents/contacts/$(contactId)).data.userId);
      }
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow write: if false; // Only Cloud Functions can write
    }

    // AI Usage collection (read-only for users)
    match /aiUsage/{usageId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow write: if false; // Only server can write
    }
  }
}
```

---

### 3. Firebase Storage Security Rules

```javascript
// storage/storage.rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper function: file size limit
    function isValidSize(maxSize) {
      return request.resource.size <= maxSize;
    }

    // Helper function: file type validation
    function isValidFileType(allowedTypes) {
      return request.resource.contentType in allowedTypes;
    }

    // User resumes
    match /users/{userId}/resumes/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && isValidSize(5 * 1024 * 1024) // 5MB
                   && isValidFileType(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
    }

    // Application documents
    match /users/{userId}/applications/{applicationId}/documents/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && isValidSize(10 * 1024 * 1024) // 10MB
                   && isValidFileType(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']);
    }
  }
}
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

export async function createApplication(data: unknown) {
  // 1. Validate input
  const validatedData = createApplicationSchema.parse(data);

  // 2. Verify authentication
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  // 3. Write to Firestore
  const docRef = await addDoc(collection(db, 'applications'), {
    ...validatedData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { id: docRef.id };
}
```

---

## Deployment Strategy

### Firebase App Hosting Configuration

```json
// firebase.json

{
  "firestore": {
    "rules": "firestore/firestore.rules",
    "indexes": "firestore/firestore.indexes.json"
  },
  "storage": {
    "rules": "storage/storage.rules"
  },
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "function": "nextjsFunc"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

### GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Firebase

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

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
          channelId: live
```

### Environment Configuration

```bash
# .env.example

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-side only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Anthropic API
ANTHROPIC_API_KEY=

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
- Firestore query results cached for 1 hour (stale-while-revalidate)
- AI prompt caching (5-minute TTL)
- Static assets with 1-year cache

### 4. Bundle Size
- Tree-shake unused shadcn components
- Use `@anthropic-ai/sdk` instead of full SDK
- Target: <100KB initial JavaScript bundle

### 5. Monitoring
- Firebase Performance Monitoring
- Core Web Vitals tracking
- Firestore query performance analysis

---

## Testing Strategy

### Unit Tests (Vitest)
- All utility functions (`src/lib/utils/*`)
- Zod schemas validation
- AI prompt parsing logic

### Integration Tests (Vitest + Firestore Emulator)
- API routes with mocked Firestore
- Server Actions with authentication
- Firestore security rules

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
- Firestore real-time listeners for team updates
- Presence detection with Firestore
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
- Firebase SDKs for mobile
- Push notifications via FCM

### 5. Analytics & Machine Learning
- BigQuery export for advanced analytics
- User behavior tracking with Firebase Analytics
- Predictive modeling (application success prediction)

---

This architecture provides a solid foundation for building an employer-grade job application tracker with AI assistance, optimized for performance, security, and scalability.
