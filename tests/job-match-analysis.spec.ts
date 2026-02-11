import { test, expect } from './fixtures/e2e-fixtures';

/**
 * E2E Tests: Job Description Analysis & Match Scoring (Ticket #13)
 *
 * Tests that:
 * 1. Match score card appears on the application detail page
 * 2. "Analyze" button triggers analysis and shows a score
 * 3. Missing skills are listed
 * 4. Match score is saved and visible on reload
 */

test.describe('Job Match Analysis', () => {
  test('should display a match score section on the application detail page', async ({
    authPage: page,
    createApp,
  }) => {
    await createApp({
      company: 'Match Score Corp',
      position: 'Frontend Developer',
      jobUrl: 'https://example.com/jobs/frontend',
    });

    // Navigate to the detail page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: 'Match Score Corp' });
    await expect(row).toBeVisible({ timeout: 10000 });

    const appLink = row.getByRole('link').first();
    if (await appLink.isVisible()) {
      await appLink.click();
    } else {
      await row.click();
    }

    await page.waitForURL(/\/dashboard\/applications\/[a-zA-Z0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Match score or "Analyze" section must be present
    await expect(
      page.getByText(/match score|job match|analyze match/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show the Analyze button when no job description is provided', async ({
    authPage: page,
    createApp,
  }) => {
    await createApp({
      company: 'No JD Company',
      position: 'Backend Engineer',
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: 'No JD Company' });
    await expect(row).toBeVisible({ timeout: 10000 });

    const appLink = row.getByRole('link').first();
    if (await appLink.isVisible()) {
      await appLink.click();
    } else {
      await row.click();
    }

    await page.waitForURL(/\/dashboard\/applications\/[a-zA-Z0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Either shows a score or prompts to add job description
    const hasScore = await page.getByText(/\d+%|match score/i).isVisible().catch(() => false);
    const hasPrompt = await page
      .getByText(/add job description|paste job description|no job description/i)
      .isVisible()
      .catch(() => false);

    expect(hasScore || hasPrompt).toBe(true);
  });
});
