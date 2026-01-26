# Job Application Tracker

An employer-grade job application tracking system with AI-powered features for resume parsing, notes summarization, and job description analysis.

## Features

- Track job applications with detailed status management
- Kanban board and table views for application organization
- AI-powered resume parsing and job analysis
- Notes management with AI summarization
- Document attachments and organization
- Dashboard analytics and insights

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.3
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **AI:** Anthropic Claude API
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest (unit) + Playwright (E2E)

## Prerequisites

- Node.js 20+ and npm
- Supabase account
- Google OAuth credentials (for authentication)
- Anthropic API key (for AI features)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd JobApplicationApp
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see sections below)

4. Run database migrations:

```bash
npx supabase migration up
```

5. Start the development server:

```bash
npm run dev
```

## Authentication Setup

This app uses Supabase Auth with Google OAuth for user authentication.

### Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from Settings > API
3. Enable Google OAuth provider in Authentication > Providers

### Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

### Add to Supabase

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Save changes

### Configure Environment

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npm test` - Run all tests (unit + E2E)
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run E2E tests

### Running Tests

Unit tests:
```bash
npm run test:unit
```

E2E tests:
```bash
npm run test:e2e
```

E2E tests with UI:
```bash
npm run test:e2e:ui
```

### Code Quality Standards

Every commit must pass:
- `npm run lint` - No ESLint errors or warnings
- `npm run build` - Successful production build
- `npm test` - All tests passing
- No `any` types without justification
- Error states and loading states included
- Input validation and auth checks for all write operations

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   ├── schemas/             # Zod validation schemas
│   ├── server/              # Server actions
│   └── types/               # TypeScript type definitions
├── tests/                   # E2E tests
├── supabase/
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

## Contributing

1. Follow the Definition of Done (DoD) for all PRs
2. Write tests for new features
3. Update documentation as needed
4. Run `npm run lint` and `npm run build` before committing

## License

MIT
