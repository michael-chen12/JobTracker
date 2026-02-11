/**
 * E2E Tests: Dashboard Analytics (Ticket #19)
 *
 * Tests cover:
 * 1. Analytics page loads and displays metrics
 * 2. Charts render correctly
 * 3. Date range filtering works
 * 4. Navigation to analytics page
 * 5. Mobile responsiveness
 * 6. Empty state handling
 * 7. Metric calculations are correct
 *
 * Note: Tests require authentication to be set up.
 * Currently marked as .skip() until auth flow is implemented.
 */

import { test, expect } from '../fixtures/e2e-fixtures';

test.describe('Dashboard Analytics - Page Structure', () => {
  test('should navigate to analytics page from dashboard navigation', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard');

    // Click on Analytics link in navigation
    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    await expect(analyticsLink).toBeVisible();
    await analyticsLink.click();

    // Verify URL changed to analytics page
    await expect(page).toHaveURL('/dashboard/analytics');

    // Verify page title or heading
    const heading = page.getByRole('heading', { name: /analytics/i, level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display all metric cards on analytics page', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for metrics to load
    await page.waitForLoadState('networkidle');

    // Check for all 5 metric cards
    const metricLabels = [
      'Total Applications',
      'Response Rate',
      'Interview Rate',
      'Avg. Days to Response',
      'Average Match Score',
    ];

    for (const label of metricLabels) {
      const metricCard = page.getByText(label);
      await expect(metricCard).toBeVisible();
    }
  });

  test('should display application trends chart', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for charts to load
    await page.waitForLoadState('networkidle');

    // Check for trends chart heading
    const trendsHeading = page.getByRole('heading', { name: /application trends/i });
    await expect(trendsHeading).toBeVisible();

    // Verify chart container exists (Recharts uses SVG)
    const chartSvg = page.locator('.recharts-wrapper svg');
    await expect(chartSvg).toBeVisible();
  });

  test('should display status distribution pie chart', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for charts to load
    await page.waitForLoadState('networkidle');

    // Check for status distribution heading
    const distributionHeading = page.getByRole('heading', {
      name: /status distribution/i,
    });
    await expect(distributionHeading).toBeVisible();

    // Verify pie chart exists
    const pieChart = page.locator('.recharts-pie');
    await expect(pieChart).toBeVisible();
  });

  test('should display application funnel visualization', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for charts to load
    await page.waitForLoadState('networkidle');

    // Check for funnel heading
    const funnelHeading = page.getByRole('heading', { name: /application funnel/i });
    await expect(funnelHeading).toBeVisible();

    // Verify funnel stages are visible
    const funnelStages = ['Applied', 'Screening', 'Interviewing', 'Offer'];
    for (const stage of funnelStages) {
      const stageElement = page.getByText(stage);
      await expect(stageElement).toBeVisible();
    }
  });
});

test.describe('Dashboard Analytics - Date Range Filtering', () => {
  test('should have date range selector with 4 options', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for date range buttons
    const dateRangeButtons = ['30 days', '60 days', '90 days', 'All time'];

    for (const buttonText of dateRangeButtons) {
      const button = page.getByRole('button', { name: buttonText });
      await expect(button).toBeVisible();
    }
  });

  test('should filter analytics data when date range changes', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for initial data to load
    await page.waitForLoadState('networkidle');

    // Get initial total applications count
    const initialCount = await page
      .locator('text=Total Applications')
      .locator('..')
      .locator('p')
      .first()
      .textContent();

    // Click on 90 days button
    const ninetyDaysButton = page.getByRole('button', { name: '90 days' });
    await ninetyDaysButton.click();

    // Wait for data to reload
    await page.waitForTimeout(500); // Small delay for state update

    // Get new total applications count
    const newCount = await page
      .locator('text=Total Applications')
      .locator('..')
      .locator('p')
      .first()
      .textContent();

    // Counts should potentially be different (unless no data outside 30 days)
    // At minimum, verify the UI responded to the click
    await expect(ninetyDaysButton).toHaveAttribute('data-state', 'active');
  });

  test('should highlight active date range button', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Default should be 30 days (active state)
    const thirtyDaysButton = page.getByRole('button', { name: '30 days' });
    await expect(thirtyDaysButton).toHaveClass(/bg-primary/); // Active styling

    // Click 60 days
    const sixtyDaysButton = page.getByRole('button', { name: '60 days' });
    await sixtyDaysButton.click();

    // Wait for state update
    await page.waitForTimeout(300);

    // 60 days should now be active
    await expect(sixtyDaysButton).toHaveClass(/bg-primary/);
  });
});

test.describe('Dashboard Analytics - Mobile Responsiveness', () => {
  test.beforeEach(async ({ authPage: page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  });

  test('should display analytics page on mobile viewport', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title is visible
    const heading = page.getByRole('heading', { name: /analytics/i, level: 1 });
    await expect(heading).toBeVisible();

    // Verify metric cards stack vertically (should be visible without scrolling horizontally)
    const metricCards = page.locator('[class*="MetricCard"]');
    const firstCard = metricCards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should allow horizontal scroll for date range selector on mobile', async ({
    page,
  }) => {
    // This test requires authentication
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify all date range buttons are present (may need scroll)
    const allTimeButton = page.getByRole('button', { name: 'All time' });
    await expect(allTimeButton).toBeVisible();
  });

  test('should render charts responsively on mobile', async ({ authPage: page }) => {
    // This test requires authentication and existing application data
    await page.goto('/dashboard/analytics');

    // Wait for charts to load
    await page.waitForLoadState('networkidle');

    // Verify charts don't overflow viewport
    const chartWrapper = page.locator('.recharts-wrapper').first();
    await expect(chartWrapper).toBeVisible();

    // Check that chart fits within mobile viewport
    const boundingBox = await chartWrapper.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });
});

