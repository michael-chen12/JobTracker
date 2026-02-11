import { test, expect } from '../fixtures/e2e-fixtures';
import type { Page } from '../fixtures/e2e-fixtures';

// Auth is handled globally via tests/.auth/user.json (see playwright.config.ts)
const FILTER_DEBOUNCE_MS = 700;

function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function waitForFiltersToApply(page: Page) {
  await page.waitForTimeout(FILTER_DEBOUNCE_MS);
}

async function waitForResultsOrEmptyState(page: Page) {
  await Promise.race([
    page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 5000 }),
    page.getByText('No applications found matching your filters.').waitFor({
      state: 'visible',
      timeout: 5000,
    }),
  ]);
}

async function ensureAdvancedFiltersExpanded(page: Page) {
  const locationInput = page.getByPlaceholder('e.g., San Francisco');
  if (await locationInput.isVisible()) return;

  await page.getByRole('button', { name: /Advanced Filters/i }).click();
  await expect(locationInput).toBeVisible();
}

async function pickDate(page: Page, pickerIndex: number) {
  const dateButtons = page.getByRole('button', { name: 'Pick a date' });
  await dateButtons.nth(pickerIndex).click();

  const dayButton = page.locator('.rdp-day_button:not([disabled])').first();
  await expect(dayButton).toBeVisible();
  await dayButton.click();
}

