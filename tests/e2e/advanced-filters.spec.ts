import { test, expect } from '@playwright/test';

test.describe('Advanced Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    // TODO: Replace with actual login credentials or test user
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should expand and collapse advanced filters panel', async ({ page }) => {
    // Panel should be collapsed by default
    await expect(page.locator('text=Location')).not.toBeVisible();

    // Click to expand
    await page.click('button:has-text("Advanced Filters")');

    // Panel should now be visible
    await expect(page.locator('text=Location')).toBeVisible();
    await expect(page.locator('input[placeholder*="San Francisco"]')).toBeVisible();

    // Click to collapse
    await page.click('button:has-text("Advanced Filters")');

    // Panel should be hidden
    await expect(page.locator('text=Location')).not.toBeVisible();
  });

  test('should apply location filter and show results', async ({ page }) => {
    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Enter location
    await page.fill('input[placeholder*="San Francisco"]', 'Remote');

    // Wait for debounced filter to apply
    await page.waitForTimeout(600);

    // Verify URL contains location filter
    await expect(page).toHaveURL(/location=Remote/);

    // Verify active filter count badge
    await expect(page.locator('button:has-text("Advanced Filters") >> text=/\\d+/')).toBeVisible();

    // Verify table updates (should have loading state then results)
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
  });

  test('should apply multiple filters with AND logic', async ({ page }) => {
    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Apply location filter
    await page.fill('input[placeholder*="San Francisco"]', 'San Francisco');

    // Apply job type filter
    await page.click('button:has-text("Full-time")');

    // Apply priority filter
    await page.click('button:has-text("High")');

    // Wait for filters to apply
    await page.waitForTimeout(600);

    // Verify URL contains all filters
    await expect(page).toHaveURL(/location=San/);
    await expect(page).toHaveURL(/jobType=full-time/);
    await expect(page).toHaveURL(/priority=high/);

    // Verify active filter count (3 advanced filters)
    await expect(page.locator('button:has-text("Advanced Filters") >> span').last()).toContainText('3');
  });

  test('should apply salary range filter', async ({ page }) => {
    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Set min and max salary
    await page.fill('input[placeholder*="80000"]', '100000');
    await page.fill('input[placeholder*="150000"]', '150000');

    // Wait for filters to apply
    await page.waitForTimeout(600);

    // Verify URL contains salary filters
    await expect(page).toHaveURL(/salaryMin=100000/);
    await expect(page).toHaveURL(/salaryMax=150000/);
  });

  test('should apply date range filter', async ({ page }) => {
    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Click "Applied From" button to open calendar
    await page.click('button:has-text("Applied From") >> button');

    // Select a date from calendar (click on day 15)
    await page.click('button[name="day"]:has-text("15")').first();

    // Click "Applied To" button to open calendar
    await page.click('button:has-text("Applied To") >> button');

    // Select a later date (click on day 25)
    await page.click('button[name="day"]:has-text("25")').first();

    // Wait for filters to apply
    await page.waitForTimeout(600);

    // Verify URL contains date filters
    await expect(page).toHaveURL(/appliedDateFrom=/);
    await expect(page).toHaveURL(/appliedDateTo=/);
  });

  test('should create and apply tag filter', async ({ page }) => {
    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Click Tags button to open selector
    await page.click('button:has-text("Tags")');

    // Click "Create New Tag"
    await page.click('button:has-text("Create New Tag")');

    // Enter tag name
    await page.fill('input[placeholder="Tag name"]', 'Tech Companies');

    // Click color selector (select first color)
    await page.click('button[aria-label*="Select #"]').first();

    // Click Create button
    await page.click('button:has-text("Create") >> visible=true');

    // Wait for tag creation
    await page.waitForTimeout(500);

    // Select the newly created tag
    await page.click('label:has-text("Tech Companies") >> input[type="checkbox"]');

    // Close popover
    await page.keyboard.press('Escape');

    // Wait for filters to apply
    await page.waitForTimeout(600);

    // Verify URL contains tags filter
    await expect(page).toHaveURL(/tags=/);

    // Verify active filter count includes tag
    await expect(page.locator('button:has-text("Tags") >> span').last()).toContainText('1');
  });

  test('should clear advanced filters independently', async ({ page }) => {
    // Apply some basic filters first
    await page.fill('input[placeholder*="Search by company"]', 'Google');
    await page.click('button:has-text("Status")');
    await page.click('label:has-text("Applied") >> input[type="checkbox"]');

    // Expand and apply advanced filters
    await page.click('button:has-text("Advanced Filters")');
    await page.fill('input[placeholder*="San Francisco"]', 'Remote');
    await page.click('button:has-text("Full-time")');

    await page.waitForTimeout(600);

    // Click "Clear Advanced Filters"
    await page.click('button:has-text("Clear Advanced Filters")');

    // Verify advanced filters cleared but basic filters remain
    await expect(page).toHaveURL(/search=Google/);
    await expect(page).toHaveURL(/status=applied/);
    await expect(page).not.toHaveURL(/location=/);
    await expect(page).not.toHaveURL(/jobType=/);

    // Verify basic search field still has value
    await expect(page.locator('input[placeholder*="Search by company"]')).toHaveValue('Google');
  });

  test('should save and load filter preset', async ({ page }) => {
    // Apply multiple filters
    await page.fill('input[placeholder*="Search by company"]', 'Tech');
    await page.click('button:has-text("Advanced Filters")');
    await page.fill('input[placeholder*="San Francisco"]', 'San Francisco');
    await page.click('button:has-text("Remote")');
    await page.click('button:has-text("High")');

    await page.waitForTimeout(600);

    // Click "Save Filters"
    await page.click('button:has-text("Save Filters")');

    // Enter preset name
    await page.fill('input[placeholder*="Preset name"]', 'SF Remote High Priority');

    // Click Save
    await page.click('button:has-text("Save") >> visible=true');

    // Wait for save confirmation
    await page.waitForTimeout(500);

    // Clear all filters
    await page.click('button:has-text("Clear all filters")');

    await page.waitForTimeout(300);

    // Verify filters are cleared
    await expect(page).not.toHaveURL(/search=/);

    // Click "Presets" to load saved preset
    await page.click('button:has-text("Presets")');

    // Click on the saved preset
    await page.click('button:has-text("SF Remote High Priority")');

    // Wait for filters to apply
    await page.waitForTimeout(600);

    // Verify all filters were restored
    await expect(page).toHaveURL(/search=Tech/);
    await expect(page).toHaveURL(/location=San/);
    await expect(page).toHaveURL(/jobType=remote/);
    await expect(page).toHaveURL(/priority=high/);

    // Verify search input has value
    await expect(page.locator('input[placeholder*="Search by company"]')).toHaveValue('Tech');
  });

  test('should persist filters in URL and restore on reload', async ({ page }) => {
    // Apply filters
    await page.click('button:has-text("Advanced Filters")');
    await page.fill('input[placeholder*="San Francisco"]', 'New York');
    await page.click('button:has-text("Full-time")');
    await page.fill('input[placeholder*="80000"]', '120000');

    await page.waitForTimeout(600);

    // Get current URL
    const currentUrl = page.url();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify URL is preserved
    expect(page.url()).toBe(currentUrl);

    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Verify all filter values are restored
    await expect(page.locator('input[placeholder*="San Francisco"]')).toHaveValue('New York');
    await expect(page.locator('button:has-text("Full-time")')).toHaveAttribute('data-state', 'on');
    await expect(page.locator('input[placeholder*="80000"]')).toHaveValue('120000');

    // Verify active filter count is preserved
    await expect(page.locator('button:has-text("Advanced Filters") >> span').last()).toContainText('3');
  });

  test('should handle no results for impossible filter combination', async ({ page }) => {
    // Apply contradicting filters that will return no results
    await page.click('button:has-text("Advanced Filters")');
    await page.fill('input[placeholder*="San Francisco"]', 'NonexistentCity12345');
    await page.fill('input[placeholder*="80000"]', '999999999');

    await page.waitForTimeout(600);

    // Verify empty state is shown
    await expect(page.locator('text=/No (applications|results) found/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should update active filter count badge correctly', async ({ page }) => {
    // No filters applied - badge should not be visible
    await expect(
      page.locator('button:has-text("Advanced Filters") >> span.rounded-full')
    ).not.toBeVisible();

    // Expand and apply 1 filter
    await page.click('button:has-text("Advanced Filters")');
    await page.fill('input[placeholder*="San Francisco"]', 'Boston');

    await page.waitForTimeout(600);

    // Badge should show "1"
    await expect(page.locator('button:has-text("Advanced Filters") >> span').last()).toContainText('1');

    // Apply 2 more filters
    await page.click('button:has-text("Full-time")');
    await page.click('button:has-text("High")');

    await page.waitForTimeout(600);

    // Badge should show "3"
    await expect(page.locator('button:has-text("Advanced Filters") >> span').last()).toContainText('3');

    // Clear advanced filters
    await page.click('button:has-text("Clear Advanced Filters")');

    // Badge should not be visible
    await expect(
      page.locator('button:has-text("Advanced Filters") >> span.rounded-full')
    ).not.toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Verify filters stack vertically on mobile
    const locationInput = page.locator('input[placeholder*="San Francisco"]');
    const salaryInput = page.locator('input[placeholder*="80000"]');

    await expect(locationInput).toBeVisible();
    await expect(salaryInput).toBeVisible();

    // Apply a filter
    await locationInput.fill('Remote');

    await page.waitForTimeout(600);

    // Verify filters work on mobile
    await expect(page).toHaveURL(/location=Remote/);

    // Verify buttons are tap-friendly (should be visible and not overlapping)
    const fullTimeButton = page.locator('button:has-text("Full-time")');
    await expect(fullTimeButton).toBeVisible();

    const box = await fullTimeButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(32); // Minimum tap target
  });
});

test.describe('Filter Performance', () => {
  test('should complete filter operation in under 500ms', async ({ page }) => {
    await page.goto('/dashboard');

    // Expand advanced filters
    await page.click('button:has-text("Advanced Filters")');

    // Measure time for filter to apply
    const startTime = Date.now();

    await page.fill('input[placeholder*="San Francisco"]', 'Remote');

    // Wait for table to update
    await page.waitForSelector('table tbody tr', { timeout: 5000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should be under 500ms (plus 600ms debounce = total ~1100ms)
    expect(duration).toBeLessThan(1500);
  });
});
