# MVP Development Backlog

## 🎯 Progress Overview

**Last Updated:** 2026-01-26

| Ticket | Title | Status |
|--------|-------|--------|
| #1 | End-to-End Vertical Slice | ✅ Complete |
| #2 | Project Infrastructure Setup | ✅ Complete |
| #3 | Supabase Integration | ✅ Complete |
| #4 | Application Data Model | ✅ Complete |
| #5 | Application CRUD API Routes | ✅ Complete |
| #6 | Dashboard Page - Table View | ✅ Complete |
| #7 | Application Creation Form | ✅ Complete |
| #8 | Application Detail Page | ✅ Complete |
| #9 | Kanban Board View | ✅ Complete |
| #10 | Anthropic Claude API Integration | ✅ Complete |
| #11+ | Not Started | ⚪ Pending |

---

## Epic 1: Foundation & Vertical Slice

### Ticket #1: End-to-End Vertical Slice - Authentication to First Application
**Priority:** P0 | **Complexity:** M | **Dependencies:** None

**Description:**
Implement a minimal end-to-end flow proving the entire stack works together: user authentication, create one application, display on dashboard, add a simple note.

**Acceptance Criteria:**
- [x] User can sign in with Google OAuth via Supabase Auth
- [x] Authenticated user lands on `/dashboard` with empty state
- [x] User can create a job application with: company name, position, status (Applied)
- [x] Application appears on dashboard in a simple card/list view
- [x] User can add a text note to the application
- [x] Note displays below application card
- [x] User can sign out and session persists on refresh
- [x] E2E test covers: sign-in → create app → add note → sign-out

**Technical Notes:**
- Set up Supabase project with Auth and PostgreSQL
- Configure Next.js App Router with auth middleware
- Create PostgreSQL tables: `users`, `applications`, `application_notes`
- Implement simple dashboard page with server-side auth check

---

### Ticket #2: Project Infrastructure Setup
**Priority:** P0 | **Complexity:** S | **Dependencies:** None

**Description:**
Initialize project with all required tooling, linting, testing frameworks, and CI/CD foundation.

**Acceptance Criteria:**
- [ ] Next.js 15 + TypeScript 5.3 project initialized
- [ ] ESLint, Prettier configured with project rules
- [ ] Vitest configured for unit tests with example test
- [ ] Playwright configured for E2E with example test
- [ ] GitHub Actions workflow: lint, build, test on PR
- [ ] Environment variables documented in `.env.example`
- [ ] README with setup instructions

**Technical Notes:**
- Use `create-next-app` with TypeScript template
- Configure strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- Set up Vitest with React Testing Library

---

### Ticket #3: Supabase Integration - Auth, PostgreSQL, Storage
**Priority:** P0 | **Complexity:** M | **Dependencies:** #2

**Description:**
Configure Supabase project, set up multi-provider authentication, initialize PostgreSQL database with RLS policies, and configure Supabase Storage for document uploads.

**Acceptance Criteria:**
- [ ] Supabase project created with production and staging environments
- [ ] Supabase Auth configured with Google OAuth provider
- [ ] PostgreSQL tables created: `users`, `applications`, `application_notes`
- [ ] RLS policies defined for all tables
- [ ] Supabase Storage buckets created with security policies
- [ ] Supabase client initialized for client and server-side operations
- [ ] Auth context provider for client-side session management
- [ ] Middleware protects authenticated routes (`/dashboard/*`)
- [ ] Unit tests for auth utilities

**Technical Notes:**
- Store Supabase config in environment variables
- Use Supabase server client for server actions
- Implement auth state listener in root layout
- Run migrations via Supabase CLI

---

## Epic 2: Application Management Core

### Ticket #4: Application Data Model & PostgreSQL Schema
**Priority:** P0 | **Complexity:** S | **Dependencies:** #3

**Description:**
Define comprehensive PostgreSQL schema for applications with proper indexing, validation schemas using Zod, and TypeScript interfaces.

