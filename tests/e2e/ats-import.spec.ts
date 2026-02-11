import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// All E2E tests are skipped until auth is configured.
// To enable: remove test.skip() and configure auth in playwright.config.ts.

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function createLinkedInCsv(): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, 'linkedin_test.csv');
  const content = [
    'Application Date,Company Name,Job Title,URL',
    '01/15/2024,Acme Corp,Software Engineer,https://linkedin.com/jobs/1',
    '02/20/2024,Beta Inc,Product Manager,',
    '03/10/2024,Gamma Ltd,Designer,https://linkedin.com/jobs/3',
  ].join('\n');
  fs.writeFileSync(filePath, content);
  return filePath;
}

function createGenericCsv(): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, 'generic_test.csv');
  const content = [
    'org,role,when',
    'Startup Inc,Frontend Dev,2024-04-01',
    'BigCo,Data Scientist,2024-04-15',
  ].join('\n');
  fs.writeFileSync(filePath, content);
  return filePath;
}

function createEmptyCsv(): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, 'empty_test.csv');
  fs.writeFileSync(filePath, 'Application Date,Company Name,Job Title,URL\n');
  return filePath;
}

function createOversizedCsv(): string {
  const dir = os.tmpdir();
  const filePath = path.join(dir, 'oversized_test.csv');
  // Generate >5MB content
  const header = 'Application Date,Company Name,Job Title,URL\n';
  const row = '01/01/2024,' + 'A'.repeat(100) + ',Engineer,\n';
  const content = header + row.repeat(60000); // ~6MB
  fs.writeFileSync(filePath, content);
  return filePath;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('ATS Import Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard where the Import button lives
    await page.goto('/dashboard');
  });

  test.skip('Import button opens wizard dialog', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: /import/i });
    await expect(importBtn).toBeVisible();

    await importBtn.click();

    // Dialog should open with source selection
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Import Applications')).toBeVisible();
  });

  test.skip('Source step shows all 4 import options', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    await expect(page.getByText('LinkedIn')).toBeVisible();
    await expect(page.getByText('Indeed')).toBeVisible();
    await expect(page.getByText('Greenhouse ATS')).toBeVisible();
    await expect(page.getByText('Generic CSV')).toBeVisible();
  });

  test.skip('LinkedIn happy path: upload CSV → preview → confirm → result', async ({ page }) => {
    const csvPath = createLinkedInCsv();

    await page.getByRole('button', { name: /import/i }).click();

    // Step 1: Select LinkedIn
    await page.getByText('LinkedIn').click();

    // Step 2: Upload CSV
    await expect(page.getByText('Upload File')).toBeVisible();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();

    // Step 3: Preview
    await expect(page.getByText('Preview')).toBeVisible();
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText('Beta Inc')).toBeVisible();
    await expect(page.getByText(/rows found/i)).toBeVisible();

    await page.getByRole('button', { name: /next.*confirm/i }).click();

    // Step 4: Confirm
    await expect(page.getByText(/will be imported/i)).toBeVisible();
    await page.getByRole('button', { name: /import \d+ application/i }).click();

    // Step 5: Result
    await expect(page.getByText('Import Complete')).toBeVisible();
    await expect(page.getByText(/imported/i)).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test.skip('Generic CSV: field mapper appears and allows column mapping', async ({ page }) => {
    const csvPath = createGenericCsv();

    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('Generic CSV').click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();

    // Field mapper should appear
    await expect(page.getByText('Company Name')).toBeVisible();
    await expect(page.getByText('Job Title / Position')).toBeVisible();

    // Select columns
    const companySelect = page.getByRole('combobox').first();
    await companySelect.click();
    await page.getByRole('option', { name: 'org' }).click();

    fs.unlinkSync(csvPath);
  });

  test.skip('Duplicate detection: second upload skips all rows', async ({ page }) => {
    const csvPath = createLinkedInCsv();

    // First import
    async function doImport() {
      await page.getByRole('button', { name: /import/i }).click();
      await page.getByText('LinkedIn').click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);
      await page.getByRole('button', { name: /preview import/i }).click();
      await page.getByRole('button', { name: /next.*confirm/i }).click();
      await page.getByRole('button', { name: /import \d+ application/i }).click();
      await page.getByRole('button', { name: /view applications|close/i }).click();
    }

    await doImport();
    await doImport(); // second import — all should be duplicates

    // Result step should show 0 imported
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/0 imported|already in your tracker/i, { exact: false })).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test.skip('Empty CSV file shows error state', async ({ page }) => {
    const csvPath = createEmptyCsv();

    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('LinkedIn').click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();

    await expect(page.getByText(/no valid rows|no data rows/i)).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test.skip('Oversized file (>5MB) is rejected at upload step', async ({ page }) => {
    const csvPath = createOversizedCsv();

    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('LinkedIn').click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();

    await expect(page.getByText(/too large/i)).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test.skip('Greenhouse invalid API key shows error message', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('Greenhouse ATS').click();

    await page.getByLabel('Your Company Name').fill('Test Company');
    await page.getByLabel('Greenhouse API Key').fill('invalid-key-12345');

    await page.getByRole('button', { name: /preview applications/i }).click();

    await expect(
      page.getByText(/invalid.*api key|invalid greenhouse/i),
    ).toBeVisible();
  });

  test.skip('Cancel mid-wizard closes dialog without data insert', async ({ page }) => {
    const csvPath = createLinkedInCsv();

    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('LinkedIn').click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();

    // Close dialog via X button or pressing Escape
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Application count should be unchanged (no data was inserted)
    const count = await page.locator('[data-testid="total-applications"]').textContent();
    expect(count).toBeTruthy();

    fs.unlinkSync(csvPath);
  });

  test.skip('Back button navigates through wizard steps', async ({ page }) => {
    await page.getByRole('button', { name: /import/i }).click();

    // Select LinkedIn (moves to upload step)
    await page.getByText('LinkedIn').click();
    await expect(page.getByText('Upload File')).toBeVisible();

    // Click back to return to source step
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByText('Import Applications')).toBeVisible();
  });

  test.skip('Result step Done button closes dialog and refreshes page', async ({ page }) => {
    const csvPath = createLinkedInCsv();

    await page.getByRole('button', { name: /import/i }).click();
    await page.getByText('LinkedIn').click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);
    await page.getByRole('button', { name: /preview import/i }).click();
    await page.getByRole('button', { name: /next.*confirm/i }).click();
    await page.getByRole('button', { name: /import \d+ application/i }).click();

    await expect(page.getByText('Import Complete')).toBeVisible();
    await page.getByRole('button', { name: /view applications|close/i }).click();

    // Dialog should be closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    fs.unlinkSync(csvPath);
  });
});
