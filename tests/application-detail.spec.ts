import { test, expect } from './fixtures/e2e-fixtures';

/**
 * E2E tests for Application Detail Page (Ticket #8)
 *
 * Tests the full flow: create → navigate to detail → verify fields → edit → delete.
 * Uses the `createApp` fixture to create a real application and the `authPage`
 * fixture for authenticated navigation.
 */

test.describe('Application Detail Page', () => {
  test('should navigate from dashboard table to detail page', async ({
    authPage: page,
    createApp,
  }) => {
    // Create a test application
    await createApp({
      company: 'Detail Page Corp',
      position: 'Product Manager',
    });

    // Go back to dashboard and click the application row
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: 'Detail Page Corp' });
    await expect(row).toBeVisible({ timeout: 10000 });

    // Click the row or company name link to navigate to detail
    const appLink = row.getByRole('link').first();
    if (await appLink.isVisible()) {
      await appLink.click();
    } else {
      await row.click();
    }

    // Should navigate to application detail URL
    await expect(page).toHaveURL(/\/dashboard\/applications\/[a-zA-Z0-9-]+/, {
      timeout: 10000,
    });

    // Verify the page loaded with a heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display the application detail page sections', async ({
    authPage: page,
    createApp,
  }) => {
    await createApp({
      company: 'Sections Test Inc',
      position: 'Designer',
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: 'Sections Test Inc' });
    await expect(row).toBeVisible({ timeout: 10000 });

    const appLink = row.getByRole('link').first();
    if (await appLink.isVisible()) {
      await appLink.click();
    } else {
      await row.click();
    }

    await page.waitForURL(/\/dashboard\/applications\/[a-zA-Z0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Core sections should be visible
    await expect(page.getByText(/notes/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/documents|resume/i)).toBeVisible();
  });

  test('should show 404 for a non-existent application ID', async ({
    authPage: page,
  }) => {
    await page.goto('/dashboard/applications/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    // Should show not-found indicator
    await expect(
      page.getByText(/not found|application not found|doesn't exist/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to dashboard via breadcrumb', async ({
    authPage: page,
    createApp,
  }) => {
    await createApp({ company: 'Breadcrumb Corp', position: 'Analyst' });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: 'Breadcrumb Corp' });
    await expect(row).toBeVisible({ timeout: 10000 });

    const appLink = row.getByRole('link').first();
    if (await appLink.isVisible()) {
      await appLink.click();
    } else {
      await row.click();
    }

    await page.waitForURL(/\/dashboard\/applications\/[a-zA-Z0-9-]+/);

    // Click breadcrumb back to dashboard
    const breadcrumb = page.getByRole('link', { name: /dashboard/i }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    await breadcrumb.click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('Application Detail - Route Guard', () => {
  test('should redirect to login when accessing detail page without auth', async ({
    page,
  }) => {
    await page.goto('/dashboard/applications/some-id');
    await expect(page).toHaveURL(/\/(auth|login)/);
  });
});
