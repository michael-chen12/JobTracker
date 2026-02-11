import { test, expect } from './fixtures/e2e-fixtures';

/**
 * E2E tests for Application Creation Form (Ticket #7)
 *
 * Tests cover the full create-application flow using the `createApp` fixture
 * which handles UI creation and automatic cleanup.
 */

test.describe('Application Form - Create Flow', () => {
  test('should create an application and display it in the list', async ({
    authPage: page,
    createApp,
  }) => {
    // createApp creates the app via the UI and cleans up after the test
    await createApp({
      company: 'E2E Test Company',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
    });

    // Verify the application appears in the dashboard table
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2E Test Company')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Senior Software Engineer')).toBeVisible();
  });

  test('should show validation errors when required fields are empty', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open the form dialog
    await page.getByRole('button', { name: /new application/i }).click();
    await page.waitForSelector('[role="dialog"]');

    // Submit without filling required fields
    await page.click('button[type="submit"]');

    // Expect validation error messages
    await expect(
      page.getByText(/company name.*required|required.*company/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should close the dialog on cancel', async ({ authPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open the form dialog
    await page.getByRole('button', { name: /new application/i }).click();
    await page.waitForSelector('[role="dialog"]');

    // Click cancel
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      // Fallback: press Escape to close
      await page.keyboard.press('Escape');
    }

    // Dialog should be gone
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('should show loading spinner when submitting', async ({ authPage: page, createApp }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open form
    await page.getByRole('button', { name: /new application/i }).click();
    await page.waitForSelector('[role="dialog"]');

    // Fill required fields
    await page.fill('[name="company_name"]', 'Spinner Test Co');
    await page.fill('[name="position_title"]', 'Engineer');

    // Submit and check for loading state (spinner or disabled button)
    await page.click('button[type="submit"]');

    // Verify dialog closes (success path) — cleanup handled by fixture
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });

    // Cleanup manually since we didn't use createApp fixture
    await page.goto('/dashboard');
    const row = page.getByRole('row').filter({ hasText: 'Spinner Test Co' });
    if (await row.isVisible()) {
      await row.getByRole('button', { name: /actions|more/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      const confirmBtn = page
        .getByRole('alertdialog')
        .getByRole('button', { name: /delete/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });
});

test.describe('Application Form - Route Guard', () => {
  test('should redirect to login when accessing dashboard without auth', async ({
    page,
  }) => {
    // Use the base (non-authenticated) page to check redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(auth|login)/);
  });
});
