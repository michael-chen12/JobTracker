import { test, expect } from '@playwright/test';

/**
 * E2E Test: Resume Upload and Parsing Flow
 *
 * Tests the complete workflow:
 * 1. Upload resume file
 * 2. Wait for parsing to complete
 * 3. Verify parsed data is displayed
 */
test.describe('Resume Parsing', () => {
  test('should upload resume, parse it with AI, and display extracted data', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/dashboard/profile');

    // Check if we're redirected to login (not authenticated)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      test.skip(true, 'Skipping test - user not authenticated');
      return;
    }

    // Wait for page to load
    await expect(page.getByText('Profile Settings')).toBeVisible();

    // Check if there's already a resume uploaded (from previous tests)
    const hasExistingResume = await page
      .getByText('Current Resume')
      .isVisible()
      .catch(() => false);

    if (hasExistingResume) {
      console.log('Existing resume found, test can verify display only');
      // If resume is already uploaded, just verify parsed data exists
      await expect(
        page.getByText(/parsed resume data|skills|experience/i)
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    // Locate file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Upload sample resume PDF
    await fileInput.setInputFiles('tests/fixtures/sample-resume.pdf');

    // Wait for upload success indicator
    await expect(page.getByText(/resume uploaded|current resume/i)).toBeVisible({
      timeout: 15000,
    });

    console.log('Resume uploaded successfully');

    // Wait for parsing to start
    await expect(
      page.getByText(/analyzing|parsing|ai is analyzing/i)
    ).toBeVisible({
      timeout: 5000,
    });

    console.log('AI parsing started');

    // Wait for parsing to complete (up to 45 seconds for AI processing)
    await expect(
      page.getByText(/parsed resume data|resume parsed successfully/i)
    ).toBeVisible({
      timeout: 45000,
    });

    console.log('Parsing completed successfully');

    // Verify parsed data sections are visible
    await expect(page.getByText(/skills/i)).toBeVisible();
    await expect(page.getByText(/experience|work experience/i)).toBeVisible();
    await expect(page.getByText(/education/i)).toBeVisible();

    console.log('Parsed resume sections verified');

    // Verify specific skills from sample resume are displayed
    const pageContent = await page.content();
    const hasJavaScript = pageContent.toLowerCase().includes('javascript');
    const hasTypeScript = pageContent.toLowerCase().includes('typescript');
    const hasReact = pageContent.toLowerCase().includes('react');

    expect(hasJavaScript || hasTypeScript || hasReact).toBeTruthy();

    console.log('Sample resume data verified');
  });

  test('should handle resume replacement', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/dashboard/profile');

    // Skip if not authenticated
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      test.skip(true, 'Skipping test - user not authenticated');
      return;
    }

    // Only run if resume already exists
    const hasExistingResume = await page
      .getByText('Current Resume')
      .isVisible()
      .catch(() => false);

    if (!hasExistingResume) {
      test.skip(true, 'Skipping test - no existing resume to replace');
      return;
    }

    // Click Replace button
    await page.getByRole('button', { name: /replace/i }).click();

    // Upload new file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-resume.pdf');

    // Verify upload succeeded
    await expect(page.getByText(/resume uploaded/i)).toBeVisible({
      timeout: 10000,
    });

    console.log('Resume replaced successfully');
  });
});
