# AI Job Application Tracker - Project Brief

## Project Overview

An employer-grade job application tracking system with AI-powered assistance designed to transform the job search experience. The platform combines intelligent application management with mental health support to address the overwhelming challenges of modern job seeking.

## Vision

Reduce the stress and uncertainty of job hunting by providing actionable intelligence, progress visualization, and AI-driven insights that help users focus on quality applications and meaningful connections rather than volume alone.

## Target Users

### Primary: Recent Graduates & Active Job Seekers
**Pain Points:**
- Face 90% non-response rates despite submitting hundreds of applications
- Compete against 180+ applicants per position on average
- Struggle with motivation and mental health (50% report significant difficulties)
- Lack visibility into what's working vs. failing
- Miss follow-up opportunities due to poor organization
- Cannot track networking efforts or relationship progression

### Secondary: Recruiters for Small Businesses
**Pain Points:**
- Manage multiple candidates across various positions without enterprise tools
- Need efficient candidate evaluation and tracking
- Require centralized communication history

## Core Features

### Application Management
- Dual-view interface: Kanban board and sortable table
- Custom status workflows (Applied → Screening → Interview → Offer/Rejected)
- Bulk operations and filtering by company, role, date range, status
- Document attachment and version tracking

### AI-Powered Intelligence
- **Resume Parsing**: Extract structured data from PDF/DOCX uploads using Claude Sonnet 4.5
- **Job Match Scoring**: Analyze job descriptions against resume (0-100 compatibility score)
- **Notes Summarization**: Auto-generate insights from user notes and interactions
- **Follow-up Suggestions**: Context-aware reminders based on application stage and timeline

### Networking & Contacts
- Contact management with relationship tracking
- LinkedIn integration for profile enrichment
- Interaction history and conversation notes
- Referral tracking per application

### Mental Health & Progress
- Visual progress tracking with trend analysis
- Wins celebration (interviews secured, responses received)
- Weekly insights and motivation prompts
- Burnout indicators based on activity patterns

## Success Metrics

**User Engagement:**
- Active users (weekly): 60%+ retention
- Applications tracked per user: Average 40+ in first month
- AI feature adoption: 70%+ use resume parsing and job matching

**Outcome Metrics:**
- Interview conversion rate: Track improvement vs. baseline
- Response rate: Monitor positive engagement trends
- Time to offer: Measure cycle efficiency

**Business Metrics:**
- User acquisition cost: <$10 via organic and referral
- Monthly active users: 5,000 within 6 months
- Infrastructure cost: <$35/month (with prompt caching optimization)

## Technology Stack

**Frontend:**
- Next.js 15 (App Router) with React 19 and TypeScript 5.3
- shadcn/ui component library + Tailwind CSS
- dnd-kit (kanban drag-drop), TanStack Table (data grids)
- React Hook Form + Zod validation

**Backend & Infrastructure:**
- Firebase Auth (Google, LinkedIn, Microsoft OAuth)
- Cloud Firestore (NoSQL database)
- Firebase Storage (document uploads)
- Firebase App Hosting (deployment)

**AI Integration:**
- Anthropic Claude Sonnet 4.5 via API
- Prompt caching for cost optimization
- Rate limiting: 10 resume parses/hour, 50 summaries/hour

**Quality Assurance:**
- Vitest (unit and integration testing)
- Playwright (end-to-end testing)
- TypeScript strict mode, ESLint, Prettier

**Security:**
- Role-based access control (job seeker vs. recruiter)
- GDPR compliance (data export, right to deletion)
- PII redaction before AI processing
- Input validation at all API boundaries

## Development Principles

Every deliverable must satisfy:
1. Linting and build validation (`npm run lint`, `npm run build`)
2. Test coverage (unit + E2E smoke tests for changed flows)
3. No `any` types without justification
4. Error and loading states for all async operations
5. Security validation (input sanitization, auth checks on writes)

## Timeline & Scope

**MVP Target:** 8-10 weeks
- Weeks 1-2: Foundation (auth, database, basic CRUD)
- Weeks 3-5: Core features (application tracking, AI parsing)
- Weeks 6-7: Advanced features (networking, analytics)
- Weeks 8-9: Polish, testing, performance optimization
- Week 10: Beta launch preparation

**Post-MVP Enhancements:**
- Mobile responsive design improvements
- Advanced analytics and reporting
- Skills gap analysis and course recommendations
- Team collaboration features for recruiters
- Integration marketplace (ATS imports, job board connectors)
