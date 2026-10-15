import { test, expect } from '@playwright/test';

test('landing page presents the evidence-led product proposition', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /PageFix/ }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /find what's breaking the customer journey/i })).toBeVisible();
  await expect(page.getByText(/No fabricated analytics or guaranteed conversion lifts/i)).toBeVisible();
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
  await expect(page.getByRole('heading', { name: /pay for useful evidence/i })).toBeVisible();
  await expect(page.getByText('Founding Lifetime')).toHaveCount(0);
  await expect(page.getByText('$19')).toBeVisible();
  await expect(page.getByText('$49')).toBeVisible();
  await expect(page.getByText('$99')).toBeVisible();
});
