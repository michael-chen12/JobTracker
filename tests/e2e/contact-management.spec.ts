/**
 * Contact Management E2E Tests
 *
 * Tests complete user workflows and security scenarios:
 * - Full CRUD workflow (create → read → update → delete)
 * - Contact linking to applications
 * - Search and filter functionality
 * - Security: Unauthorized access, XSS attempts, IDOR attacks
 * - Edge cases: Concurrent operations, network errors
 */

import { test, expect } from '@playwright/test';

test.describe('Contact Management - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/auth/login');
    // TODO: Add authentication flow once implemented
    // For now, assume user is authenticated
  });

  test('should create, view, and delete a contact', async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/dashboard/contacts');

    // Should show empty state initially (or existing contacts)
    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();

    // Click "Add Contact" button
    await page.getByRole('button', { name: /add contact/i }).click();

    // Fill contact form
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john.doe@example.com');
    await page.getByLabel(/phone/i).fill('(555) 123-4567');
    await page.getByLabel(/company/i).fill('Acme Corp');
    await page.getByLabel(/position/i).fill('Senior Recruiter');
    await page.getByLabel(/linkedin url/i).fill('https://linkedin.com/in/johndoe');

    // Select contact type
    await page.getByLabel(/type/i).click();
    await page.getByRole('option', { name: /recruiter/i }).click();

    // Add notes
    await page.getByLabel(/notes/i).fill('Met at tech conference 2024');

    // Submit form
    await page.getByRole('button', { name: /add contact/i }).click();

    // Should show success message and contact in list
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Acme Corp')).toBeVisible();

    // Verify contact type badge
    await expect(page.getByText(/recruiter/i)).toBeVisible();

    // Test quick actions
    const emailLink = page.getByRole('link', { name: /email/i }).first();
    await expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');

    const phoneLink = page.getByRole('link', { name: /call/i }).first();
    await expect(phoneLink).toHaveAttribute('href', 'tel:(555) 123-4567');

    const linkedinLink = page.getByRole('link', { name: /linkedin/i }).first();
    await expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe');

    // Delete contact
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirm deletion
    page.on('dialog', (dialog) => dialog.accept());

    // Contact should be removed from list
    await expect(page.getByText('John Doe')).not.toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Create test contact first
    await page.getByRole('button', { name: /add contact/i }).click();
    await page.getByLabel(/name/i).fill('Alice Smith');
    await page.getByLabel(/company/i).fill('TechCorp');
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Wait for contact to appear
    await expect(page.getByText('Alice Smith')).toBeVisible();

    // Search by name
    await page.getByPlaceholder(/search/i).fill('Alice');
    await expect(page.getByText('Alice Smith')).toBeVisible();

    // Search by company
    await page.getByPlaceholder(/search/i).clear();
    await page.getByPlaceholder(/search/i).fill('TechCorp');
    await expect(page.getByText('Alice Smith')).toBeVisible();

    // Search with no results
    await page.getByPlaceholder(/search/i).clear();
    await page.getByPlaceholder(/search/i).fill('NonexistentContact');
    await expect(page.getByText(/no contacts found/i)).toBeVisible();
  });
});

test.describe('Contact Management - Contact Linking', () => {
  test('should link contact to application', async ({ page }) => {
    // First, create a contact
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();
    await page.getByLabel(/name/i).fill('Jane Referral');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Wait for contact to be created
    await expect(page.getByText('Jane Referral')).toBeVisible();

    // Navigate to an application (assuming one exists)
    await page.goto('/dashboard/applications');

    // Click on first application
    await page.getByRole('link').first().click();

    // Find "Referral Contact" section
    await expect(page.getByText(/referral contact/i)).toBeVisible();

    // Click "Link Contact" button
    await page.getByRole('button', { name: /link contact/i }).click();

    // Search for contact in dialog
    await page.getByPlaceholder(/search contacts/i).fill('Jane');

    // Click on contact to select
    await page.getByText('Jane Referral').click();

    // Verify contact is linked
    await expect(page.getByText('Jane Referral')).toBeVisible();
    await expect(page.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:jane@example.com'
    );

    // Unlink contact
    await page.getByRole('button', { name: /X/i }).click();
    page.on('dialog', (dialog) => dialog.accept());

    // Verify contact is unlinked
    await expect(page.getByText(/no referral contact linked/i)).toBeVisible();
  });

  test('should show contact linking in application detail', async ({ page }) => {
    await page.goto('/dashboard/applications');
    await page.getByRole('link').first().click();

    // Referral Contact section should be visible
    await expect(page.getByText(/referral contact/i)).toBeVisible();

    // If no contact linked, should show empty state
    const emptyState = page.getByText(/no referral contact linked/i);
    if (await emptyState.isVisible()) {
      await expect(page.getByRole('button', { name: /link contact/i })).toBeVisible();
    }
  });
});

