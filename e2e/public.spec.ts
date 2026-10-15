import { test, expect } from '@playwright/test';

test('landing page presents the evidence-led product proposition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /PageFix/ }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /finds what’s blocking a clearer customer decision/i })).toBeVisible();
  await expect(page.getByText(/No fabricated analytics, reviews, conversion lifts or customer behaviour/i)).toBeVisible();
});

test('auth page renders signup form', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /start finding/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('sign-in navigation opens the login state', async ({ page }) => {
  await page.goto('/auth?mode=login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('pricing lists subscriptions without lifetime access', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /choose the depth of work/i })).toBeVisible();
  await expect(page.getByText('Founding Lifetime')).toHaveCount(0);
  await expect(page.locator('.pricing-card h2').nth(0)).toContainText('$49');
  await expect(page.locator('.pricing-card h2').nth(1)).toContainText('$149');
  await expect(page.locator('.pricing-card h2').nth(2)).toContainText('$399');
  await expect(page.getByRole('heading', { name: /custom \/ enterprise/i })).toBeVisible();
});
\n\ntest('privacy and security pages are linked and readable', async ({ page }) => {\n  await page.goto('/');\n  await expect(page.getByRole('link', { name: /privacy/i }).first()).toBeVisible();\n  await page.goto('/privacy');\n  await expect(page.getByRole('heading', { name: /privacy, with clear limits/i })).toBeVisible();\n  await page.goto('/security');\n  await expect(page.getByRole('heading', { name: /security is a product requirement/i })).toBeVisible();\n});\n