import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Data Export & GDPR Compliance', () => {
  test('should display Data & Privacy section on profile page', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.locator('text=Export Your Data')).toBeVisible();
    await expect(page.locator('text=Danger Zone')).toBeVisible();
  });

  test('should not show Coming Soon card', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.locator('text=Coming Soon')).not.toBeVisible();
  });

  test('should show JSON and CSV export format options', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.locator('text=Complete Data (JSON)')).toBeVisible();
    await expect(page.locator('text=Applications Table (CSV)')).toBeVisible();
  });

  test('should default to JSON export format', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    // JSON option should have selected border styling
    const jsonOption = page.locator('button:has-text("Complete Data (JSON)")');
    await expect(jsonOption).toHaveClass(/border-blue-500/);
  });

  test('should trigger export with loading state', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    const exportBtn = page.locator('button:has-text("Export Data")');
    await exportBtn.click();
    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should open delete account dialog', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await page.locator('button:has-text("Delete Account")').click();
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await expect(page.locator('text=Delete Your Account?')).toBeVisible();
  });

  test('should require email confirmation for deletion', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await page.locator('button:has-text("Delete Account")').click();
    // Schedule Deletion button should be disabled by default
    const scheduleBtn = page.locator('button:has-text("Schedule Deletion")');
    await expect(scheduleBtn).toBeDisabled();
  });

  test('should enable schedule button when email matches', async ({ authPage: page }) => {
    await page.goto('/dashboard/profile');
    await page.locator('button:has-text("Delete Account")').click();
    const emailInput = page.locator('input[placeholder*="email"]');
    await emailInput.fill('user@example.com');
    const scheduleBtn = page.locator('button:has-text("Schedule Deletion")');
    await expect(scheduleBtn).toBeEnabled();
  });

  test('should show pending deletion status with cancel option', async ({ authPage: page }) => {
    // This test assumes a pending deletion already exists
    await page.goto('/dashboard/profile');
    await expect(page.locator('text=Account scheduled for deletion')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel Deletion")')).toBeVisible();
  });

  test('should be mobile responsive at 375px viewport', async ({ authPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/profile');
    await expect(page.locator('text=Export Your Data')).toBeVisible();
    await expect(page.locator('text=Delete Account')).toBeVisible();
  });
});
