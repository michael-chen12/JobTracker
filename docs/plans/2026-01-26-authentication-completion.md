# Authentication Flow Completion - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Google OAuth authentication with sign-in, sign-out, session persistence, and E2E tests

**Architecture:** Supabase Auth with Google OAuth provider, Next.js middleware for route protection, cookie-based session management

**Tech Stack:** Supabase Auth, Next.js 15, TypeScript, Playwright (E2E testing)

---

## Prerequisites Checklist

Before starting implementation, you must have:

- [ ] Active Supabase project (get URL and anon key from dashboard)
- [ ] Google OAuth credentials configured in Supabase dashboard
- [ ] `.env.local` file created from `.env.example` with real credentials
- [ ] `npm install` completed successfully

**How to configure Supabase Google OAuth:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URLs: `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`
4. Get Google OAuth credentials from Google Cloud Console
5. Add Client ID and Client Secret to Supabase

---

## Task 1: Environment Setup & Validation

**Files:**
- Modify: `.env.local` (create from `.env.example`)
- Read: `.env.example`

**Step 1: Create environment file**

```bash
cp .env.example .env.local
```

**Step 2: Fill in Supabase credentials**

Edit `.env.local` and add your actual Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Verify Supabase connection**

Run dev server and check for connection errors:

```bash
npm run dev
```

Expected: Server starts on port 3000 without Supabase connection errors

**Step 4: Verify Google OAuth configuration**

1. Visit `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. Should redirect to Google consent screen (not a 404 or error)

If you get errors, verify Supabase Google OAuth provider is enabled in dashboard

---

## Task 2: Add Sign-Out Functionality to Dashboard

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`
- Reference: `src/lib/supabase/auth.ts` (signOut already exists)

**Step 1: Add sign-out button to dashboard header**

Locate the header section in `DashboardClient.tsx` and add a sign-out button.

Current structure (approximate location):
```tsx
// Around line 20-40, in the header section
<div className="flex items-center justify-between">
  <h1>Welcome, {userName}</h1>
  {/* Add sign-out button here */}
</div>
```

**Step 2: Import dependencies**

Add to imports at the top of `DashboardClient.tsx`:

```tsx
import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
```

**Step 3: Add sign-out handler**

Inside the component function, add:

```tsx
const router = useRouter();
const [isSigningOut, setIsSigningOut] = useState(false);

const handleSignOut = async () => {
  try {
    setIsSigningOut(true);
    await signOut();
    router.push('/auth/login');
  } catch (error) {
    console.error('Sign out error:', error);
    // Show error toast if you have toast component
  } finally {
    setIsSigningOut(false);
  }
};
```

**Step 4: Add sign-out button UI**

Add this button in the header section:

```tsx
<button
  onClick={handleSignOut}
  disabled={isSigningOut}
  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSigningOut ? 'Signing out...' : 'Sign out'}
</button>
```

**Step 5: Manual test**

Run: `npm run dev`

1. Navigate to `http://localhost:3000/auth/login`
2. Sign in with Google
3. On dashboard, click "Sign out" button
4. Should redirect to login page
5. Try accessing `/dashboard` - should redirect to login (session cleared)

Expected: Sign-out works, cookies cleared, redirected to login

**Step 6: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx
git commit -m "feat: add sign-out functionality to dashboard"
```

---

## Task 3: Session Persistence Validation

**Files:**
- Test: Manual testing in browser
- Reference: `src/middleware.ts` (already handles session refresh)

**Step 1: Test session persistence on page refresh**

1. Sign in with Google
2. Land on dashboard
3. Refresh the page (Cmd+R / Ctrl+R)

Expected: User remains signed in, dashboard loads without redirect

**Step 2: Test session persistence across browser tabs**

1. Sign in on Tab 1
2. Open new tab, navigate to `http://localhost:3000/dashboard`

Expected: Dashboard loads without asking to sign in again

**Step 3: Test protected route access**

1. While signed in, visit `http://localhost:3000/dashboard/applications/some-id`

Expected: Protected routes accessible without redirect

**Step 4: Test session after sign-out**

1. Sign out from dashboard
2. Try accessing `http://localhost:3000/dashboard`

Expected: Redirect to `/auth/login?redirectTo=/dashboard`

**Step 5: Document findings**

If any tests fail, note the issue. Middleware in `src/middleware.ts` should handle all these cases automatically via Supabase cookie management.

---

## Task 4: E2E Authentication Tests - Setup Test User

**Files:**
- Create: `tests/helpers/auth.ts`
- Modify: `playwright.config.ts`
- Reference: `tests/smoke.spec.ts`