**Acceptance Criteria:**
- [ ] PostgreSQL tables designed: `applications`, `application_notes`, `contacts`, `application_documents`
- [ ] Database indexes created for common queries (user_id + status, user_id + created_at)
- [ ] Zod schemas for application creation/update validation
- [ ] TypeScript interfaces exported from `@/types/application.ts`
- [ ] RLS policies enforce user-level data isolation
- [ ] Migration files created in `supabase/migrations/`
- [ ] Documentation in `ARCHITECTURE.md` updated

**Data Model:**
```typescript
Application {
  id: string;
  userId: string;
  company: string;
  position: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn';
  location?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite';
  salary?: { min?: number; max?: number; currency: string };
  applicationDate: Timestamp;
  jobUrl?: string;
  jobDescription?: string;
  matchScore?: number; // AI-generated 0-100
  nextFollowUp?: Timestamp;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### Ticket #5: Application CRUD API Routes
**Priority:** P0 | **Complexity:** M | **Dependencies:** #4

**Description:**
Implement server actions for creating, reading, updating, and deleting applications with proper validation and error handling.

**Acceptance Criteria:**
- [ ] POST `/api/applications` - Create new application
- [ ] GET `/api/applications` - List user's applications with pagination
- [ ] GET `/api/applications/[id]` - Fetch single application
- [ ] PATCH `/api/applications/[id]` - Update application fields
- [ ] DELETE `/api/applications/[id]` - Soft delete application
- [ ] All routes validate auth and input (Zod schemas)
- [ ] Error responses follow consistent format (status, message, errors)
- [ ] Rate limiting: 100 requests/min per user
- [ ] Unit tests for each route with mock Firestore

**Technical Notes:**
- Use Next.js Server Actions for mutations
- Implement soft delete with `deleted_at` timestamp
- Return paginated results (20 items default)
- Use Supabase client for database operations

---

### Ticket #6: Dashboard Page - Application List View
**Priority:** P0 | **Complexity:** M | **Dependencies:** #5

**Description:**
Build dashboard page with table view of applications using TanStack Table, including sorting, filtering, and pagination.

**Acceptance Criteria:**
- [ ] Dashboard at `/dashboard` displays applications in table
- [ ] Columns: Company, Position, Status, Application Date, Last Updated, Actions
- [ ] Sortable by company, position, date (ascending/descending)
- [ ] Filter by status (multi-select dropdown)
- [ ] Search by company or position name
- [ ] Pagination controls (20 items per page)
- [ ] Empty state with CTA to create first application
- [ ] Loading skeleton while fetching data
- [ ] Error state with retry button
- [ ] E2E test: load dashboard, sort, filter, paginate

**Technical Notes:**
- Use TanStack Table for data grid
- Implement optimistic updates for status changes
- Prefetch next page for smooth navigation
- Use Supabase real-time subscriptions for live updates

---

### Ticket #7: Application Creation Form ✅ COMPLETE
**Priority:** P0 | **Complexity:** M | **Dependencies:** #5

**Description:**
Create form for adding new job applications with validation, error handling, and seamless UX.

**Acceptance Criteria:**
- [x] Modal/dialog opens from dashboard "+ New Application" button
- [x] Required fields: company, position, status, application date
- [x] Optional fields: location, work mode, salary range, job URL
- [x] Real-time validation with Zod + React Hook Form
- [x] Field-level error messages
- [x] Submit button disabled until valid
- [x] Success toast notification on creation
- [x] Optimistic UI update (application appears immediately)
- [x] Form resets after successful submission
- [x] E2E test: open form, fill fields, submit, verify in list (framework created, needs auth)

**Technical Notes:**
- Use shadcn/ui Dialog component
- Default status to "Applied", date to today
- Implement debounced auto-save for draft state (optional)

---

### Ticket #8: Application Detail Page ✅ COMPLETE
**Priority:** P1 | **Complexity:** M | **Dependencies:** #5

**Description:**
Build dedicated page for viewing and editing single application with full details, notes history, and document attachments.

**Acceptance Criteria:**
- [x] Route: `/dashboard/applications/[id]`
- [x] Display all application fields in organized layout
- [x] Inline editing for each field (click to edit, save/cancel)
- [x] Validation on inline edits
- [x] Notes section showing chronological history
- [x] Documents section listing uploaded files (placeholder, full implementation in #24)
- [x] Status change dropdown with confirmation
- [x] "Delete Application" button with confirmation modal
- [x] Breadcrumb navigation back to dashboard
- [x] Loading state while fetching application
- [x] 404 page if application not found or unauthorized
- [x] E2E test: navigate from list → detail → edit → save (framework created, needs auth)

**Technical Notes:**
- Use React Hook Form for inline editing
- Implement optimistic updates with rollback on error
- Prefetch application data on hover in list view

---

### Ticket #9: Kanban Board View for Applications ✅ COMPLETE
**Priority:** P1 | **Complexity:** L | **Dependencies:** #5

**Description:**
Implement drag-and-drop kanban board as alternative view to table, with columns for each application status.

**Acceptance Criteria:**
- [x] Toggle between table and kanban views on dashboard
- [x] Columns: Bookmarked, Applied, Screening, Interviewing, Offer, Rejected, Accepted, Withdrawn
- [x] Drag application cards between columns to update status
- [x] Card displays: company, position, application date, location
- [x] Click card to open detail page
- [x] Horizontal scroll for columns on smaller screens
- [x] Optimistic status update on drag
- [x] Rollback if database update fails
- [x] Empty column states with count (e.g., "0 in Screening")
- [x] Keyboard navigation for accessibility (via dnd-kit)
- [x] E2E test: drag card from Applied → Screening (framework ready, needs auth)

**Technical Notes:**
- Use dnd-kit library for drag-and-drop
- Store view preference in localStorage
- Limit cards per column to 50 for performance
- Update status via Supabase server action with optimistic UI

---

## Epic 3: AI-Powered Features

### Ticket #10: Anthropic Claude API Integration Setup
**Priority:** P0 | **Complexity:** M | **Dependencies:** #3

**Description:**
Configure Anthropic Claude API client with prompt caching, rate limiting, and error handling infrastructure.

**Acceptance Criteria:**
- [x] Anthropic SDK installed and configured
- [x] API key stored securely in environment variables
- [x] Wrapper service with retry logic (exponential backoff)
- [ ] Prompt caching implemented for common system prompts (deferred to feature tickets #12-14)
- [x] Rate limiting: 10 resume parses/hour, 50 summaries/hour per user
- [x] Error handling for quota exceeded, network failures
- [x] Usage tracking in PostgreSQL (`ai_usage` table)
- [x] Unit tests with mocked API responses
- [x] Documentation for AI service usage

**Technical Notes:**
- Use `@anthropic-ai/sdk` package
- Cache system prompts with 5-minute TTL
- Log all AI requests for cost monitoring

---

### Ticket #11: Resume Upload & Storage
**Priority:** P1 | **Complexity:** M | **Dependencies:** #3

**Description:**
Implement secure file upload for resumes (PDF/DOCX) with validation and Supabase Storage integration.

**Acceptance Criteria:**
- [ ] File upload component with drag-and-drop
- [ ] Accept only PDF and DOCX formats (max 5MB)
- [ ] Client-side file type and size validation
- [ ] Upload to Supabase Storage bucket `resumes` at `{userId}/{filename}`
- [ ] Generate signed download URLs (1-hour expiration)
- [ ] Display upload progress bar
- [ ] Store resume metadata in PostgreSQL `profiles` table
- [ ] User can upload multiple resume versions
- [ ] Delete resume option with Storage cleanup
- [ ] E2E test: upload PDF, verify storage, delete

**Technical Notes:**
- Use Supabase Storage SDK
- Implement chunked upload for large files
- Configure storage bucket policies for secure access

---

### Ticket #12: AI Resume Parsing
**Priority:** P1 | **Complexity:** L | **Dependencies:** #10, #11

**Description:**
Parse uploaded resumes using Claude API to extract structured data (skills, experience, education) and store in user profile.

**Acceptance Criteria:**
- [ ] Trigger parsing automatically after resume upload
- [ ] Extract: skills (array), work experience (array of objects), education (array)
- [ ] Extract: contact info (email, phone, LinkedIn), summary/objective
- [ ] Store parsed data in `profiles` table (JSONB columns for experience/education)
- [ ] Show parsing progress indicator
- [ ] Display extracted data in profile page with edit capability
- [ ] Handle parsing failures gracefully (retry option)
- [ ] PII redaction before logging (no emails/phones in logs)
- [ ] Cost optimization: cache system prompt, use prompt caching
- [ ] Track usage in `ai_usage` table
- [ ] Unit tests with sample resume fixtures
- [ ] E2E test: upload resume → verify parsed data appears

**Prompt Design:**
```
System: Extract structured data from the following resume. Return JSON with:
{ skills: string[], experience: [{ company, title, startDate, endDate, description }],
  education: [{ institution, degree, field, graduationDate }] }
