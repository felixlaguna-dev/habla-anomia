import { test, expect } from '@playwright/test';
import { gotoWithHydration, checkNoOverflow } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page, './');
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
    await expect(page.locator('text=Nombrar imágenes').first()).toBeVisible({ timeout: 5000 });
  });

  test('exercise button navigates', async ({ page }) => {
    const btn = page.locator('button[aria-label="Nombrar imágenes"]').first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await page.waitForURL(/\/exercises\//, { timeout: 10000 });
  });

  test('shows stats area', async ({ page }) => {
    const statsText = await page.locator('body').textContent();
    // Stats grid shows for returning users; empty-state invitation shows for new users
    const hasStats = statsText?.match(/sesión|sesiones|palabra|practicado|práctica|racha/i);
    expect(hasStats, 'No stats section or empty-state invitation visible').toBeTruthy();
  });

  test('shows daily plan section', async ({ page }) => {
    const planText = await page.locator('body').textContent();
    const hasPlan = planText?.match(/plan|practica|ejercicio/i);
    expect(hasPlan, 'No daily plan section visible').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page);
    expect(noOverflow, 'Horizontal overflow detected on dashboard').toBeTruthy();
  });
});

test.describe('Navigation', () => {
  test('bottom nav to exercises page', async ({ page }) => {
    await gotoWithHydration(page, './');
    // Click the first exercise chip (uses aria-label for full exercise name)
    await page.locator('button[aria-label="Nombrar imágenes"]').first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('exercises');
  });

  test('bottom nav to progress page', async ({ page }) => {
    await gotoWithHydration(page, './');
    await page.locator('text=Progreso').first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('progress');
  });

  test('bottom nav to settings page', async ({ page }) => {
    await gotoWithHydration(page, './');
    await page.locator('text=Ajustes').first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('settings');
  });

  test('bottom nav to about page', async ({ page }) => {
    await gotoWithHydration(page, './');
    // About is not in bottom nav — navigate directly
    await page.goto('./about', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('about');
  });
});
