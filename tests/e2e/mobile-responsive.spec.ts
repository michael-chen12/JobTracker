import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Responsive Design E2E Tests
 *
 * Tests bottom navigation, card view, touch targets, and mobile-specific behavior.
 * All tests are skipped until auth is properly configured for E2E testing.
 */

test.describe('Mobile Responsive Design', () => {
  test.use({ ...devices['Pixel 5'] });

  test.skip('should show bottom navigation bar on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();
  });

  test.skip('should not show hamburger menu on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    // MobileNav hamburger button should not exist (replaced by BottomNav)
    const hamburger = page.locator('[aria-label="Toggle menu"]');
    await expect(hamburger).not.toBeVisible();
  });

  test.skip('should show card view instead of table on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    const mobileList = page.locator('[data-testid="mobile-application-list"]');
    await expect(mobileList).toBeVisible();
    // Table should not be visible
    const table = page.locator('table');
    await expect(table).not.toBeVisible();
  });

  test.skip('should navigate to application detail from card tap', async ({ page }) => {
    await page.goto('/dashboard');
    const card = page.locator('[data-testid="mobile-application-card"]').first();
    await card.click();
    await expect(page).toHaveURL(/\/dashboard\/applications\//);
  });

  test.skip('should open application form from bottom nav Add button', async ({ page }) => {
    await page.goto('/dashboard');
    const addButton = page.locator('[data-testid="bottom-nav-add"]');
    await addButton.click();
    await expect(page.getByText('Create Application')).toBeVisible();
  });

  test.skip('should show bottom nav on all dashboard pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/dashboard/analytics',
      '/dashboard/wins',
      '/dashboard/profile',
    ];

    for (const path of pages) {
      await page.goto(path);
      const bottomNav = page.locator('[data-testid="bottom-nav"]');
      await expect(bottomNav).toBeVisible();
    }
  });

  test.skip('should have minimum 44px touch targets on bottom nav', async ({ page }) => {
    await page.goto('/dashboard');
    const navItems = page.locator(
      '[data-testid="bottom-nav"] a, [data-testid="bottom-nav"] button'
    );
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await navItems.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test.skip('should show full-screen dialog for application form on mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    const addButton = page.locator('[data-testid="bottom-nav-add"]');
    await addButton.click();

    // Dialog should take full screen on mobile (no rounded corners)
    const dialogContent = page.locator('[role="dialog"]');
    await expect(dialogContent).toBeVisible();

    const box = await dialogContent.boundingBox();
    expect(box).not.toBeNull();
    // Should span close to full viewport width
    const viewportSize = page.viewportSize();
    expect(box!.width).toBeGreaterThanOrEqual(viewportSize!.width * 0.9);
  });

  test.skip('should highlight active bottom nav item', async ({ page }) => {
    await page.goto('/dashboard');
    const dashboardLink = page.locator('[data-testid="bottom-nav-dashboard"]');
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    // Navigate to analytics
    const analyticsLink = page.locator('[data-testid="bottom-nav-analytics"]');
    await analyticsLink.click();
    await expect(analyticsLink).toHaveAttribute('aria-current', 'page');
    await expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Desktop Navigation', () => {
  test.use({ ...devices['Desktop Chrome'] });

  test.skip('should NOT show bottom navigation on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).not.toBeVisible();
  });

  test.skip('should show desktop navigation bar on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    // DashboardNav should be visible on desktop
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).toBeVisible();
  });

  test.skip('should show table view (not card view) on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    // Table should be visible on desktop
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Mobile list should not be visible
    const mobileList = page.locator('[data-testid="mobile-application-list"]');
    await expect(mobileList).not.toBeVisible();
  });
});
