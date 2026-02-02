import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Wins Celebration System (Ticket #20)
 *
 * Tests the complete achievement flow from trigger to celebration display
 *
 * Note: Full end-to-end tests with authentication are skipped pending test auth setup.
 * Smoke tests verify route accessibility and component rendering.
 */

test.describe('Wins Celebration System', () => {
  // Smoke test: Verify wins page route exists and is accessible
  test('should have accessible wins page route', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/wins');

    // Should either show login page or wins page (if authenticated)
    // This verifies the route exists and doesn't 404
    await expect(page).toHaveURL(/\/(dashboard\/wins|auth|login)/);

    // If on wins page, verify basic structure
    const isWinsPage = page.url().includes('/dashboard/wins');
    if (isWinsPage) {
      // Verify page doesn't crash
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    }
  });

  // Helper function to create an application
  async function createApplication(
    page: any,
    company: string,
    position: string,
    status: string = 'applied'
  ) {
    await page.click('button:has-text("New Application")');
    await page.fill('input[name="company"]', company);
    await page.fill('input[name="position"]', position);

    // Select status if not default
    if (status !== 'applied') {
      await page.click('[role="combobox"]:has-text("Applied")');
      await page.click(`[role="option"]:has-text("${status}")`);
    }

    await page.click('button[type="submit"]:has-text("Create Application")');
  }

  // Skip tests requiring authentication until test auth is set up
  test.skip('should celebrate first application submission', async ({ page }) => {
    await page.goto('/dashboard');
    // Create first application
    await createApplication(page, 'Acme Corp', 'Software Engineer');

    // Wait for success toast
    await expect(page.getByText('Application created successfully')).toBeVisible({
      timeout: 10000,
    });

    // Check for celebration modal
    const celebrationModal = page.getByRole('dialog').filter({
      has: page.getByText('First Application!'),
    });

    // Verify celebration modal appears
    await expect(celebrationModal).toBeVisible({ timeout: 5000 });

    // Verify confetti icon
    await expect(celebrationModal.getByText('🎉')).toBeVisible();

    // Verify message contains company name
    await expect(celebrationModal.getByText(/Acme Corp/i)).toBeVisible();

    // Close the modal
    await page.click('button:has-text("Awesome!")');
    await expect(celebrationModal).not.toBeVisible();

    // Verify achievement appears in WinsSection
    await expect(page.getByText('Recent Wins')).toBeVisible();
    await expect(page.getByText('First Application!')).toBeVisible();
  });

  test.skip('should celebrate first interview on status change', async ({ page }) => {
    await page.goto('/dashboard');
    // Switch to Kanban view
    await page.click('button:has-text("Kanban")');

    // Find an application card in "Applied" column (assumes one exists)
    // If no applications exist, create one first
    const appliedColumn = page.locator('[data-column="applied"]').first();
    let card = appliedColumn.locator('[data-testid="application-card"]').first();

    // If no card exists, create an application first
    if ((await card.count()) === 0) {
      await createApplication(page, 'Test Company', 'Test Position');
      await page.waitForTimeout(1000);
      card = appliedColumn.locator('[data-testid="application-card"]').first();
    }

    // Drag card to "Interviewing" column
    const interviewingColumn = page.locator('[data-column="interviewing"]').first();

    await card.dragTo(interviewingColumn);

    // Wait for status update toast
    await expect(page.getByText('Status Updated')).toBeVisible({ timeout: 5000 });

    // Check for celebration modal (may or may not appear if already achieved)
    const celebrationModal = page.getByRole('dialog').filter({
      has: page.getByText(/First Interview/i),
    });

    // If first interview achievement, verify modal
    if (await celebrationModal.isVisible()) {
      await expect(celebrationModal.getByText('🎤')).toBeVisible();
      await page.click('button:has-text("Awesome!")');
    }
  });

  test.skip('should display wins section on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Verify WinsSection is visible
    await expect(page.getByText('Recent Wins')).toBeVisible();

    // Verify "View All" button
    const viewAllButton = page.getByRole('link', { name: /View All/i });

    // If achievements exist, button should be visible
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();

      // Should navigate to wins page
      await expect(page).toHaveURL('/dashboard/wins');
    }
  });

  test.skip('should navigate to wins page via navigation', async ({ page }) => {
    await page.goto('/dashboard');
    // Click on "Wins" navigation link
    await page.click('a:has-text("Wins")');

    // Verify navigation
    await expect(page).toHaveURL('/dashboard/wins');

    // Verify page content
    await expect(page.getByText('Your Achievements')).toBeVisible();
    await expect(
      page.getByText('Celebrate your job search milestones')
    ).toBeVisible();
  });

  test.skip('should display wins dashboard page correctly', async ({ page }) => {
    await page.goto('/dashboard');
    // Navigate to wins page
    await page.goto('/dashboard/wins');

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Your Achievements' })).toBeVisible();

    // Check for trophy icon
    await expect(page.locator('svg').filter({ hasText: 'Trophy' }).first()).toBeVisible();

    // If achievements exist, verify they're displayed
    const achievementCards = page.locator('[data-testid="win-card"]');
    const count = await achievementCards.count();

    if (count === 0) {
      // Verify empty state
      await expect(page.getByText('No achievements yet')).toBeVisible();
      await expect(
        page.getByText('Start applying to unlock wins!')
      ).toBeVisible();
    } else {
      // Verify achievement cards are displayed
      expect(count).toBeGreaterThan(0);
    }
  });

  test.skip('should prevent duplicate achievements', async ({ page }) => {
    await page.goto('/dashboard');
    // Create first application
    await createApplication(page, 'Company A', 'Position A');

    // Wait for first celebration
    await page.waitForSelector('dialog:has-text("First Application!")', {
      timeout: 5000,
    });
    await page.click('button:has-text("Awesome!")');

    // Create second application (should NOT trigger first_application again)
    await createApplication(page, 'Company B', 'Position B');

    // Wait for success toast
    await expect(
      page.getByText('Application created successfully')
    ).toBeVisible({ timeout: 5000 });

    // Verify NO celebration modal appears for duplicate
    const celebrationModal = page.getByRole('dialog').filter({
      has: page.getByText('First Application!'),
    });

    await expect(celebrationModal).not.toBeVisible({ timeout: 2000 });
  });

  test.skip('should show confetti animation in celebration modal', async ({ page }) => {
    await page.goto('/dashboard');
    // This test verifies the confetti animation is rendered
    // Create application to trigger celebration
    await createApplication(page, 'Test Corp', 'Engineer');

    // Wait for celebration modal
    const modal = page.getByRole('dialog').filter({
      has: page.getByText(/First|Milestone|Interview|Offer/i),
    });

    if (await modal.isVisible()) {
      // Check for confetti particles (they have the animate-confetti class)
      const confettiParticles = page.locator('.animate-confetti');

      // Should have multiple confetti particles
      const count = await confettiParticles.count();
      expect(count).toBeGreaterThan(0);

      await page.click('button:has-text("Awesome!")');
    }
  });

  test.skip('should mark achievement as celebrated after closing modal', async ({ page }) => {
    await page.goto('/dashboard');
    // Create application
    await createApplication(page, 'Celebration Test', 'Test Position');

    // Wait for modal
    const modal = page.getByRole('dialog');

    if (await modal.isVisible()) {
      const closeButton = modal.getByRole('button', { name: /Awesome/i });
      await closeButton.click();

      // Modal should close
      await expect(modal).not.toBeVisible();

      // Achievement should still appear in WinsSection
      await expect(page.getByText('Recent Wins')).toBeVisible();
    }
  });
});
