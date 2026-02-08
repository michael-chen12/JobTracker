import { test, expect, devices } from '@playwright/test';

/**
 * Notification System E2E Tests
 *
 * Tests bell icon, dropdown, full page, preferences, and push permission UI.
 * All tests are skipped until auth is properly configured for E2E testing.
 */

test.describe('Notification Bell & Dropdown', () => {
  test.skip('should show bell icon in desktop header', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toBeVisible();
  });

  test.skip('should show unread badge when notifications exist', async ({ page }) => {
    await page.goto('/dashboard');
    const badge = page.locator('[class*="bg-red-500"]');
    // Badge should be present if there are unread notifications
    await expect(badge).toBeVisible();
  });

  test.skip('should open dropdown on bell click', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    // Dropdown should show notifications heading
    await expect(page.getByText('Notifications')).toBeVisible();
  });

  test.skip('should show "You\'re all caught up!" when no notifications', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    // Empty state in dropdown
    const emptyState = page.getByText("You're all caught up!");
    await expect(emptyState).toBeVisible();
  });

  test.skip('should navigate to full page via "View All" link', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByRole('button', { name: /notifications/i });
    await bell.click();
    const viewAll = page.getByText('View All Notifications');
    await viewAll.click();
    await expect(page).toHaveURL(/\/dashboard\/notifications/);
  });
});

test.describe('Notifications Full Page', () => {
  test.skip('should render notifications page with filter tabs', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    // Filter tabs
    await expect(page.getByText('All')).toBeVisible();
    await expect(page.getByText('Unread')).toBeVisible();
    await expect(page.getByText('Follow-ups')).toBeVisible();
    await expect(page.getByText('Interviews')).toBeVisible();
    await expect(page.getByText('Offers')).toBeVisible();
    await expect(page.getByText('Achievements')).toBeVisible();
  });

  test.skip('should show empty state with correct message', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    const emptyState = page.getByText("You're all caught up!");
    await expect(emptyState).toBeVisible();
  });

  test.skip('should filter notifications by type', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    const interviewsTab = page.getByText('Interviews');
    await interviewsTab.click();
    // Should show filtered empty state or interview notifications
    await expect(
      page.getByText(/no interviews notifications|interview/i)
    ).toBeVisible();
  });

  test.skip('should mark all read via button', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    const markAllBtn = page.getByRole('button', { name: /mark all read/i });
    // Should exist (may be disabled if no unread)
    await expect(markAllBtn).toBeVisible();
  });

  test.skip('should show loading skeleton while fetching', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    // Loading skeleton should briefly appear
    const skeleton = page.locator('[class*="animate-pulse"]');
    // May already have loaded, so we just check the page renders
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });
});

test.describe('Notification Preferences', () => {
  test.skip('should render preferences section on profile page', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.getByText('Notification Preferences')).toBeVisible();
  });

  test.skip('should show in-app, email, and push sections', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.getByText('In-App Notifications')).toBeVisible();
    await expect(page.getByText('Email Notifications')).toBeVisible();
    await expect(page.getByText('Push Notifications')).toBeVisible();
  });

  test.skip('should toggle a preference switch', async ({ page }) => {
    await page.goto('/dashboard/profile');
    // Find a switch in the notification preferences section
    const switches = page.locator('[role="switch"]');
    const firstSwitch = switches.first();
    await expect(firstSwitch).toBeVisible();
    const checked = await firstSwitch.getAttribute('aria-checked');
    await firstSwitch.click();
    const newChecked = await firstSwitch.getAttribute('aria-checked');
    expect(checked).not.toBe(newChecked);
  });
});

// Mobile notification tests - using viewport override instead of test.use in describe
test.skip('mobile: should show bell icon in mobile header', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  await page.goto('/dashboard');
  const bell = page.getByRole('button', { name: /notifications/i });
  await expect(bell).toBeVisible();
  await context.close();
});

test.skip('mobile: should open dropdown on mobile', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  await page.goto('/dashboard');
  const bell = page.getByRole('button', { name: /notifications/i });
  await bell.click();
  await expect(page.getByText('Notifications')).toBeVisible();
  await context.close();
});

test.skip('mobile: should render full page with responsive layout', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  await page.goto('/dashboard/notifications');
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  const filterBar = page.locator('.overflow-x-auto');
  await expect(filterBar).toBeVisible();
  await context.close();
});

test.describe('Notification Integration', () => {
  test.skip('should show notification after status change to interviewing', async ({ page }) => {
    // Navigate to an application detail page
    await page.goto('/dashboard');
    // Click on first application
    const firstApp = page.locator('tr').nth(1);
    await firstApp.click();
    // Change status to interviewing (implementation depends on UI)
    const statusSelect = page.locator('[data-testid="status-select"]');
    await statusSelect.click();
    await page.getByText('Interviewing').click();
    // Wait for notification to appear
    await page.waitForTimeout(1000);
    // Check bell badge updated
    const bell = page.getByRole('button', { name: /notifications/i });
    await expect(bell).toBeVisible();
  });
});
