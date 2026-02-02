/**
 * E2E Tests: Activity Insights & Burnout Indicators (Ticket #21)
 *
 * Tests cover:
 * 1. Your Journey section display on dashboard
 * 2. Burnout warning when high rejection rate
 * 3. Weekly activity summary display in Your Journey
 * 4. Weekly summary widget on analytics page
 * 5. Lucide icons instead of emojis on wins page
 * 6. Privacy control (insights disabled)
 *
 * Note: Tests require authentication to be set up.
 * Currently marked as .skip() until auth flow is implemented.
 * Tests also require data seeding for burnout detection scenarios.
 */

import { test, expect } from '@playwright/test';

test.describe('Activity Insights & Burnout Indicators', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    // TODO: Add authentication flow once implemented
    // For now, tests verify component structure when available
  });

  test.skip('should display Your Journey section on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify Your Journey section is visible
    const journeySection = page.getByText('Your Journey');
    await expect(journeySection).toBeVisible({ timeout: 10000 });

    // Verify section has a heading
    const sectionHeading = page.getByRole('heading', { name: /your journey/i });
    await expect(sectionHeading).toBeVisible();

    // Verify section is collapsible (has chevron icon)
    const chevronButton = page.locator('[data-testid="journey-chevron"]').first();
    await expect(chevronButton).toBeVisible();

    // Test collapse/expand functionality
    const contentArea = page.locator('[data-testid="journey-content"]').first();

    // Should be expanded by default
    await expect(contentArea).toBeVisible();

    // Click to collapse
    await chevronButton.click();
    await expect(contentArea).not.toBeVisible();

    // Click to expand again
    await chevronButton.click();
    await expect(contentArea).toBeVisible();
  });

  test.skip('should display burnout warning when high rejection rate', async ({ page }) => {
    // Setup: This test requires seeding the database with:
    // - 10 applications with 8 in 'rejected' status
    // - Created within the last 30 days
    // TODO: Add data seeding helper function

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Expand Your Journey section if collapsed
    const journeySection = page.getByText('Your Journey');
    await expect(journeySection).toBeVisible();
    await journeySection.click();

    // Wait for insights to load
    await page.waitForTimeout(1000);

    // Verify burnout warning appears
    const burnoutWarning = page.getByText('High Rejection Rate Detected');
    await expect(burnoutWarning).toBeVisible({ timeout: 5000 });

    // Verify warning contains rejection statistics
    const rejectionStats = page.getByText(/8 of your last 10 applications/i);
    await expect(rejectionStats).toBeVisible();

    // Verify warning has AlertTriangle icon (Lucide icon)
    const alertIcon = page.locator('svg[class*="lucide-alert-triangle"]').first();
    await expect(alertIcon).toBeVisible();

    // Verify warning has amber/yellow styling (destructive variant)
    const warningCard = page.locator('[data-testid="insight-card"]').filter({
      hasText: 'High Rejection Rate',
    });
    await expect(warningCard).toHaveClass(/border-amber|border-yellow/);
  });

  test.skip('should display weekly activity summary in Your Journey', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Expand Your Journey section
    const journeySection = page.getByText('Your Journey');
    await expect(journeySection).toBeVisible();
    await journeySection.click();

    // Verify weekly activity summary is visible
    const weeklySummary = page.getByText("This Week's Activity");
    await expect(weeklySummary).toBeVisible({ timeout: 5000 });

    // Verify summary shows key metrics
    await expect(page.getByText('Applications')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Updates')).toBeVisible();

    // Verify metrics have numerical values
    const applicationCount = page.locator('[data-testid="weekly-applications"]');
    await expect(applicationCount).toBeVisible();

    const notesCount = page.locator('[data-testid="weekly-notes"]');
    await expect(notesCount).toBeVisible();

    const updatesCount = page.locator('[data-testid="weekly-updates"]');
    await expect(updatesCount).toBeVisible();
  });

  test.skip('should show weekly summary widget on analytics page', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Verify weekly summary widget is visible
    const weeklyWidget = page.getByText(/This Week/i);
    await expect(weeklyWidget).toBeVisible({ timeout: 5000 });

    // Verify widget shows all three metrics
    await expect(page.getByText('Applications')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Updates')).toBeVisible();

    // Verify widget has proper styling (card with border)
    const widget = page.locator('[data-testid="weekly-summary-widget"]');
    await expect(widget).toBeVisible();
    await expect(widget).toHaveClass(/border|rounded/);

    // Verify numerical values are displayed
    const metricValues = page.locator('[data-testid^="metric-"]');
    const count = await metricValues.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test.skip('should display Lucide icons instead of emojis on wins page', async ({ page }) => {
    await page.goto('/dashboard/wins');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    const pageHeading = page.getByRole('heading', { name: /your achievements/i });
    await expect(pageHeading).toBeVisible();

    // Verify Lucide SVG icons are present
    // Lucide icons have specific class patterns
    const lucideIcons = page.locator('svg[class*="lucide"]');
    const iconCount = await lucideIcons.count();

    // Should have at least some Lucide icons (trophy, star, etc.)
    expect(iconCount).toBeGreaterThan(0);

    // Verify specific achievement icons
    const trophyIcon = page.locator('svg[class*="lucide-trophy"]');
    if (await trophyIcon.isVisible()) {
      await expect(trophyIcon.first()).toBeVisible();
    }

    // Verify no emoji characters in achievement cards
    const achievementCards = page.locator('[data-testid="win-card"]');
    const cardCount = await achievementCards.count();

    if (cardCount > 0) {
      // Check first card doesn't contain emoji Unicode ranges
      const firstCardText = await achievementCards.first().textContent();
      // Emojis are typically in Unicode ranges U+1F300–U+1F9FF
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(firstCardText || '');
      expect(hasEmoji).toBe(false);
    }
  });

  test.skip('should respect privacy control when insights disabled', async ({ page }) => {
    // Setup: This test requires:
    // 1. Setting insights_enabled to false in user_profiles table
    // 2. Having some achievements in the database
    // TODO: Add helper function to toggle insights_enabled setting

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Your Journey section should still be visible (for achievements)
    const journeySection = page.getByText('Your Journey');
    await expect(journeySection).toBeVisible();

    // Expand the section
    await journeySection.click();
    await page.waitForTimeout(500);

    // Verify NO insights are shown
    const highRejectionInsight = page.getByText('High Rejection Rate Detected');
    await expect(highRejectionInsight).not.toBeVisible();

    const consistencyInsight = page.getByText('Consistency is Key');
    await expect(consistencyInsight).not.toBeVisible();

    const weeklySummary = page.getByText("This Week's Activity");
    await expect(weeklySummary).not.toBeVisible();

    // But achievements (wins) should still be visible
    const achievementCards = page.locator('[data-testid="win-card"]');
    const cardCount = await achievementCards.count();

    // If user has achievements, they should be displayed
    if (cardCount > 0) {
      await expect(achievementCards.first()).toBeVisible();
    }

    // Verify "View All Wins" button is still accessible
    const viewAllButton = page.getByRole('link', { name: /view all/i });
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();
      await expect(page).toHaveURL('/dashboard/wins');
    }
  });

  test.skip('should show multiple insights when conditions are met', async ({ page }) => {
    // Setup: This test requires seeding data for multiple insight triggers:
    // - High rejection rate (8+ rejections in last 10 apps)
    // - Active streak (applications in last 3 consecutive weeks)
    // TODO: Add data seeding helper function

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Expand Your Journey
    const journeySection = page.getByText('Your Journey');
    await journeySection.click();
    await page.waitForTimeout(1000);

    // Verify multiple insight cards are displayed
    const insightCards = page.locator('[data-testid="insight-card"]');
    const insightCount = await insightCards.count();

    // Should have at least 2 insights
    expect(insightCount).toBeGreaterThanOrEqual(2);

    // Verify burnout warning
    await expect(page.getByText('High Rejection Rate Detected')).toBeVisible();

    // Verify positive insight
    await expect(page.getByText(/Consistency|Streak|Active/i)).toBeVisible();
  });

  test.skip('should navigate between dashboard and analytics showing consistent data', async ({ page }) => {
    // Test data consistency between pages
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get weekly activity data from dashboard
    const journeySection = page.getByText('Your Journey');
    await journeySection.click();

    const dashboardAppCount = await page.locator('[data-testid="weekly-applications"]').textContent();

    // Navigate to analytics page
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');

    // Get weekly activity data from analytics
    const analyticsAppCount = await page.locator('[data-testid="metric-applications"]').textContent();

    // Values should match (both showing this week's activity)
    expect(dashboardAppCount).toBe(analyticsAppCount);
  });
});
