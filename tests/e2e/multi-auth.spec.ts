import { test, expect } from '@playwright/test';

/**
 * E2E tests for multi-provider auth system.
 * Skipped until E2E auth is configured with test accounts.
 */

test.describe('Auth - Login Page', () => {
  test.skip('should display login and register tabs', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
  });

  test.skip('should show email/password form in login tab', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test.skip('should show register form with password strength meter', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: false })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test.skip('should show OAuth buttons (Google, GitHub, LinkedIn)', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /LinkedIn/i })).toBeVisible();
  });

  test.skip('should validate login form - required fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test.skip('should validate register form - password rules', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel('Confirm Password').fill('weak');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test.skip('should show password strength indicator', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await page.getByLabel('Password', { exact: true }).fill('Ab');
    await expect(page.getByText('Weak')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('Abcdefg1');
    await expect(page.getByText('Strong')).toBeVisible();
  });
});

test.describe('Auth - Forgot Password', () => {
  test.skip('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByText('Forgot password?').click();
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.getByText('Reset Password')).toBeVisible();
  });

  test.skip('should show forgot password form', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
  });

  test.skip('should navigate back to login from forgot password', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.getByText('Back to sign in').click();
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('Auth - Reset Password', () => {
  test.skip('should show reset password form', async ({ page }) => {
    await page.goto('/auth/reset-password');
    await expect(page.getByText('Set New Password')).toBeVisible();
    await expect(page.getByLabel('New Password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
  });
});

test.describe('Auth - Onboarding', () => {
  test.skip('should show onboarding page content', async ({ page }) => {
    await page.goto('/auth/onboarding');
    await expect(page.getByText(/Welcome/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Resume/ })).toBeVisible();
  });
});

test.describe('Auth - Error Page', () => {
  test.skip('should show auth error page content', async ({ page }) => {
    await page.goto('/auth/auth-code-error');
    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});