User: [Resume text from PDF extraction]
```

**Technical Notes:**
- Use `pdf-parse` for PDF text extraction
- Use `mammoth` for DOCX extraction
- Implement prompt caching with resume format examples
- Store AI usage metrics in PostgreSQL for cost tracking

---

### Ticket #13: Job Description Analysis & Match Scoring
**Priority:** P1 | **Complexity:** L | **Dependencies:** #10, #12

**Description:**
Analyze job descriptions against user profile to generate compatibility score (0-100) with highlighted matches and gaps.

**Acceptance Criteria:**
- [ ] "Analyze Job" button on application detail page
- [ ] Parse job description from `jobDescription` field or `jobUrl`
- [ ] Compare job requirements against user's parsed resume data
- [ ] Generate match score (0-100) with explanation
- [ ] Highlight: matching skills, missing skills, experience alignment
- [ ] Store score and analysis in application document
- [ ] Display score badge on application cards (color-coded)
- [ ] Regenerate analysis if job description changes
- [ ] Rate limiting: 20 analyses/hour per user
- [ ] E2E test: paste job description → analyze → verify score

**Scoring Logic:**
- Skills match: 40 points (percentage of required skills user has)
- Experience match: 30 points (years + relevance)
- Education match: 15 points
- Other factors: 15 points (certifications, location, etc.)

**Technical Notes:**
- Use Claude for semantic skill matching (not just keyword)
- Cache analysis results for 7 days
- Show loading state during analysis (10-15 seconds)

---

### Ticket #14: Notes Summarization
**Priority:** P1 | **Complexity:** M | **Dependencies:** #10

**Description:**
Auto-generate concise summaries from user notes on applications, highlighting key insights and action items.

**Acceptance Criteria:**
- [ ] "Summarize Notes" button on application detail page
- [ ] Summarize all notes for that application
- [ ] Extract: key insights, action items, follow-up needs
- [ ] Display summary in collapsible section
- [ ] Summary updates when new notes added (manual trigger)
- [ ] Store summary in application document (`notesSummary` field)
- [ ] Rate limiting: 50 summaries/hour per user
- [ ] Handle cases with no notes gracefully
- [ ] Unit tests with sample notes
- [ ] E2E test: add 3 notes → summarize → verify output

**Prompt Design:**
```
System: Summarize the following notes about a job application.
Extract: main insights, action items, follow-up recommendations.
User: [All notes concatenated]
```

**Technical Notes:**
- Concatenate notes with timestamps
- Use prompt caching for system prompt
- Max 5000 characters of notes input

---

### Ticket #15: Follow-Up Suggestions
**Priority:** P2 | **Complexity:** M | **Dependencies:** #10

**Description:**
Generate context-aware follow-up suggestions based on application status, timeline, and interaction history.

**Acceptance Criteria:**
- [ ] Suggestions appear on application detail page
- [ ] Trigger automatically when status changes or 7 days pass
- [ ] Suggest: when to follow up, what to say, whom to contact
- [ ] Contextualize based on: status, days since last interaction, company norms
- [ ] User can dismiss or snooze suggestions
- [ ] Store suggestions in `followUpSuggestions` subcollection
- [ ] Display count of pending suggestions on dashboard
- [ ] E2E test: create app → wait (mock time) → verify suggestion

**Suggestion Examples:**
- Applied + 7 days → "Follow up via email to confirm receipt"
- Screening + 3 days → "Send thank-you note to recruiter"
- Interview + 1 day → "Ask about timeline for next steps"

**Technical Notes:**
- Use Supabase Edge Functions with cron trigger (daily check)
- Generate suggestions in batch to reduce API calls
- Allow user customization of suggestion frequency
- Store suggestions in PostgreSQL with timestamps

---

## Epic 4: Networking & Contacts

### Ticket #16: Contact Management - Data Model & CRUD
**Priority:** P2 | **Complexity:** M | **Dependencies:** #4

**Description:**
Implement contact management system for tracking recruiters, referrals, and professional connections.

**Acceptance Criteria:**
- [ ] PostgreSQL `contacts` table with columns: name, email, phone, company, title, LinkedIn, notes, tags
- [ ] CRUD API routes: create, read, update, delete contacts
- [ ] Link contacts to applications via foreign key `referral_contact_id`
- [ ] Contact list page at `/dashboard/contacts`
- [ ] Search contacts by name, company, or tag
- [ ] Sort by: name, company, last interaction date
- [ ] Import contact from LinkedIn URL (scrape name, title, company)
- [ ] Unit tests for contact service
- [ ] E2E test: create contact → link to application

**Technical Notes:**
- Use foreign key relationship for contact-application links
- Implement soft delete for contacts (optional)
- Create indexes for search performance

---

### Ticket #17: Interaction History Tracking
**Priority:** P2 | **Complexity:** M | **Dependencies:** #16

**Description:**
Track all interactions with contacts (emails, calls, meetings) with timeline view and relationship scoring.

**Acceptance Criteria:**
- [ ] `contact_interactions` table with foreign key to contacts
- [ ] Log interaction: type (email/call/meeting), date, notes, outcome
- [ ] Timeline view on contact detail page
- [ ] Quick-add interaction button (pre-fills date to today)
- [ ] Calculate "relationship strength" based on interaction frequency
- [ ] Display last interaction date on contact cards
- [ ] Filter interactions by type and date range
- [ ] E2E test: add interaction → verify in timeline

**Interaction Types:**
- Email sent/received
- Phone call
- Coffee chat / informational interview
- LinkedIn message
- Networking event

**Technical Notes:**
- Use `created_at` for chronological sorting
- Relationship strength: interactions in last 30 days weighted
- Update `last_interaction` on contacts table via trigger

---

### Ticket #18: Referral Tracking
**Priority:** P2 | **Complexity:** S | **Dependencies:** #16

**Description:**
Link contacts to applications as referrals and track referral effectiveness.

**Acceptance Criteria:**
- [ ] "Add Referral" button on application detail page
- [ ] Select contact from dropdown (autocomplete search)
- [ ] Display referral badge on application card
- [ ] Track referral conversion rate (referred apps → interviews)
- [ ] Show referral stats on contact detail page
- [ ] Filter applications by "Has Referral" on dashboard
- [ ] E2E test: link contact as referral → verify badge

**Technical Notes:**
- Store referral contact ID in application document
- Calculate conversion in analytics dashboard

---

## Epic 5: Mental Health & Progress Tracking

### Ticket #19: Dashboard Analytics & Visualizations
**Priority:** P1 | **Complexity:** L | **Dependencies:** #5

**Description:**
Build analytics dashboard with key metrics, trend charts, and progress visualization to combat job search burnout.

**Acceptance Criteria:**
- [ ] Metrics cards: total apps, response rate, interview rate, avg. days to response
- [ ] Trend chart: applications per week (bar chart, last 12 weeks)
- [ ] Status distribution pie chart
- [ ] Application funnel: Applied → Screening → Interview → Offer
- [ ] Top companies applied to (list with counts)
- [ ] Average match score across all applications
- [ ] Week-over-week comparison indicators (↑↓)
- [ ] Date range filter (last 30/60/90 days)
- [ ] E2E test: verify metrics calculate correctly

**Technical Notes:**
- Use Recharts or Chart.js for visualizations
- Calculate metrics server-side for performance
- Cache aggregated data for 1 hour

---

### Ticket #20: Wins Celebration System
**Priority:** P2 | **Complexity:** M | **Dependencies:** #5

**Description:**
Highlight positive milestones and achievements to boost morale during job search.

**Acceptance Criteria:**
- [ ] Detect wins: first application, first response, first interview, first offer
- [ ] Display celebratory modal/toast on milestone achievement
- [ ] "Wins" section on dashboard showing recent achievements
- [ ] Badges/icons for different milestone types
- [ ] Share win to social media (optional, with privacy controls)
- [ ] Weekly digest email: "Your Progress This Week"
- [ ] E2E test: trigger milestone → verify celebration appears

**Milestone Examples:**
- "First Application Submitted!"
- "10 Applications Milestone"
- "First Interview Scheduled!"
- "Response Received!" (any positive response)

**Technical Notes:**
- Store milestones in `milestones` table
- Use PostgreSQL triggers or Edge Functions to detect milestones
- Email via third-party service (Resend/SendGrid) through Edge Functions

---

### Ticket #21: Activity Insights & Burnout Indicators
**Priority:** P2 | **Complexity:** M | **Dependencies:** #19

**Description:**
Analyze user activity patterns to identify potential burnout and suggest healthy pacing.

**Acceptance Criteria:**
- [ ] Track daily application submissions and note-taking
- [ ] Detect burnout signals: 20+ apps/week, no activity for 7+ days, high rejection rate
- [ ] Display gentle prompts: "Take a break today" or "Quality over quantity"
- [ ] Weekly insights summary: "You applied to 15 jobs this week"
- [ ] Suggest optimal pacing based on user's baseline
- [ ] Privacy controls: user can disable insights
- [ ] E2E test: simulate high activity → verify burnout prompt

**Burnout Signals:**
- Sudden spike in applications (3x baseline)
- Zero applications for 7+ days after active period
- Rejection rate >80% in last 10 applications

**Technical Notes:**
- Calculate insights using Supabase Edge Functions (weekly cron schedule)
- Store insights in `insights` table

---

## Epic 6: Advanced Features & Polish

### Ticket #22: Bulk Operations for Applications
**Priority:** P2 | **Complexity:** M | **Dependencies:** #6

**Description:**
Enable bulk actions on multiple applications from table view (status change, tag addition, deletion).

**Acceptance Criteria:**
- [ ] Checkbox selection for multiple applications
- [ ] "Select All" checkbox in table header
- [ ] Bulk actions dropdown: Change Status, Add Tag, Delete
- [ ] Confirmation modal for destructive actions (delete)
- [ ] Optimistic UI updates with rollback
- [ ] Max 50 applications per bulk operation
- [ ] Success toast shows count of affected items
- [ ] E2E test: select 3 apps → change status → verify

**Technical Notes:**
- Use Supabase batch updates (PostgreSQL transactions)
- Implement chunking for >50 items

---

### Ticket #23: Advanced Search & Filtering
**Priority:** P2 | **Complexity:** M | **Dependencies:** #6

**Description:**
Implement advanced filtering with multiple criteria, saved filters, and full-text search.

**Acceptance Criteria:**
- [ ] Filter panel with: status, date range, location, work mode, salary range, tags
- [ ] Full-text search across company, position, job description
- [ ] Combine multiple filters (AND logic)
- [ ] Save filter presets (e.g., "Remote Senior Roles")
- [ ] Clear all filters button
- [ ] Filter state persists in URL query params
- [ ] Display active filter count badge
- [ ] E2E test: apply filters → verify results → save preset

**Technical Notes:**
- Use PostgreSQL queries with proper indexing
- Implement full-text search using PostgreSQL's tsvector (or pg_search)
- Consider Algolia for advanced search (post-MVP)

---

### Ticket #24: Document Management - Multiple Files per Application
**Priority:** P2 | **Complexity:** M | **Dependencies:** #11

**Description:**
Allow users to attach multiple documents to applications (cover letters, portfolios, correspondence).

**Acceptance Criteria:**
- [ ] Upload multiple files per application
- [ ] Supported formats: PDF, DOCX, TXT, images (JPG, PNG)
- [ ] File size limit: 10MB per file, 50MB total per application
- [ ] Display file list with name, size, upload date
- [ ] Download and delete individual files
- [ ] Inline preview for PDFs and images
- [ ] Document tagging: "Cover Letter", "Portfolio", "Correspondence"
- [ ] E2E test: upload 3 files → verify list → delete one

**Technical Notes:**
- Store in Supabase Storage bucket `documents`: `{userId}/applications/{appId}/{filename}`
- Store metadata in `application_documents` table

---

### Ticket #25: Email Integration - Log Correspondence
**Priority:** P3 | **Complexity:** L | **Dependencies:** #5

**Description:**
Integrate with email (Gmail API) to automatically log correspondence related to job applications.

**Acceptance Criteria:**
- [ ] OAuth connection to Gmail
- [ ] Scan inbox for emails matching application companies
- [ ] Suggest linking emails to applications
- [ ] User confirms or rejects suggestions
- [ ] Store email metadata (subject, date, sender) in `correspondence` subcollection
- [ ] Display correspondence timeline on application detail
- [ ] Privacy controls: user can disconnect email access
- [ ] E2E test: connect Gmail → verify email suggestion

**Technical Notes:**
- Use Gmail API with read-only scope
- Match emails by company domain or job title keywords
- Implement periodic sync (every 6 hours)

---

### Ticket #26: Export & GDPR Compliance
**Priority:** P1 | **Complexity:** M | **Dependencies:** #5

**Description:**
Enable users to export all their data and request account deletion in compliance with GDPR.

**Acceptance Criteria:**
- [ ] "Export Data" button in settings
- [ ] Generate JSON export of all user data (applications, notes, contacts, profile)
- [ ] Generate CSV export for applications (compatible with Excel)
- [ ] Download link expires after 1 hour
- [ ] "Delete Account" option with confirmation
- [ ] Account deletion removes all PostgreSQL data and Storage files
- [ ] 30-day grace period before permanent deletion
- [ ] Email confirmation after export and deletion requests
- [ ] E2E test: request export → download JSON → verify contents

**Export Format:**
- JSON: complete data dump with nested structure
- CSV: flattened applications table

**Technical Notes:**
- Use Supabase Edge Functions to generate exports (async)
- Store export files temporarily in Supabase Storage
- Use PostgreSQL CASCADE delete for related records

---

### Ticket #27: Multi-Provider Authentication (LinkedIn, Microsoft)
**Priority:** P2 | **Complexity:** M | **Dependencies:** #3

**Description:**
Add LinkedIn and Microsoft as additional OAuth providers for authentication.

**Acceptance Criteria:**
- [ ] LinkedIn OAuth configured in Supabase
- [ ] Microsoft OAuth configured in Supabase
- [ ] Login page shows all three options: Google, LinkedIn, Microsoft
- [ ] Account linking: user can add additional providers to existing account
- [ ] Settings page shows connected providers with unlink option
- [ ] Profile enrichment: import name, email, photo from provider
- [ ] E2E test: sign up with LinkedIn → link Microsoft → unlink LinkedIn

**Technical Notes:**
- Use Supabase Auth's built-in multi-provider support
- Handle email conflicts (same email, different provider)
- Configure OAuth apps in respective provider dashboards

---

### Ticket #28: Responsive Design - Mobile Optimization
**Priority:** P2 | **Complexity:** L | **Dependencies:** #6, #9

**Description:**
Optimize all pages for mobile devices with touch-friendly interactions and simplified layouts.

**Acceptance Criteria:**
- [ ] Dashboard table collapses to card view on mobile (<768px)
- [ ] Kanban board horizontal scroll on mobile
- [ ] Bottom navigation bar on mobile (Dashboard, Add, Profile)
- [ ] Touch gestures: swipe to delete application card
- [ ] Forms use mobile-optimized inputs (date pickers, dropdowns)
- [ ] All buttons minimum 44x44px touch targets
- [ ] Test on iOS Safari and Android Chrome
- [ ] E2E test on mobile viewport: create app → view list → drag kanban card

**Technical Notes:**
- Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`)
- Test with Playwright mobile emulation
- Consider progressive web app (PWA) features post-MVP