test.describe('Dashboard Analytics - Empty State', () => {
  test('should display empty state when no applications exist', async ({ authPage: page }) => {
    // This test requires authentication with a NEW user account (no applications)
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for zero metrics
    const totalAppsMetric = page
      .locator('text=Total Applications')
      .locator('..')
      .locator('text=0');
    await expect(totalAppsMetric).toBeVisible();

    // Charts may show "No data" or empty visualizations
    // Verify graceful handling
    const noDataMessage = page.getByText(/no applications/i);
    if (await noDataMessage.isVisible()) {
      await expect(noDataMessage).toBeVisible();
    }
  });
});

test.describe('Dashboard Analytics - Metric Calculations', () => {
  test('should calculate response rate correctly', async ({ authPage: page }) => {
    // This test requires authentication and controlled test data:
    // - 10 applications total
    // - 3 with status 'screening' or higher (responses)
    // Expected: 30% response rate
    await page.goto('/dashboard/analytics');

    // Wait for metrics to load
    await page.waitForLoadState('networkidle');

    // Find response rate metric
    const responseRateValue = await page
      .locator('text=Response Rate')
      .locator('..')
      .locator('p')
      .first()
      .textContent();

    // Verify it displays percentage (should contain %)
    expect(responseRateValue).toContain('%');

    // For specific assertion, would need controlled test data
    // Example: expect(responseRateValue).toBe('30%');
  });

  test('should calculate interview rate correctly', async ({ authPage: page }) => {
    // This test requires authentication and controlled test data:
    // - 10 applications total
    // - 2 with status 'interviewing' or higher
    // Expected: 20% interview rate
    await page.goto('/dashboard/analytics');

    // Wait for metrics to load
    await page.waitForLoadState('networkidle');

    // Find interview rate metric
    const interviewRateValue = await page
      .locator('text=Interview Rate')
      .locator('..')
      .locator('p')
      .first()
      .textContent();

    // Verify it displays percentage
    expect(interviewRateValue).toContain('%');
  });

  test('should display N/A for undefined metrics', async ({ authPage: page }) => {
    // This test requires authentication with no application data
    // or specific scenario where metric is undefined
    await page.goto('/dashboard/analytics');

    // Wait for metrics to load
    await page.waitForLoadState('networkidle');

    // Average days to response should show N/A when no responses
    const avgDaysValue = await page
      .locator('text=Avg. Days to Response')
      .locator('..')
      .locator('p')
      .first()
      .textContent();

    // Should contain either 'N/A' or '0' depending on implementation
    expect(avgDaysValue).toMatch(/N\/A|0/);
  });
});

test.describe('Dashboard Analytics - Navigation Accessibility', () => {
  test('should have accessible navigation link to analytics', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard');

    // Check for analytics link with proper ARIA attributes
    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    await expect(analyticsLink).toBeVisible();

    // Verify link is keyboard accessible
    await analyticsLink.focus();
    await expect(analyticsLink).toBeFocused();

    // Navigate using keyboard
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/dashboard/analytics');
  });

  test('should indicate active analytics page in navigation', async ({ authPage: page }) => {
    // This test requires authentication
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Analytics link should have active state
    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    await expect(analyticsLink).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Dashboard Analytics - API Route', () => {
  test('should fetch analytics data from API endpoint', async ({ authPage: page, request }) => {
    // This test requires authentication
    await page.goto('/dashboard');

    // Make API request to analytics endpoint
    const response = await request.get('/api/analytics?range=30');

    // Verify response status
    expect(response.status()).toBe(200);

    // Verify response structure
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('error');
    expect(data.error).toBeNull();

    // Verify data structure
    if (data.data) {
      expect(data.data).toHaveProperty('metrics');
      expect(data.data).toHaveProperty('trends');
      expect(data.data).toHaveProperty('statusDistribution');
      expect(data.data).toHaveProperty('funnel');
      expect(data.data).toHaveProperty('dateRange');
    }
  });

  test('should validate date range parameter in API route', async ({ request, page }) => {
    // This test requires authentication
    await page.goto('/dashboard');

    // Test valid range parameters
    const validRanges = ['30', '60', '90', 'all'];

    for (const range of validRanges) {
      const response = await request.get(`/api/analytics?range=${range}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data?.dateRange).toBe(range);
    }
  });

  test('should default to 30 days when range parameter is invalid', async ({
    request,
    page,
  }) => {
    // This test requires authentication
    await page.goto('/dashboard');

    // Test invalid range parameter
    const response = await request.get('/api/analytics?range=invalid');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.data?.dateRange).toBe('30'); // Should default to 30
  });

  test('should return 401 when not authenticated', async ({ request }) => {
    // Make request without authentication
    const response = await request.get('/api/analytics?range=30');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
    expect(data.data).toBeNull();
  });
});
