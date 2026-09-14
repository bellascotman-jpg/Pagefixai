import { test, expect } from '@playwright/test';

test('landing page exposes core product proposition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('PageFix AI')).toBeVisible();
  await expect(page.getByText("Find what's getting in the way of the sale.")).toBeVisible();
});

test('auth page renders signup form', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /start finding/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});
