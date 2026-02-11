import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup: authenticates a test user once and saves the browser session
 * to `tests/.auth/user.json`. All subsequent tests load this saved state
 * instead of re-logging in, making the suite much faster.
 *
 * Requirements:
 *   TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test.local
 *   (or as CI environment variables). The test user must already exist in
 *   your Supabase project with email/password auth enabled.
 */
async function globalSetup(_config: FullConfig) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[global-setup] TEST_USER_EMAIL or TEST_USER_PASSWORD not set. ' +
        'Authenticated tests will be skipped. ' +
        'Create .env.test.local with these variables to enable them.'
    );
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the login page
    await page.goto('http://localhost:3000/auth/login');

    // Wait for the login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    // Fill in credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard (confirms successful auth)
    await page.waitForURL('**/dashboard**', { timeout: 20000 });

    // Persist cookies + localStorage so all test files can reuse this session
    await page.context().storageState({ path: 'tests/.auth/user.json' });

    console.log('[global-setup] Auth state saved to tests/.auth/user.json');
  } catch (error) {
    console.error(
      '[global-setup] Login failed. Check TEST_USER_EMAIL/TEST_USER_PASSWORD.',
      error
    );
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
