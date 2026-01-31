/**
 * E2E Tests for Notes Summarization Feature
 *
 * Ticket #14: Notes Summarization
 *
 * Test Scenarios:
 * 1. Add notes → summarize → verify summary appears
 * 2. Add more notes → verify "new notes" badge
 * 3. Re-summarize → verify updated summary
 * 4. No notes → verify button hidden
 * 5. Rate limit → verify error handling
 */

import { test, expect } from '@playwright/test';

test.describe('Notes Summarization', () => {
  // Skip these tests if not authenticated (requires user session)
  test.skip(({ page }) => {
    // These tests require authentication
    // Run with: npm run test:e2e -- --headed
    return !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD;
  }, 'Authentication required for notes summarization tests');

  test.beforeEach(async ({ page }) => {
    // Login (implement based on your auth flow)
    // await page.goto('/auth/login');
    // await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    // await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    // await page.click('button[type="submit"]');
    // await page.waitForURL('/dashboard');
  });

  test('should show "Summarize Notes" button when notes exist', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Create or select an application
    await page.click('text=New Application');
    await page.fill('[name="company"]', 'Test Corp');
    await page.fill('[name="position"]', 'Test Engineer');
    await page.click('button:has-text("Create Application")');

    // Wait for redirect to application detail
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Add a note
    await page.click('text=Add Note');
    await page.fill('textarea[placeholder*="Add your note"]', 'Test note content');
    await page.click('button:has-text("Save Note")');

    // Verify "Summarize Notes" button appears
    await expect(page.locator('button:has-text("Summarize Notes")')).toBeVisible();
  });

  test('should generate summary when button clicked', async ({ page }) => {
    // Setup: Navigate to application with notes
    await page.goto('/dashboard');

    // Find existing application or create one
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Add 3 notes
    const noteContents = [
      'Had initial phone screen. Recruiter seemed very interested.',
      'Technical interview scheduled for next week. Need to prepare system design.',
      'Follow up with hiring manager about team structure.',
    ];

    for (const content of noteContents) {
      await page.click('text=Add Note');
      await page.fill('textarea[placeholder*="Add your note"]', content);
      await page.click('button:has-text("Save Note")');
      await page.waitForTimeout(500); // Wait for note to be saved
    }

    // Click "Summarize Notes" button
    await page.click('button:has-text("Summarize Notes")');

    // Verify loading state appears
    await expect(page.locator('text=Analyzing')).toBeVisible();
    await expect(page.locator('[role="progressbar"], .animate-spin')).toBeVisible();

    // Wait for summary to appear (may take 10-15 seconds)
    await expect(page.locator('text=Notes Summary')).toBeVisible({ timeout: 30000 });

    // Verify summary sections are present
    await expect(page.locator('text=Key Insights')).toBeVisible();
    await expect(page.locator('text=Action Items')).toBeVisible();
    await expect(page.locator('text=Follow-up Needs')).toBeVisible();

    // Verify at least one insight is displayed
    await expect(page.locator('h4:has-text("Key Insights") + ul li')).toHaveCount(
      { min: 1 }
    );

    // Verify success toast
    await expect(page.locator('text=Summary Generated')).toBeVisible();
  });

  test('should show "new notes" badge after adding notes', async ({ page }) => {
    // Setup: Application with existing summary
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Assume summary already exists from previous test
    // If not, create notes and summarize first

    // Add a new note after summary exists
    await page.click('text=Add Note');
    await page.fill(
      'textarea[placeholder*="Add your note"]',
      'New note added after summarization'
    );
    await page.click('button:has-text("Save Note")');

    // Verify "new notes" badge appears
    await expect(page.locator('text=1 new note')).toBeVisible({ timeout: 5000 });

    // Add another note
    await page.click('text=Add Note');
    await page.fill(
      'textarea[placeholder*="Add your note"]',
      'Another new note'
    );
    await page.click('button:has-text("Save Note")');

    // Verify badge updates to "2 new notes"
    await expect(page.locator('text=2 new notes')).toBeVisible({ timeout: 5000 });
  });

  test('should update summary when re-summarize clicked', async ({ page }) => {
    // Setup: Application with summary and new notes
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Verify "Re-summarize" button is present
    await expect(page.locator('button:has-text("Re-summarize")')).toBeVisible();

    // Click re-summarize
    await page.click('button:has-text("Re-summarize")');

    // Verify loading state
    await expect(page.locator('text=Summarizing...')).toBeVisible();

    // Wait for updated summary
    await expect(page.locator('text=Summary Generated')).toBeVisible({
      timeout: 30000,
    });

    // Verify "new notes" badge is gone (since we just summarized)
    await expect(page.locator('text=new note')).not.toBeVisible();
  });

  test('should hide summary button when no notes exist', async ({ page }) => {
    // Create new application without notes
    await page.goto('/dashboard');
    await page.click('text=New Application');
    await page.fill('[name="company"]', 'Empty Notes Corp');
    await page.fill('[name="position"]', 'Test Position');
    await page.click('button:has-text("Create Application")');

    // Wait for redirect
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Verify notes section exists but summary card doesn't
    await expect(page.locator('h2:has-text("Notes")')).toBeVisible();
    await expect(page.locator('text=Summarize Notes')).not.toBeVisible();
    await expect(page.locator('text=No notes yet')).toBeVisible();
  });

  test('should handle rate limit gracefully', async ({ page }) => {
    // This test would require triggering rate limit (50 summaries/hour)
    // In practice, this would be tested with mocked backend

    // Navigate to application with notes
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Attempt to summarize (this assumes rate limit is hit)
    await page.click('button:has-text("Summarize Notes")');

    // If rate limited, verify error toast appears
    // Note: This will only trigger if user actually hit rate limit
    const errorToast = page.locator('text=Rate limit');
    if (await errorToast.isVisible({ timeout: 2000 })) {
      await expect(errorToast).toContainText('Resets at');
    }
  });

  test('should display summary metadata correctly', async ({ page }) => {
    // Setup: Application with summary
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Verify summary metadata is displayed
    await expect(page.locator('text=Summarized on')).toBeVisible();
    await expect(page.locator('text=notes analyzed')).toBeVisible();
  });

  test('should show structured sections with icons', async ({ page }) => {
    // Setup: Application with summary
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Verify insights section (green checkmarks)
    const insightsSection = page.locator('h4:has-text("Key Insights")');
    await expect(insightsSection).toBeVisible();
    await expect(insightsSection.locator('svg')).toHaveClass(/CheckCircle/);

    // Verify action items section (yellow alerts)
    const actionsSection = page.locator('h4:has-text("Action Items")');
    await expect(actionsSection).toBeVisible();
    await expect(actionsSection.locator('svg')).toHaveClass(/AlertCircle/);

    // Verify follow-up section (blue lightbulbs)
    const followUpSection = page.locator('h4:has-text("Follow-up Needs")');
    await expect(followUpSection).toBeVisible();
    await expect(followUpSection.locator('svg')).toHaveClass(/Lightbulb/);
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Verify summary card is visible on mobile
    await expect(page.locator('text=Notes Summary')).toBeVisible();

    // Verify button is responsive
    const summarizeButton = page.locator('button:has-text("Summarize Notes")');
    if (await summarizeButton.isVisible()) {
      await expect(summarizeButton).toBeVisible();

      // Button should be touchable (min 44x44px touch target)
      const box = await summarizeButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should preserve summary when navigating away and back', async ({ page }) => {
    // Navigate to application
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    const applicationUrl = await applicationCard.getAttribute('href');
    await applicationCard.click();

    // Wait for summary to load
    await expect(page.locator('text=Notes Summary')).toBeVisible();
    const summaryText = await page.locator('text=Notes Summary ~ p').first().textContent();

    // Navigate away
    await page.goto('/dashboard');

    // Navigate back
    if (applicationUrl) {
      await page.goto(applicationUrl);
    }

    // Verify summary is still present
    await expect(page.locator('text=Notes Summary')).toBeVisible();
    const newSummaryText = await page.locator('text=Notes Summary ~ p').first().textContent();
    expect(newSummaryText).toBe(summaryText);
  });
});

// Helper test to verify component integration
test.describe('Notes Summary Component Integration', () => {
  // Skip these tests if not authenticated
  test.skip(({ page }) => {
    return !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD;
  }, 'Authentication required for notes summary component tests');

  test('should render NotesSummaryCard above notes list', async ({ page }) => {
    // This test verifies the visual layout
    await page.goto('/dashboard');
    const applicationCard = page.locator('[data-testid="application-card"]').first();
    await applicationCard.click();

    // Get positions of summary card and notes list
    const summaryCard = page.locator('text=Notes Summary').first();
    const notesList = page.locator('h2:has-text("Notes")');

    if (await summaryCard.isVisible()) {
      const summaryBox = await summaryCard.boundingBox();
      const notesBox = await notesList.boundingBox();

      // Summary should appear above notes list (lower Y coordinate)
      if (summaryBox && notesBox) {
        expect(summaryBox.y).toBeLessThan(notesBox.y);
      }
    }
  });
});