---

### Ticket #29: Notification System
**Priority:** P2 | **Complexity:** M | **Dependencies:** #15

**Description:**
Implement in-app and email notifications for follow-up reminders, milestone achievements, and weekly digests.

**Acceptance Criteria:**
- [ ] In-app notification center with unread count badge
- [ ] Notification types: Follow-up due, Milestone achieved, Weekly digest
- [ ] Mark as read/unread functionality
- [ ] Email notifications with opt-in/opt-out controls
- [ ] Email templates: Follow-up reminder, Weekly progress digest
- [ ] Notification preferences page (granular controls per type)
- [ ] Push notifications (browser) for critical reminders
- [ ] E2E test: trigger follow-up → verify in-app notification → verify email sent

**Technical Notes:**
- Use Supabase Edge Functions for push notifications
- Use third-party email service (SendGrid/Resend) via Edge Functions
- Store notifications in `notifications` table

---

### Ticket #30: Performance Optimization & Monitoring
**Priority:** P1 | **Complexity:** M | **Dependencies:** All core features

**Description:**
Optimize application performance, implement monitoring, and set up error tracking for production readiness.

**Acceptance Criteria:**
- [ ] Lighthouse score: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO
- [ ] Implement code splitting for heavy pages (kanban, analytics)
- [ ] Image optimization with Next.js Image component
- [ ] Prefetch data on link hover
- [ ] Vercel Analytics integrated
- [ ] Error tracking with Sentry or Vercel Error Monitoring
- [ ] Performance monitoring: track slow database queries via Supabase dashboard
- [ ] Set up uptime monitoring (Vercel or UptimeRobot)
- [ ] Bundle size analysis: keep initial load <100KB gzipped

