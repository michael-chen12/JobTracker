/* eslint-disable react-hooks/rules-of-hooks */
// Playwright fixtures use a function called `use()` which triggers the React hooks
// lint rule. This file has no React components — disable the rule for the whole file.
import { test as base, expect, Page, devices } from '@playwright/test';
import * as fs from 'fs';

// Re-export commonly used Playwright primitives so test files can import from one place
export type { Page };
export { devices };

// ─── Auth state path ────────────────────────────────────────────────────────
const AUTH_FILE = 'tests/.auth/user.json';

/** True when a saved auth session exists (global-setup ran successfully). */
export const hasAuthState = () => fs.existsSync(AUTH_FILE);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TestApplication {
  company: string;
  position: string;
  status?: string;
  location?: string;
  jobUrl?: string;
}

export interface CreatedApplication {
  company: string;
  position: string;
  /** Cleanup function — call in afterEach or use the `autoCleanup` fixture */
  cleanup: () => Promise<void>;
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

type E2EFixtures = {
  /** Page pre-loaded with the saved auth session */
  authPage: Page;
  /**
   * Helper that creates a job application via the UI and returns a cleanup
   * function. Pair with `afterEach` or the `autoCleanup` fixture.
   */
  createApp: (app: TestApplication) => Promise<CreatedApplication>;
};

export const test = base.extend<E2EFixtures>({
  // Load saved auth state for every test that uses `authPage`
  authPage: async ({ browser }, use) => {
    if (!hasAuthState()) {
      // Allow the test to run but it will likely fail — surface clear message
      console.warn(
        '[e2e-fixtures] Auth state not found. ' +
          'Run global-setup or set TEST_USER_EMAIL/TEST_USER_PASSWORD.'
      );
      const page = await browser.newPage();
      await use(page);
      await page.close();
      return;
    }

    const context = await browser.newContext({
      storageState: AUTH_FILE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Factory: creates a test application via the Add Application dialog
  createApp: async ({ authPage }, use) => {
    const created: CreatedApplication[] = [];

    const factory = async (app: TestApplication): Promise<CreatedApplication> => {
      // Open the dashboard
      await authPage.goto('/dashboard');
      await authPage.waitForLoadState('networkidle');

      // Click the "New Application" button
      const newBtn = authPage.getByRole('button', { name: /new application/i });
      await expect(newBtn).toBeVisible({ timeout: 10000 });
      await newBtn.click();

      // Wait for the form dialog
      await authPage.waitForSelector('[role="dialog"]');

      // Fill required fields
      await authPage.fill('[name="company_name"]', app.company);
      await authPage.fill('[name="position_title"]', app.position);

      if (app.location) {
        await authPage.fill('[name="location"]', app.location);
      }
      if (app.jobUrl) {
        await authPage.fill('[name="job_url"]', app.jobUrl);
      }

      // Submit
      await authPage.click('button[type="submit"]');

      // Wait for dialog to close (success)
      await authPage.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });

      const result: CreatedApplication = {
        company: app.company,
        position: app.position,
        cleanup: async () => {
          try {
            await authPage.goto('/dashboard');
            await authPage.waitForLoadState('networkidle');

            // Find the application row and delete it
            const row = authPage
              .getByRole('row')
              .filter({ hasText: app.company });

            if (await row.isVisible()) {
              // Open the actions menu (three-dots button) and delete
              await row.getByRole('button', { name: /actions|more/i }).click();
              await authPage.getByRole('menuitem', { name: /delete/i }).click();

              // Confirm the AlertDialog
              const confirmBtn = authPage
                .getByRole('alertdialog')
                .getByRole('button', { name: /delete/i });
              if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
              }
              await authPage.waitForTimeout(500);
            }
          } catch {
            // Cleanup failure is non-fatal — log and continue
            console.warn(`[e2e-fixtures] Failed to cleanup application: ${app.company}`);
          }
        },
      };

      created.push(result);
      return result;
    };

    await use(factory);

    // Auto-cleanup all created applications after the test
    for (const item of created) {
      await item.cleanup();
    }
  },
});

export { expect };