**Step 1: Create auth helper for tests**

Create `tests/helpers/auth.ts`:

```typescript
import { Page } from '@playwright/test';

/**
 * Sign in with Google OAuth for E2E tests
 *
 * IMPORTANT: This requires a real Google account or test account
 * For CI/CD, you'll need to set up test credentials
 *
 * For local testing:
 * 1. Use your personal Google account
 * 2. Or create a dedicated test account
 */
export async function signInWithGoogle(page: Page) {
  // Navigate to login
  await page.goto('http://localhost:3000/auth/login');

  // Click the Google sign-in button
  await page.click('button:has-text("Continue with Google")');

  // Wait for Google OAuth page to load
  await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });

  // MANUAL STEP: You need to sign in with Google
  // For automated testing, you would need to:
  // 1. Use Playwright's authentication storage
  // 2. Or use a test OAuth provider
  // 3. Or use Supabase's test mode (if available)

  // For now, this is a placeholder that developers run manually
  console.log('Please complete Google sign-in in the browser window');

  // Wait for redirect back to app
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 60000 });

  // Verify we're signed in
  await page.waitForSelector('text=Welcome', { timeout: 5000 });
}

/**
 * Sign out from the application
 */
export async function signOut(page: Page) {
  await page.click('button:has-text("Sign out")');
  await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
}

/**
 * Save authentication state for reuse across tests
 * Run this once, then load the state in tests to skip sign-in
 */
export async function saveAuthState(page: Page, filePath: string) {
  await signInWithGoogle(page);
  await page.context().storageState({ path: filePath });
}
```

**Step 2: Create one-time auth setup script**

Create `tests/setup/auth-setup.ts`:

```typescript
import { chromium } from '@playwright/test';
import { saveAuthState } from '../helpers/auth';

/**
 * One-time setup: Sign in and save auth state
 * Run with: npx playwright test tests/setup/auth-setup.ts --headed
 *
 * This creates .auth/user.json that other tests can reuse
 */
async function setup() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Setting up authentication...');
    console.log('Please complete Google sign-in when the browser opens');

    await saveAuthState(page, '.auth/user.json');

    console.log('✅ Authentication state saved to .auth/user.json');
    console.log('Other tests can now use this state to skip sign-in');
  } catch (error) {
    console.error('❌ Auth setup failed:', error);
  } finally {
    await browser.close();
  }
}

setup();
```

**Step 3: Add .auth directory to .gitignore**

Add to `.gitignore`:

```
# Playwright auth state
.auth/
```

**Step 4: Update playwright.config.ts to support auth state**

Modify `playwright.config.ts` to add global setup:

```typescript
// Add to the config object
globalSetup: './tests/setup/global-setup.ts',

// In the 'use' section, add:
use: {
  // ... existing config

  // Load saved auth state if it exists
  // storageState: '.auth/user.json', // Uncomment after running auth-setup
},
```

**Step 5: Create global setup file**

Create `tests/setup/global-setup.ts`:

```typescript
/**
 * Global setup runs once before all tests
 * Checks if auth state exists
 */
async function globalSetup() {
  const fs = await import('fs');
  const authFile = '.auth/user.json';

  if (!fs.existsSync(authFile)) {
    console.log('⚠️  No auth state found.');
    console.log('Run: npx playwright test tests/setup/auth-setup.ts --headed');
    console.log('Then uncomment storageState in playwright.config.ts');
  }
}

export default globalSetup;
```

**Step 6: Create .auth directory**

```bash
mkdir -p .auth
```

**Step 7: Commit**

```bash
git add tests/helpers/auth.ts tests/setup/ .gitignore playwright.config.ts
git commit -m "test: add E2E auth helpers and setup infrastructure"
```

---

## Task 5: E2E Test - Complete Authentication Flow

**Files:**
- Create: `tests/auth-flow.spec.ts`

**Step 1: Write the authentication flow test**

