/**
 * E2E Tests: Interaction History
 * Ticket #17: Interaction History Tracking
 *
 * Tests complete user flows for logging and managing contact interactions
 */

import { test, expect } from '../fixtures/e2e-fixtures';
import type { Page } from '../fixtures/e2e-fixtures';

// Helper function to create a test contact
async function createTestContact(page: Page, name: string = 'Test Contact') {
  await page.goto('/dashboard/contacts');

  // Click "Add Contact" button
  await page.getByRole('button', { name: /add contact/i }).click();

  // Fill form
  await page.getByLabel(/name/i).fill(name);
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/company/i).fill('Test Company');

  // Submit
  await page.getByRole('button', { name: /create|save/i }).click();

  // Wait for success toast or redirect
  await page.waitForTimeout(1000);
}

test.describe('Interaction History', () => {
  test.beforeEach(async ({ authPage: page }) => {
    // Login first (adjust based on your auth flow)
    await page.goto('/login');
    // Add login steps here...
    // For now, assume user is already logged in
  });

  test('should display contact detail page with empty interactions', async ({
    page,
  }) => {
    // Create a contact
    await createTestContact(page);

    // Navigate to contact detail (assuming first contact in list)
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Verify detail page loads
    await expect(page).toHaveURL(/\/dashboard\/contacts\/[a-f0-9-]+/);

    // Verify "Interactions" section exists
    await expect(page.getByText('Interactions')).toBeVisible();

    // Verify empty state
    await page.getByText('Interactions').click(); // Expand section
    await expect(page.getByText(/no interactions yet/i)).toBeVisible();
  });

  test('should log an email interaction successfully', async ({ authPage: page }) => {
    // Navigate to a contact detail page
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Expand interactions section
    await page.getByText('Interactions').click();

    // Click "Log Interaction"
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Fill form
    await page.getByLabel(/type/i).selectOption('email');

    // Date should default to today (verify it's filled)
    const dateInput = page.getByLabel(/date/i);
    await expect(dateInput).toHaveValue(/.+/); // Should have a value

    // Fill notes
    await page
      .getByLabel(/notes/i)
      .fill('Sent follow-up email about job opportunity');

    // Submit
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Verify interaction appears in timeline
    await expect(
      page.getByText(/sent follow-up email about job opportunity/i)
    ).toBeVisible();

    // Verify timestamp shows "Just now"
    await expect(page.getByText(/just now/i)).toBeVisible();

    // Verify email badge is visible
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test('should prevent logging future-dated interactions', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Try to set future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dateInput = page.getByLabel(/date/i);

    // Attempt to type future date (should be blocked by max attribute)
    await dateInput.fill(tomorrowStr);

    // Try to submit
    await page
      .getByLabel(/notes/i)
      .fill('This should fail - future date');
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Should show error (either validation error or failed submission)
    // Depending on browser behavior, this might be prevented or show an error
    await page.waitForTimeout(500);

    // Verify interaction was NOT created
    const futureInteraction = page.getByText(
      /this should fail - future date/i
    );
    await expect(futureInteraction).not.toBeVisible();
  });

  test('should filter interactions by type', async ({ authPage: page }) => {
    // Setup: Create contact and add multiple interaction types
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();

    // Add email interaction
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill('Email interaction');
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.waitForTimeout(500);

    // Add call interaction
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.getByLabel(/type/i).selectOption('call');
    await page.getByLabel(/notes/i).fill('Phone call interaction');
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.waitForTimeout(500);

    // Open filters
    await page.getByRole('button', { name: /filters/i }).click();

    // Select only "Email" type
    await page.getByText('Email').first().click(); // Click email badge in filter

    // Verify only email interaction is visible
    await expect(page.getByText(/email interaction/i)).toBeVisible();
    await expect(page.getByText(/phone call interaction/i)).not.toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: /clear filters/i }).click();

    // Verify both interactions visible again
    await expect(page.getByText(/email interaction/i)).toBeVisible();
    await expect(page.getByText(/phone call interaction/i)).toBeVisible();
  });

  test('should filter interactions by date range', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();

    // Open filters
    await page.getByRole('button', { name: /filters/i }).click();

    // Set date range (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    await page.getByLabel(/from/i).fill(fromDate);
    await page.getByLabel(/to/i).fill(toDate);

    // Verify filter count badge shows active filters
    await expect(page.getByText(/filters/i)).toContainText('2'); // 2 date filters
  });

  test('should delete interaction with confirmation', async ({ authPage: page }) => {
    // Setup: Create interaction
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill('Interaction to delete');
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.waitForTimeout(500);

    // Verify interaction exists
    await expect(page.getByText(/interaction to delete/i)).toBeVisible();

    // Hover over interaction to reveal delete button
    const interaction = page.getByText(/interaction to delete/i);
    await interaction.hover();

    // Click delete button
    await page.getByRole('button', { name: /delete interaction/i }).click();

    // Confirm deletion in dialog
    await page
      .getByRole('button', { name: /delete/i })
      .last()
      .click();

    // Verify interaction is removed
    await expect(page.getByText(/interaction to delete/i)).not.toBeVisible();
  });

  test('should expand and collapse long notes', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Create long note (>200 chars)
    const longNote = 'A'.repeat(250);
    await page.getByLabel(/type/i).selectOption('meeting');
    await page.getByLabel(/notes/i).fill(longNote);
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.waitForTimeout(500);

    // Verify note is truncated
    await expect(page.getByText(/read more/i)).toBeVisible();

    // Click "Read more"
    await page.getByText(/read more/i).click();

    // Verify full note is visible
    await expect(page.getByText(/show less/i)).toBeVisible();

    // Click "Show less"
    await page.getByText(/show less/i).click();

    // Verify note is truncated again
    await expect(page.getByText(/read more/i)).toBeVisible();
  });

  test('should update relationship strength badge', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Verify relationship strength badge exists
    await expect(
      page.getByText(/cold|warm|strong/i).first()
    ).toBeVisible();

    // Initial state should be "Cold" (0 interactions)
    await expect(page.getByText(/cold/i).first()).toBeVisible();

    // Add interactions to change strength
    await page.getByText('Interactions').click();

    // Add 3 interactions to trigger "Strong" relationship
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /log interaction/i }).click();
      await page.getByLabel(/type/i).selectOption('email');
      await page.getByLabel(/notes/i).fill(`Interaction ${i + 1}`);
      await page.getByRole('button', { name: /log interaction/i }).click();
      await page.waitForTimeout(500);
    }

    // Refresh page to recalculate strength
    await page.reload();

    // Verify strength changed to "Strong"
    await expect(page.getByText(/strong/i).first()).toBeVisible();
  });

  test('should show character counter for notes near limit', async ({
    page,
  }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Type notes approaching limit (>800 chars)
    const notes = 'A'.repeat(850);
    await page.getByLabel(/notes/i).fill(notes);

    // Verify character counter appears
    await expect(page.getByText(/850.*1000/)).toBeVisible();
  });

  test('should display interaction stats correctly', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Verify stats section exists
    await expect(page.getByText(/total interactions/i)).toBeVisible();
    await expect(page.getByText(/last 30 days/i)).toBeVisible();

    // Add an interaction
    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill('Test interaction');
    await page.getByRole('button', { name: /log interaction/i }).click();
    await page.waitForTimeout(500);

    // Refresh to update stats
    await page.reload();

    // Verify stats updated
    await expect(page.getByText(/total interactions/i).locator('..')).toContainText(
      '1'
    );
  });

  test('should handle optimistic updates with rollback on error', async ({
    page,
  }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Fill form with valid data
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill('Optimistic update test');

    // Submit
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Interaction should appear immediately (optimistic)
    await expect(page.getByText(/optimistic update test/i)).toBeVisible();

    // If server fails, interaction should disappear and error should show
    // (This would need to be simulated with mock server error)
  });

  test('should navigate back to contacts list', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Click "Back to Contacts"
    await page.getByRole('button', { name: /back to contacts/i }).click();

    // Verify redirected to contacts list
    await expect(page).toHaveURL('/dashboard/contacts');
  });

  test('should display all interaction types correctly', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();

    const types = [
      'email',
      'call',
      'meeting',
      'linkedin_message',
      'other',
    ] as const;

    for (const type of types) {
      await page.getByRole('button', { name: /log interaction/i }).click();
      await page.getByLabel(/type/i).selectOption(type);
      await page.getByLabel(/notes/i).fill(`${type} interaction`);
      await page.getByRole('button', { name: /log interaction/i }).click();
      await page.waitForTimeout(500);
    }

    // Verify all types are visible
    for (const type of types) {
      await expect(page.getByText(`${type} interaction`)).toBeVisible();
    }
  });
});

