import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Email Correspondence (Ticket #25)
 *
 * These tests verify:
 * - Logging inbound and outbound correspondence
 * - Direction badge display (Received/Sent)
 * - Delete with confirmation dialog
 * - Direction filtering
 * - Date range filtering
 * - Empty state
 * - Count badge accuracy
 * - Mobile responsive layout
 *
 * Note: Tests are skipped until authentication is configured in test environment
 */

test.describe('Email Correspondence', () => {
  test.skip('should log inbound correspondence and verify it appears in list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    const correspondenceSection = page.locator('text=Correspondence').first();
    await correspondenceSection.click();
    await expect(page.locator('text=No correspondence yet')).toBeVisible();

    // Click Log Email button
    await page.locator('button:has-text("Log Email")').click();

    // Fill form for inbound email
    await page.locator('[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Received")').click();
    await page.fill('input[placeholder*="Interview"]', 'Interview Invitation - Software Engineer');
    await page.fill('input[placeholder*="recruiter"]', 'hr@techcompany.com');
    await page.fill('textarea', 'They want to schedule a first round interview next week');

    // Submit
    await page.locator('button:has-text("Log Email")').last().click();
    await page.waitForTimeout(1000);

    // Verify toast and item appears
    await expect(page.locator('text=Correspondence logged successfully')).toBeVisible();
    await expect(page.locator('text=Interview Invitation - Software Engineer')).toBeVisible();
    await expect(page.locator('text=Received')).toBeVisible();
    await expect(page.locator('text=From: hr@techcompany.com')).toBeVisible();
  });

  test.skip('should log outbound correspondence and verify direction badge', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section and click Log Email
    await page.locator('text=Correspondence').first().click();
    await page.locator('button:has-text("Log Email")').click();

    // Select outbound direction
    await page.locator('[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Sent")').click();

    // Fill outbound details
    await page.fill('input[placeholder*="Interview"]', 'Thank You - Follow Up');
    await page.fill('input[placeholder*="recruiter"]', 'recruiter@company.com');

    await page.locator('button:has-text("Log Email")').last().click();
    await page.waitForTimeout(1000);

    // Verify outbound badge
    await expect(page.locator('text=Sent')).toBeVisible();
    await expect(page.locator('text=Thank You - Follow Up')).toBeVisible();
  });

  test.skip('should delete a correspondence entry with confirmation dialog', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section (assume at least one entry exists from prior tests)
    await page.locator('text=Correspondence').first().click();

    // Hover over first correspondence item to reveal delete button
    const firstItem = page.locator('[class*="group"]').first();
    await firstItem.hover();

    // Click delete button
    await firstItem.locator('button[aria-label="Delete correspondence"]').click();

    // Verify confirmation dialog appears
    await expect(page.locator('text=Delete Correspondence?')).toBeVisible();

    // Confirm deletion
    await page.locator('button:has-text("Delete")').last().click();
    await page.waitForTimeout(1000);

    // Verify success toast
    await expect(page.locator('text=Correspondence deleted')).toBeVisible();
  });

  test.skip('should filter by direction (inbound only)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    await page.locator('text=Correspondence').first().click();

    // Open filters
    await page.locator('button:has-text("Filters")').click();

    // Select "Received" direction filter
    await page.locator('button:has(span:has-text("Received"))').click();

    // Verify only inbound emails are shown
    const sentBadges = page.locator('text=Sent');
    await expect(sentBadges).toHaveCount(0);
  });

  test.skip('should filter by date range', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    await page.locator('text=Correspondence').first().click();

    // Open filters
    await page.locator('button:has-text("Filters")').click();

    // Set date range
    await page.fill('#corrDateFrom', '2026-01-01');
    await page.fill('#corrDateTo', '2026-01-31');

    // Verify filter badge shows active count
    await expect(page.locator('text=2').first()).toBeVisible(); // 2 active filters

    // Clear filters
    await page.locator('button:has-text("Clear Filters")').click();
  });

  test.skip('should show empty state when no correspondence exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    await page.locator('text=Correspondence').first().click();

    // Verify empty state (for a fresh application)
    const emptyMessage = page.locator('text=No correspondence yet');
    if (await emptyMessage.isVisible()) {
      await expect(page.locator('text=Log Email')).toBeVisible();
    }
  });

  test.skip('should show count badge with correct number', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    await page.locator('text=Correspondence').first().click();

    // Log 2 emails
    for (let i = 0; i < 2; i++) {
      await page.locator('button:has-text("Log Email")').click();
      await page.fill('input[placeholder*="Interview"]', `Test Email ${i + 1}`);
      await page.fill('input[placeholder*="recruiter"]', 'test@example.com');
      await page.locator('button:has-text("Log Email")').last().click();
      await page.waitForTimeout(500);
    }

    // Verify badge count shows 2
    const badge = page.locator('text=Correspondence').first().locator('..').locator('[class*="badge"]');
    await expect(badge).toContainText('2');
  });

  test.skip('should be mobile responsive at 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForSelector('table');
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/dashboard\/applications\/.+/);

    // Open Correspondence section
    await page.locator('text=Correspondence').first().click();

    // Verify section header and buttons are visible
    await expect(page.locator('text=Correspondence')).toBeVisible();
    await expect(page.locator('button:has-text("Log Email")')).toBeVisible();

    // Open form and verify it renders properly on mobile
    await page.locator('button:has-text("Log Email")').click();
    await expect(page.locator('input[placeholder*="Interview"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    // Verify form fields don't overflow
    const form = page.locator('form').first();
    const formBox = await form.boundingBox();
    if (formBox) {
      expect(formBox.width).toBeLessThanOrEqual(375);
    }
  });
});