Create `tests/auth-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { signInWithGoogle, signOut } from './helpers/auth';

/**
 * End-to-End Authentication Flow Tests
 *
 * SETUP REQUIRED:
 * 1. Run auth setup: npx playwright test tests/setup/auth-setup.ts --headed
 * 2. Uncomment storageState in playwright.config.ts
 * 3. Run these tests: npm test -- auth-flow.spec.ts
 */

test.describe('Authentication Flow', () => {
  test.skip(({ browserName }) => browserName !== 'chromium',
    'Google OAuth tests only run in Chromium');

  test('should complete full auth flow: sign-in → dashboard → sign-out', async ({ page }) => {
    // Start at login page
    await page.goto('http://localhost:3000/auth/login');

    // Verify login page loaded
    await expect(page).toHaveURL('http://localhost:3000/auth/login');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();

    // Sign in with Google (uses saved auth state or prompts manual login)
    await signInWithGoogle(page);

    // Verify landed on dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Verify sign-out button is present
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();

    // Sign out
    await signOut(page);

    // Verify redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should persist session on page refresh', async ({ page }) => {
    // Sign in first (or use saved state)
    await signInWithGoogle(page);

    // Verify on dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Refresh the page
    await page.reload();

    // Should still be on dashboard without redirect
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Clear all cookies to simulate logged-out state
    await page.context().clearCookies();

    // Try to access dashboard directly
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should include redirectTo parameter when redirected from protected route', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();

    // Try to access specific protected route
    await page.goto('http://localhost:3000/dashboard/applications/123');

    // Should redirect to login with redirectTo parameter
    await expect(page).toHaveURL(/\/auth\/login\?redirectTo=/);
  });
});
```

**Step 2: Run auth setup (one-time manual step)**

```bash
npx playwright test tests/setup/auth-setup.ts --headed
```

This will open a browser. Complete the Google sign-in manually.
The auth state will be saved to `.auth/user.json`.

**Step 3: Enable auth state in playwright.config.ts**

Uncomment this line in `playwright.config.ts`:

```typescript
use: {
  storageState: '.auth/user.json', // <- Uncomment this
}
```

**Step 4: Run the auth flow tests**

```bash
npm test -- auth-flow.spec.ts
```

Expected: All tests pass

**Step 5: Fix any failing tests**

If tests fail:
- Check Supabase OAuth configuration
- Verify environment variables
- Check that middleware is working (visit `/dashboard` while logged out)

**Step 6: Commit**

```bash
git add tests/auth-flow.spec.ts
git commit -m "test: add E2E authentication flow tests"
```

---

## Task 6: Update Smoke Tests to Work with Auth

**Files:**
- Modify: `tests/smoke.spec.ts`

**Step 1: Add auth helpers to smoke tests**

Modify `tests/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

/**
 * Smoke tests to verify basic application functionality
 * These tests don't require authentication
 */

test.describe('Application Smoke Tests - No Auth Required', () => {
  // Clear auth state for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load the landing page', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Verify the page loads without errors
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Should be redirected to auth/login due to middleware
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should display login page elements', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');

    // Verify the login page loads
    await expect(page).toHaveURL('http://localhost:3000/auth/login');

    // Check for Google sign-in button
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });
});

test.describe('Application Smoke Tests - With Auth', () => {
  // Use saved auth state (from .auth/user.json)
  test.use({ storageState: '.auth/user.json' });

  test('should load dashboard when authenticated', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Should stay on dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Verify dashboard content loads
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should have sign-out button on dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Verify sign-out button exists
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });
});
```

**Step 2: Run smoke tests**

```bash
npm test -- smoke.spec.ts
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/smoke.spec.ts
git commit -m "test: update smoke tests with auth scenarios"
```

---

## Task 7: Update Application Form Tests to Use Auth

**Files:**
- Modify: `tests/application-form.spec.ts`

**Step 1: Add auth state to application form tests**

At the top of `tests/application-form.spec.ts`, add:

```typescript
// Use saved auth state for all tests in this file
test.use({ storageState: '.auth/user.json' });
```

**Step 2: Remove auth workarounds**

Look for any skipped tests or comments mentioning "requires auth" and remove them since auth is now working.

**Step 3: Run application form tests**

```bash
npm test -- application-form.spec.ts
```

Expected: Tests pass (or reveal real bugs, not auth issues)

**Step 4: Commit**

```bash
git add tests/application-form.spec.ts
git commit -m "test: enable auth for application form E2E tests"
```

---

## Task 8: Update Application Detail Tests to Use Auth

**Files:**
- Modify: `tests/application-detail.spec.ts`

**Step 1: Add auth state**

At the top of `tests/application-detail.spec.ts`, add:

```typescript
// Use saved auth state for all tests in this file
test.use({ storageState: '.auth/user.json' });
```

**Step 2: Run application detail tests**

```bash
npm test -- application-detail.spec.ts
```

Expected: Tests pass

**Step 3: Commit**

```bash
git add tests/application-detail.spec.ts
git commit -m "test: enable auth for application detail E2E tests"
```

---

## Task 9: Documentation and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/MVP_BACKLOG.md`