test.describe('Advanced Filtering', () => {

  test.beforeEach(async ({ authPage: page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await waitForResultsOrEmptyState(page);
  });

  test('keeps advanced panel collapsed by default', async ({ authPage: page }) => {
    await expect(page.getByPlaceholder('e.g., San Francisco')).not.toBeVisible();
  });

  test('expands and collapses advanced filters panel', async ({ authPage: page }) => {
    const toggle = page.getByRole('button', { name: /Advanced Filters/i });
    await toggle.click();
    await expect(page.getByPlaceholder('e.g., San Francisco')).toBeVisible();

    await toggle.click();
    await expect(page.getByPlaceholder('e.g., San Francisco')).not.toBeVisible();
  });

  test('applies and clears location filter', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    const locationInput = page.getByPlaceholder('e.g., San Francisco');

    await locationInput.fill('Remote');
    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/location=Remote/);

    await locationInput.fill('');
    await waitForFiltersToApply(page);
    await expect(page).not.toHaveURL(/location=/);
  });

  test('toggles job type filter on and off', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);

    await page.getByRole('button', { name: 'Full-time' }).click();
    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/jobType=full-time/);

    await page.getByRole('button', { name: 'Full-time' }).click();
    await waitForFiltersToApply(page);
    await expect(page).not.toHaveURL(/jobType=/);
  });

  test('toggles priority filter on and off', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);

    await page.getByRole('button', { name: 'High' }).click();
    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/priority=high/);

    await page.getByRole('button', { name: 'High' }).click();
    await waitForFiltersToApply(page);
    await expect(page).not.toHaveURL(/priority=/);
  });

  test('applies min salary only', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., 80000').fill('120000');

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/salaryMin=120000/);
    await expect(page).not.toHaveURL(/salaryMax=/);
  });

  test('applies max salary only', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., 150000').fill('180000');

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/salaryMax=180000/);
    await expect(page).not.toHaveURL(/salaryMin=/);
  });

  test('applies min and max salary range together', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., 80000').fill('100000');
    await page.getByPlaceholder('e.g., 150000').fill('150000');

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/salaryMin=100000/);
    await expect(page).toHaveURL(/salaryMax=150000/);
  });

  test('applies applied-date-from filter', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await pickDate(page, 0);

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/appliedDateFrom=/);
  });

  test('applies applied-date-to filter', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await pickDate(page, 1);

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/appliedDateTo=/);
  });

  test('combines multiple advanced filters with AND logic', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('San Francisco');
    await page.getByRole('button', { name: 'Full-time' }).click();
    await page.getByRole('button', { name: 'High' }).click();

    await waitForFiltersToApply(page);
    await expect(page).toHaveURL(/location=San/);
    await expect(page).toHaveURL(/jobType=full-time/);
    await expect(page).toHaveURL(/priority=high/);
  });

  test('clears advanced filters while preserving basic filters', async ({ authPage: page }) => {
    await page
      .getByPlaceholder('Search by company or position...')
      .fill('Google');

    await page.getByRole('button', { name: /^Status/ }).click();
    await page
      .locator('label:has-text("Applied") input[type="checkbox"]')
      .check();
    await page.keyboard.press('Escape');

    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('Remote');
    await page.getByRole('button', { name: 'Full-time' }).click();
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /Clear Advanced Filters/i }).click();
    await waitForFiltersToApply(page);

    await expect(page).toHaveURL(/search=Google/);
    await expect(page).toHaveURL(/status=applied/);
    await expect(page).not.toHaveURL(/location=/);
    await expect(page).not.toHaveURL(/jobType=/);
  });

  test('clears all filters from toolbar', async ({ authPage: page }) => {
    await page.getByPlaceholder('Search by company or position...').fill('Meta');
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('Austin');
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /Clear all filters/i }).click();
    await waitForFiltersToApply(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByPlaceholder('Search by company or position...')
    ).toHaveValue('');
  });

  test('updates active advanced filter count badge', async ({ authPage: page }) => {
    const advancedButton = page.getByRole('button', { name: /Advanced Filters/i });

    await expect(advancedButton.locator('span.rounded-full')).not.toBeVisible();

    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('Boston');
    await waitForFiltersToApply(page);
    await expect(advancedButton.locator('span.rounded-full')).toContainText('1');

    await page.getByRole('button', { name: 'Full-time' }).click();
    await page.getByRole('button', { name: 'High' }).click();
    await waitForFiltersToApply(page);
    await expect(advancedButton.locator('span.rounded-full')).toContainText('3');

    await page.getByRole('button', { name: /Clear Advanced Filters/i }).click();
    await waitForFiltersToApply(page);
    await expect(advancedButton.locator('span.rounded-full')).not.toBeVisible();
  });

  test('disables save-filters button when there are no active filters', async ({ authPage: page }) => {
    await expect(page.getByRole('button', { name: /Save Filters/i })).toBeDisabled();
  });

  test('creates and applies tag filter', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByRole('button', { name: /^Tags/ }).click();

    const popover = page.locator('[data-radix-popper-content-wrapper]').last();
    const emptyState = popover.getByText('No tags yet. Create your first tag!');

    if (await emptyState.isVisible()) {
      const newTagName = uniqueName('E2E-Tag');
      await popover.getByRole('button', { name: /Create New Tag/i }).click();
      await popover.getByPlaceholder('Tag name').fill(newTagName);
      await popover.locator('button[aria-label^="Select #"]').first().click();
      await popover.getByRole('button', { name: 'Create' }).click();
      await expect(popover.getByText(newTagName)).toBeVisible();
    }

    await popover.locator('input[type="checkbox"]').first().check();
    await page.keyboard.press('Escape');
    await waitForFiltersToApply(page);

    await expect(page).toHaveURL(/tags=/);
  });

  test('saves and loads a filter preset', async ({ authPage: page }) => {
    const presetName = uniqueName('Preset');

    await page.getByPlaceholder('Search by company or position...').fill('Tech');
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('Seattle');
    await page.getByRole('button', { name: 'Remote' }).click();
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /Save Filters/i }).click();
    await page
      .getByPlaceholder('Preset name (e.g., Remote Tech Jobs)')
      .fill(presetName);
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /Clear all filters/i }).click();
    await waitForFiltersToApply(page);
    await expect(page).not.toHaveURL(/search=/);

    await page.getByRole('button', { name: /^Presets/ }).click();
    await page.getByRole('button', { name: presetName }).click();
    await waitForFiltersToApply(page);

    await expect(page).toHaveURL(/search=Tech/);
    await expect(page).toHaveURL(/location=Seattle/);
    await expect(page).toHaveURL(/jobType=remote/);
  });

  test('renames an existing filter preset', async ({ authPage: page }) => {
    const originalName = uniqueName('RenameFrom');
    const updatedName = `${originalName}-Updated`;

    await page.getByPlaceholder('Search by company or position...').fill('NLP');
    await waitForFiltersToApply(page);
    await page.getByRole('button', { name: /Save Filters/i }).click();
    await page
      .getByPlaceholder('Preset name (e.g., Remote Tech Jobs)')
      .fill(originalName);
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /^Presets/ }).click();
    const row = page
      .locator('div.flex.items-center.gap-2.rounded-lg.border')
      .filter({ hasText: originalName })
      .first();

    await row.locator('button').nth(1).click(); // edit icon button
    const editInput = row.locator('input');
    await editInput.fill(updatedName);
    await row.locator('button').first().click(); // confirm icon button

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Presets/ }).click();
    await expect(page.getByRole('button', { name: updatedName })).toBeVisible();
  });

  test('deletes a saved preset', async ({ authPage: page }) => {
    const presetName = uniqueName('DeleteMe');

    await page.getByPlaceholder('Search by company or position...').fill('Data');
    await waitForFiltersToApply(page);
    await page.getByRole('button', { name: /Save Filters/i }).click();
    await page
      .getByPlaceholder('Preset name (e.g., Remote Tech Jobs)')
      .fill(presetName);
    await page.getByRole('button', { name: 'Save' }).click();
    await waitForFiltersToApply(page);

    await page.getByRole('button', { name: /^Presets/ }).click();
    const row = page
      .locator('div.flex.items-center.gap-2.rounded-lg.border')
      .filter({ hasText: presetName })
      .first();

    await row.locator('button').nth(2).click(); // delete icon button
    await expect(page.getByRole('button', { name: presetName })).not.toBeVisible();
  });

  test('persists filters in URL after reload', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('New York');
    await page.getByRole('button', { name: 'Full-time' }).click();
    await page.getByPlaceholder('e.g., 80000').fill('120000');
    await waitForFiltersToApply(page);

    const urlBeforeReload = page.url();
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(urlBeforeReload);

    await ensureAdvancedFiltersExpanded(page);
    await expect(page.getByPlaceholder('e.g., San Francisco')).toHaveValue('New York');
    await expect(page.getByPlaceholder('e.g., 80000')).toHaveValue('120000');
  });

  test('supports back and forward navigation for filter state', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    const locationInput = page.getByPlaceholder('e.g., San Francisco');

    await locationInput.fill('Chicago');
    await waitForFiltersToApply(page);
    const firstUrl = page.url();

    await locationInput.fill('Denver');
    await waitForFiltersToApply(page);
    const secondUrl = page.url();

    expect(secondUrl).not.toBe(firstUrl);

    await page.goBack();
    await expect(page).toHaveURL(firstUrl);

    await page.goForward();
    await expect(page).toHaveURL(secondUrl);
  });

  test('shows empty state for impossible filter combinations', async ({ authPage: page }) => {
    await ensureAdvancedFiltersExpanded(page);
    await page.getByPlaceholder('e.g., San Francisco').fill('NonexistentCity12345');
    await page.getByPlaceholder('e.g., 80000').fill('999999999');
    await waitForFiltersToApply(page);

    await expect(
      page.getByText('No applications found matching your filters.')
    ).toBeVisible();
  });

  test('stacks filters properly on a mobile viewport', async ({ authPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await waitForResultsOrEmptyState(page);

    await ensureAdvancedFiltersExpanded(page);
    const locationInput = page.getByPlaceholder('e.g., San Francisco');
    const minSalaryInput = page.getByPlaceholder('e.g., 80000');
    const fullTimeButton = page.getByRole('button', { name: 'Full-time' });

    await expect(locationInput).toBeVisible();
    await expect(minSalaryInput).toBeVisible();
    await expect(fullTimeButton).toBeVisible();

    const box = await fullTimeButton.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);
  });
});

test.describe('Filter Performance', () => {

  test('completes a filter update in acceptable time', async ({ authPage: page }) => {
    await page.goto('/dashboard');
    await ensureAdvancedFiltersExpanded(page);

    const start = Date.now();
    await page.getByPlaceholder('e.g., San Francisco').fill('Remote');
    await waitForResultsOrEmptyState(page);
    const duration = Date.now() - start;

    // Debounce is 500ms in UI; keep threshold tolerant for CI noise.
    expect(duration).toBeLessThan(2500);
  });
});
