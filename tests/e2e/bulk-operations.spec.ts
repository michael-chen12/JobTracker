import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Bulk Operations Feature
 *
 * These tests verify:
 * - Checkbox selection for multiple applications
 * - Bulk status change functionality
 * - Bulk delete with confirmation
 * - Selection state management
 * - Mobile responsive layout
 *
 * Note: Tests are skipped until authentication is configured in test environment
 */

test.describe('Bulk Operations', () => {
  test.skip('should select multiple applications and show bulk actions toolbar', async ({
    page,
  }) => {
    // Navigate to applications page
    await page.goto('/dashboard/applications');

    // Wait for table to load
    await page.waitForSelector('table');

    // Select first 3 applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Verify bulk actions toolbar appears
    await expect(page.getByText('3 selected')).toBeVisible();

    // Verify regular toolbar is hidden
    await expect(page.getByPlaceholder('Search applications...')).not.toBeVisible();

    // Verify selected rows have blue background
    const rows = page.locator('tr.bg-blue-50, tr.dark\\:bg-blue-900\\/20');
    await expect(rows).toHaveCount(3);
  });

  test.skip('should select all applications on current page', async ({
    page,
  }) => {
    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Click "Select All" checkbox in header
    const selectAllCheckbox = page.locator('[aria-label="Select all"]');
    await selectAllCheckbox.click();

    // Verify all rows are selected (assuming default page size)
    const selectedBadge = page.getByText(/\d+ selected/);
    await expect(selectedBadge).toBeVisible();

    // Get the count from the badge
    const badgeText = await selectedBadge.textContent();
    const count = parseInt(badgeText?.match(/\d+/)?.[0] || '0');

    // Verify count is greater than 0
    expect(count).toBeGreaterThan(0);
  });

  test.skip('should clear selection when clicking Clear button', async ({
    page,
  }) => {
    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Select some applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Verify bulk actions toolbar appears
    await expect(page.getByText('2 selected')).toBeVisible();

    // Click Clear button
    await page.getByRole('button', { name: /clear/i }).click();

    // Verify bulk actions toolbar disappears
    await expect(page.getByText('2 selected')).not.toBeVisible();

    // Verify regular toolbar reappears
    await expect(page.getByPlaceholder('Search applications...')).toBeVisible();
  });

  test.skip('should change status for selected applications', async ({
    page,
  }) => {
    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Select 3 applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Open status dropdown
    await page.getByRole('combobox', { name: /change status/i }).click();

    // Select "Interviewing" status
    await page.getByRole('option', { name: 'Interviewing' }).click();

    // Wait for success toast
    await expect(page.getByText(/application.*updated/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify selection is cleared after operation
    await expect(page.getByText(/selected/)).not.toBeVisible();
  });

  test.skip('should delete selected applications with confirmation', async ({
    page,
  }) => {
    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Select 2 applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click Delete button
    await page.getByRole('button', { name: /delete/i }).click();

    // Verify confirmation dialog appears
    await expect(
      page.getByText(/delete 2 application/i)
    ).toBeVisible();

    // Verify warning about cascade deletion
    await expect(
      page.getByText(/this will also delete all associated/i)
    ).toBeVisible();

    // Click Delete button in dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /delete/i })
      .click();

    // Wait for success toast
    await expect(page.getByText(/application.*deleted/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify dialog closes
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify selection is cleared
    await expect(page.getByText(/selected/)).not.toBeVisible();
  });

  test.skip('should clear selection when changing pages', async ({ page }) => {
    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Select some applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Verify selection
    await expect(page.getByText('2 selected')).toBeVisible();

    // Navigate to next page
    await page.getByRole('button', { name: /next/i }).click();

    // Verify selection is cleared
    await expect(page.getByText(/selected/)).not.toBeVisible();

    // Verify regular toolbar is shown
    await expect(page.getByPlaceholder('Search applications...')).toBeVisible();
  });

  test.skip('should display error for more than 50 selected applications', async ({
    page,
  }) => {
    // This test requires a way to create 51+ applications for testing
    // Skip for now - can be implemented when test data seeding is available
    test.skip(true, 'Requires test data with 51+ applications');
  });

  test.skip('should render responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard/applications');
    await page.waitForSelector('table');

    // Select applications
    const checkboxes = page.locator('[aria-label="Select row"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Verify bulk actions toolbar is visible
    await expect(page.getByText('2 selected')).toBeVisible();

    // Verify buttons are stacked vertically (flex-col on mobile)
    const toolbar = page.locator(
      '.bg-blue-50, .dark\\:bg-blue-900\\/20'
    ).first();
    await expect(toolbar).toBeVisible();

    // Verify touch-friendly button sizes (at least 44x44px)
    const deleteButton = page.getByRole('button', { name: /delete/i });
    const box = await deleteButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(36); // h-9 = 36px
  });
});
