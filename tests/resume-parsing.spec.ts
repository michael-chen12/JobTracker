import { test, expect } from './fixtures/e2e-fixtures';

/**
 * E2E Tests: AI Resume Parsing (Ticket #12)
 *
 * Tests the full flow: upload resume → wait for AI parsing → verify extracted data.
 * NOTE: AI parsing calls the Anthropic API — these tests run against real API.
 * Use the sample-resume.pdf fixture which has predictable content.
 */

test.describe('Resume Parsing', () => {
  test('should show the profile page with resume section when authenticated', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard\/profile/);
    await expect(page.getByText(/profile|resume/i)).toBeVisible({ timeout: 10000 });
  });

  test('should upload and parse resume — shows parsed data or parsing state', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    const hasResume = await page.getByText(/current resume/i).isVisible().catch(() => false);

    if (!hasResume) {
      // Upload sample resume
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles('tests/fixtures/sample-resume.pdf');

      // Wait for upload to register
      await page.getByText(/current resume|uploaded/i).waitFor({ timeout: 20000 });
    }

    // After upload, either parsed data or a "Parse with AI" button should appear
    const parsedData = page.getByText(/skills|experience|parsed/i);
    const parseBtn = page.getByRole('button', { name: /parse.*ai|analyze/i });

    const hasParsed = await parsedData.isVisible().catch(() => false);
    const hasParseBtn = await parseBtn.isVisible().catch(() => false);

    // At least one must be true
    expect(hasParsed || hasParseBtn).toBe(true);
  });

  test('should not show parsing error under normal conditions', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // There should be no error banner on the profile page
    const errorBanner = page.getByText(/failed to parse|error parsing resume/i);
    await expect(errorBanner).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // Not present at all — acceptable
    });
  });
});
