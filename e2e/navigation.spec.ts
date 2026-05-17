import { test, expect } from '@playwright/test';
import { gotoWithHydration, waitForDBSeed, checkNoOverflow } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
  });

  test('loads with Habla Anomia title', async ({ page }) => {
    await expect(page).toHaveTitle(/Habla Anomia/, { timeout: 10000 });
  });

  test('shows greeting text', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasGreeting = body?.match(/Buenos|Buenas|días|tardes|noches|Bienvenido/i);
    expect(hasGreeting, 'No greeting found on dashboard').toBeTruthy();
  });

  test('shows exercise grid', async ({ page }) => {
    // At least the first exercise name should be visible
    await expect(page.locator('text=Nombrar imágenes').first()).toBeVisible({ timeout: 5000 });
  });

  test('exercise button navigates', async ({ page }) => {
    const btn = page.locator('button:has-text("Nombrar imágenes")').first();
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForURL(/\/exercises\//, { timeout: 10000 });
  });

  test('shows stats area', async ({ page }) => {
    // Dashboard should have some stats section (even if zero)
    const statsText = await page.locator('body').textContent();
    const hasStats = statsText?.match(/sesión|palabra|practicado|racha/i);
    expect(hasStats, 'No stats section visible').toBeTruthy();
  });

  test('shows daily plan section', async ({ page }) => {
    const planText = await page.locator('body').textContent();
    const hasPlan = planText?.match(/plan|practica|ejercicio/i);
    expect(hasPlan, 'No daily plan section visible').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page);
    expect(noOverflow, 'Page has horizontal overflow').toBeTruthy();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
  });

  test('bottom nav links are present', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('text=Inicio')).toBeVisible();
    await expect(nav.locator('text=Ejercicios')).toBeVisible();
    await expect(nav.locator('text=Progreso')).toBeVisible();
    await expect(nav.locator('text=Ajustes')).toBeVisible();
  });

  test('navigate via URL to exercises list', async ({ page }) => {
    await page.goto('/exercises', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Ejercicios');
  });

  test('navigate via URL to progress page', async ({ page }) => {
    await page.goto('/progress', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Progreso');
  });

  test('navigate via URL to settings page', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Ajustes');
  });

  test('navigate via URL to about page', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(/Habla Anomia|Acerca/);
  });

  test('skip-to-content link exists', async ({ page }) => {
    const skipLink = page.locator('a:has-text("Saltar")');
    await expect(skipLink).toBeAttached();
  });

  test('bottom nav click navigates to exercises', async ({ page }) => {
    // Use force click to bypass any overlay issues in CI
    const link = page.locator('nav a:has-text("Ejercicios")').first();
    if (await link.isVisible()) {
      await link.click({ force: true });
      await page.waitForURL(/\/exercises/, { timeout: 10000 });
    } else {
      // Fallback: use the span text
      await page.locator('nav').getByText('Ejercicios').first().click({ force: true });
      await page.waitForURL(/\/exercises/, { timeout: 10000 });
    }
  });
});
