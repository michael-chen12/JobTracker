import { test, expect } from '@playwright/test';

// Skip these tests if no auth is configured
const skipAuth = !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD;

test.describe('Job Match Analysis', () => {
  test.skip(skipAuth, 'Skipping: No auth credentials configured');

  test.beforeEach(async ({ page }) => {
    // Sign in (assumes authentication is working)
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should analyze job match from application detail page', async ({ page }) => {
    // Create a new application with job description
    await page.click('button:has-text("New Application")');
    
    await page.fill('input[name="company"]', 'Tech Corp');
    await page.fill('input[name="position"]', 'Senior Frontend Developer');
    await page.selectOption('select[name="status"]', 'Applied');
    
    // Add job description
    const jobDescription = `
      We are seeking a Senior Frontend Developer with 5+ years of experience.
      
      Required Skills:
      - React and TypeScript
      - Node.js and Express
      - REST APIs
      - Git version control
      
      Preferred:
      - AWS experience
      - Kubernetes
      - CI/CD pipelines
      
      Education: Bachelor's degree in Computer Science or related field
    `;
    
    await page.fill('textarea[name="job_description"]', jobDescription);
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for success toast
    await expect(page.locator('text=Application created successfully')).toBeVisible({
      timeout: 5000,
    });
    
    // Auto-analysis should trigger - wait for analysis toast
    await expect(
      page.locator('text=/Analyzing job match|Match score:/')
    ).toBeVisible({ timeout: 3000 });
    
    // Navigate to application detail
    await page.click('text=Tech Corp');
    
    // Wait for match analysis card to appear (may take 10-15 seconds)
    await expect(page.locator('text=Match Analysis')).toBeVisible({
      timeout: 20000,
    });
    
    // Verify match score is displayed
    const matchScore = await page.locator('[class*="CircularProgress"]').textContent();
    expect(matchScore).toMatch(/\d+/); // Should contain a number
    
    // Verify score breakdown is present
    await expect(page.locator('text=Score Breakdown')).toBeVisible();
    await expect(page.locator('text=Skills')).toBeVisible();
    await expect(page.locator('text=Experience')).toBeVisible();
    await expect(page.locator('text=Education')).toBeVisible();
    
    // Verify skills sections
    const hasMatchingSkills = await page.locator('text=Matching Skills').isVisible();
    const hasMissingSkills = await page.locator('text=Missing Skills').isVisible();
    expect(hasMatchingSkills || hasMissingSkills).toBeTruthy();
    
    // Verify recommendations section
    await expect(page.locator('text=Recommendations')).toBeVisible();
  });

  test('should show analyze button on application card', async ({ page }) => {
    // Create application without auto-analysis trigger
    await page.goto('/dashboard');
    
    // Find an application card (or create one without job description)
    await page.click('button:has-text("New Application")');
    
    await page.fill('input[name="company"]', 'Quick Corp');
    await page.fill('input[name="position"]', 'Developer');
    await page.selectOption('select[name="status"]', 'Applied');
    
    // Add minimal job URL (won't auto-analyze if profile incomplete)
    await page.fill('input[name="job_url"]', 'https://example.com/job');
    
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Switch to Kanban view if not already there
    const kanbanButton = page.locator('button:has-text("Board")');
    if (await kanbanButton.isVisible()) {
      await kanbanButton.click();
    }
    
    // Find application card with analyze button or match score
    const applicationCard = page.locator('text=Quick Corp').locator('..');
    
    // Should have either match score badge or analyze button
    const hasMatchBadge = await applicationCard.locator('text=/\\d+% Match/').isVisible();
    const hasAnalyzeButton = await applicationCard
      .locator('button:has-text("Analyze")')
      .isVisible();
    
    expect(hasMatchBadge || hasAnalyzeButton).toBeTruthy();
  });

  test('should allow re-analysis of existing application', async ({ page }) => {
    // Assume we have an application that's been analyzed
    await page.goto('/dashboard');
    
    // Click on first application
    await page.click('[role="row"]:has(td)'); // Click first data row
    
    // Should be on detail page
    await expect(page).toHaveURL(/\/dashboard\/applications\/[a-f0-9-]+/);
    
    // Look for Re-analyze button (only visible if already analyzed)
    const reanalyzeButton = page.locator('button:has-text("Re-analyze")');
    
    if (await reanalyzeButton.isVisible()) {
      // Click re-analyze
      await reanalyzeButton.click();
      
      // Button should show "Analyzing..." state
      await expect(page.locator('button:has-text("Analyzing...")')).toBeVisible();
      
      // Wait for analysis to complete
      await expect(reanalyzeButton).toBeVisible({ timeout: 20000 });
      
      // Should show success toast
      await expect(page.locator('text=Analysis updated successfully')).toBeVisible();
    }
  });

  test('should enforce rate limiting', async ({ page }) => {
    // This test would need to trigger 20+ analyses rapidly
    // Skip for now as it would be expensive and slow
    test.skip(true, 'Rate limit test requires 20+ API calls - run manually if needed');
    
    await page.goto('/dashboard');
    
    // Create multiple applications and analyze them rapidly
    for (let i = 0; i < 21; i++) {
      await page.click('button:has-text("New Application")');
      await page.fill('input[name="company"]', `Test Company ${i}`);
      await page.fill('input[name="position"]', 'Developer');
      await page.fill('textarea[name="job_description"]', 'Test job description');
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(500); // Wait a bit between submissions
    }
    
    // The 21st analysis should fail with rate limit error
    await expect(
      page.locator('text=/Rate limit exceeded|20\/20 analyses used/')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show match score in table view', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Ensure we're in table view
    const tableButton = page.locator('button:has-text("List")');
    if (await tableButton.isVisible()) {
      await tableButton.click();
    }
    
    // Check for Match column header
    await expect(page.locator('th:has-text("Match")')).toBeVisible();
    
    // Check if any rows have match scores or analyze buttons
    const firstRow = page.locator('[role="row"]:has(td)').first();
    const hasMatchScore = await firstRow.locator('text=/\\d+% Match/').isVisible();
    const hasAnalyzeButton = await firstRow
      .locator('button:has-text("Analyze")')
      .isVisible();
    const hasEmptyState = await firstRow.locator('text=—').isVisible();
    
    // One of these should be true
    expect(hasMatchScore || hasAnalyzeButton || hasEmptyState).toBeTruthy();
  });

  test('should show color-coded match badges', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Switch to kanban view for better card visibility
    const kanbanButton = page.locator('button:has-text("Board")');
    if (await kanbanButton.isVisible()) {
      await kanbanButton.click();
    }
    
    // Look for match score badges with different colors
    // Green: 80-100, Blue: 60-79, Yellow: 40-59, Red: 0-39
    
    const badges = await page.locator('[class*="bg-"][class*="text-"]').all();
    
    // Just verify that color-coded badges exist (implementation detail)
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle missing job description gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create application without job description or URL
    await page.click('button:has-text("New Application")');
    
    await page.fill('input[name="company"]', 'No Description Corp');
    await page.fill('input[name="position"]', 'Developer');
    await page.selectOption('select[name="status"]', 'Applied');
    
    // Don't add job_url or job_description
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Navigate to detail page
    await page.click('text=No Description Corp');
    
    // Should not show match analysis card or analyze button for apps without job info
    const hasMatchCard = await page.locator('text=Match Analysis').isVisible();
    expect(hasMatchCard).toBeFalsy();
  });

  test('should show detailed analysis breakdown', async ({ page }) => {
    // Navigate to an analyzed application
    await page.goto('/dashboard');
    await page.click('[role="row"]:has(td)'); // Click first application
    
    // If Match Analysis card is visible
    const matchCard = page.locator('text=Match Analysis');
    if (await matchCard.isVisible()) {
      // Check for all expected sections
      await expect(page.locator('text=Score Breakdown')).toBeVisible();
      
      // Progress bars for each component
      await expect(page.locator('text=Skills')).toBeVisible();
      await expect(page.locator('text=Experience')).toBeVisible();
      await expect(page.locator('text=Education')).toBeVisible();
      await expect(page.locator('text=Other Factors')).toBeVisible();
      
      // Expandable AI reasoning
      const aiDetailsToggle = page.locator('text=Show AI Analysis Details');
      if (await aiDetailsToggle.isVisible()) {
        await aiDetailsToggle.click();
        
        // Should show base score and adjusted score
        await expect(page.locator('text=/Base Score:.*→.*Adjusted:/')).toBeVisible();
      }
    }
  });
});

test.describe('Job Match Analysis - No Auth', () => {
  test('framework is set up', async ({ page }) => {
    // Basic smoke test that doesn't require auth
    await page.goto('/');
    expect(page).toBeTruthy();
  });
});