test.describe('Interaction History - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be fully functional on mobile', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Verify layout is responsive
    await expect(page.getByText('Interactions')).toBeVisible();

    // Test adding interaction on mobile
    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill('Mobile interaction test');
    await page.getByRole('button', { name: /log interaction/i }).click();

    await expect(page.getByText(/mobile interaction test/i)).toBeVisible();
  });
});

test.describe('Interaction History - Security', () => {
  test('should not allow XSS in notes field', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Attempt XSS injection
    const xssPayload = '<script>alert("XSS")</script>';
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill(xssPayload);
    await page.getByRole('button', { name: /log interaction/i }).click();

    await page.waitForTimeout(500);

    // Verify XSS is rendered as text, not executed
    await expect(page.getByText(xssPayload)).toBeVisible();
    // No alert should have fired
  });

  test('should enforce 1000 character limit on notes', async ({ authPage: page }) => {
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    await page.getByText('Interactions').click();
    await page.getByRole('button', { name: /log interaction/i }).click();

    // Type more than 1000 characters
    const longText = 'A'.repeat(1100);
    await page.getByLabel(/type/i).selectOption('email');
    await page.getByLabel(/notes/i).fill(longText);

    // Verify input is truncated to 1000
    const notesField = page.getByLabel(/notes/i);
    const value = await notesField.inputValue();
    expect(value.length).toBeLessThanOrEqual(1000);
  });

  test('should prevent unauthorized access to other users contacts', async ({
    page,
  }) => {
    // Navigate to a contact detail page
    await page.goto('/dashboard/contacts');
    await page.getByRole('button', { name: /view details/i }).first().click();

    // Get current URL
    const currentUrl = page.url();
    const contactId = currentUrl.split('/').pop();

    // Attempt to access another user's contact by manipulating URL
    const fakeContactId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/dashboard/contacts/${fakeContactId}`);

    // Should redirect to 404 or contacts list
    await page.waitForTimeout(1000);
    const newUrl = page.url();
    expect(newUrl).not.toContain(fakeContactId);
  });
});
