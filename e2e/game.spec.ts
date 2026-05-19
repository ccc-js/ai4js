import { test, expect } from '@playwright/test';

test('FrozenLake loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/frozen_lake.html');
  await page.waitForTimeout(1000);

  const title = await page.locator('h1').textContent();
  expect(title).toContain('FrozenLake');

  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();

  const criticalErrors = errors.filter(e => !e.includes('warning') && !e.includes('Warning'));
  expect(criticalErrors).toHaveLength(0);
});

test('CartPole loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/cartpole.html');
  await page.waitForTimeout(1000);

  const title = await page.locator('h1').textContent();
  expect(title).toContain('CartPole');

  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();

  const criticalErrors = errors.filter(e => !e.includes('warning') && !e.includes('Warning'));
  expect(criticalErrors).toHaveLength(0);
});

test('FrozenLake step button works', async ({ page }) => {
  await page.goto('/frozen_lake.html');
  await page.waitForTimeout(500);

  const stepBtn = page.locator('#stepBtn');
  await stepBtn.click();
  await page.waitForTimeout(200);

  const stepCount = await page.locator('#stepCount').textContent();
  expect(parseInt(stepCount || '0')).toBeGreaterThan(0);
});

test('CartPole auto mode works', async ({ page }) => {
  await page.goto('/cartpole.html');
  await page.waitForTimeout(500);

  const autoBtn = page.locator('#autoBtn');
  await autoBtn.click();
  await page.waitForTimeout(1000);

  const stepCount = await page.locator('#stepCount').textContent();
  expect(parseInt(stepCount || '0')).toBeGreaterThan(5);
});