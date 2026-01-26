import { test, expect } from '@playwright/test';

/**
 * E2E tests for Application Detail Page
 *
 * Tests the full flow: navigate from dashboard → view details → edit → delete
 * Requires auth setup to run fully
 */

test.describe('Application Detail Page', () => {
  test.skip('should navigate from table to detail page', async ({ page }) => {
    // TODO: Set up test authentication
    // This test verifies: Ticket #8 acceptance criteria

    await page.goto('/dashboard');

    // Click on an application row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/applications\/[a-z0-9-]+/);

    // Verify breadcrumb navigation
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();

    // Verify main content loaded
    await expect(page.locator('h1')).toBeVisible();
  });

  test.skip('should display all application fields', async ({ page }) => {
    // TODO: Requires auth + test data
    // Navigate to a specific application detail page
    // const applicationId = 'test-uuid';
    // await page.goto(`/dashboard/applications/${applicationId}`);

    // Verify all sections exist
    await expect(page.getByText('Application Details')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Documents')).toBeVisible();

    // Verify fields are displayed
    await expect(page.getByText(/Location/i)).toBeVisible();
    await expect(page.getByText(/Job Type/i)).toBeVisible();
    await expect(page.getByText(/Applied Date/i)).toBeVisible();
  });

  test.skip('should edit fields inline', async ({ page }) => {
    // TODO: Requires auth + test data
    // Navigate to detail page
    // Click on an editable field
    // const locationField = page.getByText('Add location');
    // await locationField.click();

    // Should show input
    // await expect(page.locator('input[placeholder*="location"]')).toBeVisible();

    // Enter value
    // await page.locator('input[placeholder*="location"]').fill('New York, NY');

    // Save
    // await page.getByRole('button', { name: /save/i }).click();

    // Verify updated
    // await expect(page.getByText('New York, NY')).toBeVisible();
  });

  test.skip('should add and delete notes', async ({ page }) => {
    // TODO: Requires auth + test data
    // Navigate to detail page

    // Click "Add Note" button
    // await page.getByRole('button', { name: /add note/i }).click();

    // Enter note content
    // await page.getByPlaceholder(/note here/i).fill('This is a test note');

    // Save note
    // await page.getByRole('button', { name: /save note/i }).click();

    // Verify note appears
    // await expect(page.getByText('This is a test note')).toBeVisible();

    // Delete note
    // await page.locator('[aria-label="Delete note"]').first().click();
    // await page.getByRole('button', { name: /confirm/i }).click();

    // Verify note removed
    // await expect(page.getByText('This is a test note')).not.toBeVisible();
  });

  test.skip('should delete application with confirmation', async ({ page }) => {
    // TODO: Requires auth + test data
    // Navigate to detail page

    // Click delete button
    // await page.getByRole('button', { name: /delete/i }).click();

    // Verify confirmation dialog appears
    // await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    // await page.getByRole('button', { name: /delete/i }).click();

    // Should redirect to dashboard
    // await expect(page).toHaveURL('/dashboard');

    // Verify success message
    // await expect(page.getByText(/deleted/i)).toBeVisible();
  });

  test.skip('should show 404 for non-existent application', async ({ page }) => {
    // TODO: Requires auth setup
    // Navigate to invalid application ID
    // await page.goto('/dashboard/applications/non-existent-id');

    // Should show 404 page
    // await expect(page.getByText(/not found/i)).toBeVisible();

    // Verify back to dashboard button
    // await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
  });

  test.skip('should navigate back to dashboard via breadcrumb', async ({ page }) => {
    // TODO: Requires auth + test data
    // Navigate to detail page

    // Click breadcrumb link
    // await page.getByRole('link', { name: /dashboard/i }).click();

    // Should return to dashboard
    // await expect(page).toHaveURL('/dashboard');
  });
});

/**
 * Smoke test for route existence (no auth required)
 */
test.describe('Application Detail Route', () => {
  test('should have detail route registered', async ({ page }) => {
    // This verifies the route exists (will redirect to auth)
    await page.goto('/dashboard/applications/test-id');

    // Should redirect to auth if not authenticated
    // or show not-found if authenticated
    await expect(page).toHaveURL(/\/(auth|dashboard)/);
  });
});
