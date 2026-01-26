import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Resume Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This requires auth to be set up
    // For now, we'll create the test structure
    await page.goto('/dashboard/profile');
  });

  test('should upload PDF resume', async ({ page }) => {
    // Skip if not authenticated
    const isLoginPage = await page.url().includes('/auth/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Create a test PDF file
    const testFilePath = path.join(__dirname, 'fixtures/test-resume.pdf');

    // Click upload button
    await page.getByRole('button', { name: /select file/i }).click();

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await expect(page.getByText(/current resume/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /replace/i })).toBeVisible();
  });

  test('should delete resume', async ({ page }) => {
    // Skip if not authenticated or no resume
    const isLoginPage = await page.url().includes('/auth/login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check if resume exists
    const hasResume = await page.getByText(/current resume/i).isVisible();
    if (!hasResume) {
      test.skip();
      return;
    }

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).last().click();

    // Verify resume is deleted
    await expect(page.getByText(/upload resume/i)).toBeVisible({ timeout: 5000 });
  });
});
