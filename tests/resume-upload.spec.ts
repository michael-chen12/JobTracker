import { test, expect } from './fixtures/e2e-fixtures';
import path from 'path';

/**
 * E2E Tests: Resume Upload (Ticket #11)
 *
 * Uses authPage fixture so we're always authenticated.
 * PDF fixture at tests/fixtures/test-resume.pdf.
 */

test.describe('Resume Upload', () => {
  test('should display the resume upload section on the Profile page', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // Profile page should be visible (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard\/profile/);

    // Resume section heading
    await expect(page.getByText(/resume|cv/i)).toBeVisible({ timeout: 10000 });
  });

  test('should upload a PDF resume and show success state', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    const testFilePath = path.join(__dirname, 'fixtures/test-resume.pdf');

    // Locate the hidden file input and upload directly (avoids file chooser dialog)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10000 });
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload success — either "Current Resume" label or a success toast
    await expect(
      page.getByText(/current resume|uploaded successfully/i)
    ).toBeVisible({ timeout: 20000 });
  });

  test('should show a replace-resume option after uploading', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    const hasResume = await page.getByText(/current resume/i).isVisible().catch(() => false);

    if (!hasResume) {
      // Upload first
      const testFilePath = path.join(__dirname, 'fixtures/test-resume.pdf');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      await page.getByText(/current resume/i).waitFor({ timeout: 20000 });
    }

    // "Replace" or "Change" button should be visible
    await expect(
      page.getByRole('button', { name: /replace|change resume/i })
    ).toBeVisible({ timeout: 5000 });
  });
});
