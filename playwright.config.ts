import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * Auth strategy:
 *  1. The "setup" project runs `tests/global-setup.ts` once per run.
 *     It logs in via email/password and saves the session to
 *     `tests/.auth/user.json`.
 *  2. All browser projects declare `dependencies: ['setup']` so they
 *     wait for auth before running.
 *  3. Individual tests use the `authPage` fixture from
 *     `tests/fixtures/e2e-fixtures.ts` to get a pre-authenticated page.
 *
 * Environment variables (add to .env.test.local):
 *   TEST_USER_EMAIL=test@example.com
 *   TEST_USER_PASSWORD=your-test-password
 */

// Load test-specific env overrides when present
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local', override: false });

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Shared settings for all the projects below. */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── Auth setup ────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },

    // ── Desktop browsers (authenticated) ─────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      // Matches all spec files: tests/e2e/, tests/smoke/, and tests/ root
      testMatch: /tests\/(.+\/)?(?!smoke\.spec|example\.spec)[^/]+\.spec\.ts/,
    },

    // ── Mobile browsers (authenticated) ───────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      // Only run mobile-specific test files on mobile browsers
      testMatch: /tests\/e2e\/(mobile-responsive|notifications|ats-import)\.spec\.ts/,
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /tests\/e2e\/mobile-responsive\.spec\.ts/,
    },

    // ── Public / no-auth tests (no storageState, no setup dependency) ─────
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /tests\/(smoke\.spec|example\.spec)\.ts/,
    },
  ],

  /* Start the dev server before tests run */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