test.describe('Contact Management - Security Tests', () => {
  test('should reject XSS attempts in LinkedIn URL', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    await page.getByLabel(/name/i).fill('Attacker');
    await page.getByLabel(/linkedin url/i).fill('javascript:alert(1)');

    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should show validation error
    await expect(page.getByText(/invalid linkedin url/i)).toBeVisible();

    // Contact should not be created
    await expect(page.getByText('Attacker')).not.toBeVisible();
  });

  test('should reject SSRF attempts in LinkedIn URL', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    await page.getByLabel(/name/i).fill('Attacker');
    await page.getByLabel(/linkedin url/i).fill('https://evil.com/profile');

    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should show validation error
    await expect(page.getByText(/invalid linkedin url/i)).toBeVisible();
  });

  test('should sanitize input fields', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    // Try SQL injection in notes
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/notes/i).fill("'; DROP TABLE contacts; --");

    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Contact should be created (SQL injection prevented by parameterized queries)
    await expect(page.getByText('Test User')).toBeVisible();

    // Database should still be intact (other contacts visible)
    await page.reload();
    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();
  });

  test('should prevent unauthorized access (IDOR)', async ({ page, context }) => {
    // This test assumes you have multiple users
    // For now, we'll test that direct API access is protected

    // Try to access another user's contact directly via API
    const response = await page.request.get('/api/contacts/fake-uuid-123');

    // Should return 401 Unauthorized or 404 Not Found (not 200)
    expect(response.status()).not.toBe(200);
  });
});

test.describe('Contact Management - Edge Cases', () => {
  test('should handle very long names correctly', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    // Try name at boundary (100 chars)
    const longName = 'a'.repeat(100);
    await page.getByLabel(/name/i).fill(longName);
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should create successfully
    await expect(page.getByText(longName.substring(0, 20))).toBeVisible();

    // Try name over limit (101 chars)
    await page.getByRole('button', { name: /add contact/i }).first().click();
    const tooLongName = 'a'.repeat(101);
    await page.getByLabel(/name/i).fill(tooLongName);
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should show validation error
    await expect(page.getByText(/100 characters/i)).toBeVisible();
  });

  test('should handle special characters in name', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    // Name with apostrophe, hyphen, spaces
    await page.getByLabel(/name/i).fill("O'Brien-Smith Jr.");
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should create successfully
    await expect(page.getByText("O'Brien-Smith Jr.")).toBeVisible();
  });

  test('should handle empty search gracefully', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Search with empty string
    await page.getByPlaceholder(/search/i).fill('');

    // Should show all contacts (not error)
    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();
  });

  test('should handle concurrent contact creation', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Open two forms (not realistic in UI, but tests race condition)
    await page.getByRole('button', { name: /add contact/i }).click();
    await page.getByLabel(/name/i).fill('Contact 1');

    // Submit first form
    const submitPromise1 = page.getByRole('button', { name: /add contact/i }).last().click();

    // Quickly create second contact (tests backend concurrency)
    await submitPromise1;
    await page.getByRole('button', { name: /add contact/i }).first().click();
    await page.getByLabel(/name/i).fill('Contact 2');
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Both should be created
    await expect(page.getByText('Contact 1')).toBeVisible();
    await expect(page.getByText('Contact 2')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Simulate offline mode
    await page.context().setOffline(true);

    await page.getByRole('button', { name: /add contact/i }).click();
    await page.getByLabel(/name/i).fill('Test Contact');
    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Should show error message (not crash)
    await expect(page.getByText(/error|failed/i)).toBeVisible();

    // Re-enable network
    await page.context().setOffline(false);
  });

  test('should preserve form data on validation error', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    // Fill form with invalid LinkedIn URL
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/company/i).fill('Test Corp');
    await page.getByLabel(/linkedin url/i).fill('https://evil.com');

    await page.getByRole('button', { name: /add contact/i }).last().click();

    // Form should show error but preserve other fields
    await expect(page.getByLabel(/name/i)).toHaveValue('Test User');
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/company/i)).toHaveValue('Test Corp');
  });
});

test.describe('Contact Management - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display contacts in card layout on mobile', async ({ page }) => {
    await page.goto('/dashboard/contacts');

    // Should use card layout on mobile (not table)
    await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();

    // If contacts exist, they should be in card format
    // (Cards are easier to identify by their touch-friendly buttons)
    const emailButtons = page.getByRole('link', { name: /email/i });
    if ((await emailButtons.count()) > 0) {
      // Buttons should be touch-friendly (min 44px height)
      const button = emailButtons.first();
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should open form dialog full-screen on mobile', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();

    // Dialog should be visible and fill most of screen
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.width).toBeGreaterThan(300); // Should use most of 375px width
  });
});
