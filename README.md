# Job Application Tracker

I built this after losing track of which companies I'd applied to, who I'd emailed, and what version of my resume I'd sent where. Spreadsheets worked for a while, then they didn't.

This is a full job application tracker with Kanban + table views, AI-assisted resume parsing and job matching, a notification system, analytics, and a bunch of other stuff I kept adding as the job search dragged on.

---

## What it does

- **Track applications** — statuses, notes, contacts, documents, correspondence history. Everything in one place.
- **Kanban board** — drag-and-drop across Applied → Interview → Offer → Rejected. Also has a table view if you prefer that.
- **AI features** — paste a job description and it'll parse the requirements, compare them against your resume, and highlight skill gaps. Also generates follow-up email drafts and summarizes your notes.
- **Skills gap analysis** — shows you which skills are missing across your active applications. Pulls YouTube tutorials for each gap automatically.
- **Analytics** — application funnel, response rates by status, weekly digest. Useful once you have 20+ applications.
- **Notifications** — browser push + email. Reminders to follow up, alerts when something changes.
- **Contact tracking** — recruiters, hiring managers, referrals. Attach them to applications.
- **Document management** — upload resumes and cover letters per application so you always know what you sent.
- **Achievements / Wins** — keeps track of milestones so the process feels less like a grind.

---

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Supabase** — Postgres + Auth + Storage + Realtime
- **Anthropic Claude API** — AI features
- **Tailwind CSS + shadcn/ui**
- **Vitest** (unit) + **Playwright** (E2E)

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd JobApplicationApp
npm install
```

### 2. Set up environment variables

Create a `.env.local` at the root. You'll need:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (AI features)
ANTHROPIC_API_KEY=

# Optional: enables YouTube course recommendations
YOUTUBE_API_KEY=

# Optional: email notifications via Resend
RESEND_API_KEY=

# Web push (generate with web-push package)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

### 3. Run migrations

```bash
npx supabase db push
```

Or if you're working against a local Supabase instance:

```bash
npx supabase start
npx supabase migration up
```

### 4. Start the dev server

```bash
npm run dev
```

---

## Auth setup

Supports email/password, Google, GitHub, and LinkedIn OAuth. All configured through Supabase.

For Google OAuth: create credentials in [Google Cloud Console](https://console.cloud.google.com), add the Supabase callback URL (`https://<your-project>.supabase.co/auth/v1/callback`), then drop the client ID and secret into Supabase Dashboard → Authentication → Providers.

Same flow for GitHub and LinkedIn — create an OAuth app, grab the credentials, add them to Supabase.

---

## AI setup

Get an API key from [Anthropic](https://console.anthropic.com) and add it to `.env.local`. The AI features are rate-limited per user (10 resume parses/hour, 10 job analyses/hour, 50 note summaries/hour) to keep costs reasonable.

Rough cost per active user: ~$0.22/month with prompt caching enabled.

---

## Project structure

```
src/
  app/          Next.js pages (App Router)
  actions/      Server actions — one file per domain
  components/   UI components
  lib/          Supabase client, AI clients, utilities
  schemas/      Zod schemas
  types/        TypeScript types

tests/
  unit/         Vitest unit tests
  e2e/          Playwright E2E tests

supabase/
  migrations/   SQL migrations (run in order)
```

---

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test:unit    # vitest
npm run test:e2e     # playwright
npm run test:e2e:ui  # playwright with browser UI
```

---

## License

MIT