**Technical Notes:**
- Use `next/dynamic` for code splitting
- Implement service worker for offline support (optional)
- Monitor Core Web Vitals: LCP, FID, CLS
- Use Vercel Speed Insights for real-user monitoring

---

## Post-MVP Enhancements (Future Backlog)

### Ticket #31: Skills Gap Analysis & Course Recommendations
**Priority:** P3 | **Complexity:** L

**Description:**
Analyze job requirements across all applications to identify skill gaps and recommend online courses.

**Acceptance Criteria:**
- [ ] Aggregate required skills from all job descriptions
- [ ] Compare against user's resume skills
- [ ] Highlight top 5 missing skills
- [ ] Recommend courses from Coursera, Udemy, LinkedIn Learning
- [ ] Track course completion and update resume

---

### Ticket #32: Team Collaboration for Recruiters
**Priority:** P3 | **Complexity:** L

**Description:**
Enable recruiters to invite team members, assign candidates, and collaborate on evaluations.

**Acceptance Criteria:**
- [ ] Organization accounts with team member invites
- [ ] Role-based permissions: Admin, Recruiter, Viewer
- [ ] Shared candidate pipeline
- [ ] Comments and internal notes (not visible to candidates)
- [ ] Activity feed for team actions

---

### Ticket #33: Integration Marketplace - ATS Imports
**Priority:** P3 | **Complexity:** L

**Description:**
Allow users to import applications from popular job boards (LinkedIn, Indeed, Glassdoor) and ATS systems.

**Acceptance Criteria:**
- [ ] LinkedIn Easy Apply import via OAuth
- [ ] Indeed application history import
- [ ] Greenhouse ATS integration (for recruiters)
- [ ] Bulk import with deduplication
- [ ] Mapping import fields to application schema

---

## Development Workflow Notes

**Sprint Planning:**
- 2-week sprints, 5-7 tickets per sprint
- Start with Epic 1 tickets #1-3 in Sprint 1
- Maintain parallel tracks: backend + frontend
- Reserve 20% capacity for bug fixes and refinements

**Definition of Done (DoD) Reminder:**
Every ticket must satisfy:
1. `npm run lint` passes
2. `npm run build` passes
3. Tests pass (unit + E2E smoke for changed flow)
4. No `any` types without justification
5. Error and loading states implemented
6. Security: input validation + auth checks on writes

**Estimation Guide:**
- **S (Small):** 1-3 days, low complexity, clear requirements
- **M (Medium):** 4-7 days, moderate complexity, some unknowns
- **L (Large):** 8-12 days, high complexity, significant integration