**Step 1: Update README with auth setup instructions**

Add a new section in `README.md`:

```markdown
## Authentication Setup

This app uses Supabase Auth with Google OAuth.

### Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Go to Authentication → Providers → Enable Google
3. Get Google OAuth credentials from Google Cloud Console:
   - Go to https://console.cloud.google.com
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
4. Add credentials to Supabase Google provider settings

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### E2E Testing with Authentication

Tests require authenticated session:

```bash
# One-time setup: Save auth state
npx playwright test tests/setup/auth-setup.ts --headed

# Complete Google sign-in in the browser
# Auth state saved to .auth/user.json

# Run all tests
npm test
```

### Sign Out

Click "Sign out" button in dashboard header.
```

**Step 2: Update MVP_BACKLOG.md**

Mark Ticket #1 as complete:

```markdown
| Ticket | Title | Status |
|--------|-------|--------|
| #1 | End-to-End Vertical Slice | ✅ Complete |
```

Update acceptance criteria:

```markdown
### Ticket #1: End-to-End Vertical Slice - Authentication to First Application
**Priority:** P0 | **Complexity:** M | **Dependencies:** None

**Acceptance Criteria:**
- [x] User can sign in with Google OAuth via Supabase Auth
- [x] Authenticated user lands on `/dashboard` with empty state
- [x] User can create a job application with: company name, position, status (Applied)
- [x] Application appears on dashboard in a simple card/list view
- [x] User can add a text note to the application
- [x] Note displays below application card
- [x] User can sign out and session persists on refresh
- [x] E2E test covers: sign-in → create app → add note → sign-out
```

**Step 3: Commit**

```bash
git add README.md docs/MVP_BACKLOG.md
git commit -m "docs: update README and backlog for completed auth"
```

---

## Task 10: Run Full Test Suite and Build

**Files:**
- None (verification step)

**Step 1: Run linting**

```bash
npm run lint
```

Expected: No errors

**Step 2: Run TypeScript type checking**

```bash
npm run type-check
```

Expected: No errors

**Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Run all E2E tests**

```bash
npm test
```

Expected: All tests pass

**Step 5: Manual smoke test**

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Navigate to login: `http://localhost:3000/auth/login`
4. Sign in with Google
5. Verify dashboard loads
6. Create a new application
7. Add a note to the application
8. Sign out
9. Try accessing dashboard - should redirect to login
10. Sign in again - session persists on refresh

**Step 6: Document any issues**

If any tests fail or manual testing reveals bugs, document them and fix before proceeding.

---

## Definition of Done Checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] All E2E tests pass (`npm test`)
- [ ] No `any` types added
- [ ] Error states implemented (sign-in errors, sign-out errors)
- [ ] Loading states implemented (signing in, signing out)
- [ ] Security: Auth checks in middleware protect all `/dashboard/*` routes
- [ ] Session persistence verified on refresh
- [ ] Sign-out clears cookies and redirects to login
- [ ] E2E tests cover: sign-in → dashboard → sign-out flow
- [ ] Documentation updated (README, MVP_BACKLOG)
- [ ] All changes committed with descriptive messages

---

## Troubleshooting Common Issues

### Issue: "Invalid OAuth configuration"

**Solution:** Verify in Supabase dashboard:
- Google provider is enabled
- Client ID and Secret are correct
- Authorized redirect URIs include `http://localhost:3000/auth/callback`

### Issue: "Redirect URL mismatch"

**Solution:** Check `NEXT_PUBLIC_APP_URL` in `.env.local` matches the URL you're using (http://localhost:3000)

### Issue: E2E tests fail with "Timeout waiting for Google OAuth"

**Solution:**
- Run auth setup manually: `npx playwright test tests/setup/auth-setup.ts --headed`
- Verify `.auth/user.json` was created
- Uncomment `storageState` in `playwright.config.ts`

### Issue: Session doesn't persist on refresh

**Solution:**
- Check browser DevTools → Application → Cookies
- Verify Supabase auth cookies are being set
- Check middleware in `src/middleware.ts` is running (add console.log)

### Issue: Signed out but still can access dashboard

**Solution:**
- Clear browser cookies manually
- Verify `signOut()` in `src/lib/supabase/auth.ts` is being called
- Check Network tab for sign-out API call

---

## Next Steps After Completion

After Ticket #1 is complete, proceed to **Ticket #10: Anthropic Claude API Integration Setup** to enable AI features (resume parsing, notes summarization, etc.).

All auth infrastructure is now in place for future features.
