import { test, expect } from '@playwright/test';
import { gotoWithHydration, waitForDBSeed, checkNoOverflow } from './helpers';

test.describe('Exercises List Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
    await page.goto('/exercises', { waitUntil: 'networkidle' });
  });

  test('shows title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ejercicios');
  });

  test('shows all 8 exercises', async ({ page }) => {
    const names = [
      'Nombrar imágenes',
      'Características semánticas',
      'Clasificar por categorías',
      'Pistas fonológicas',
      'Nombrar por categoría',
      'Relacionar palabras',
      'Completar frases',
      'Opuestos y sinónimos',
    ];
    for (const name of names) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('each exercise card is clickable', async ({ page }) => {
    const firstCard = page.locator('button, a').filter({ hasText: 'Nombrar imágenes' }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await page.waitForURL(/\/exercises\//, { timeout: 10000 });
  });

  test('no horizontal overflow', async ({ page }) => {
    const ok = await checkNoOverflow(page);
    expect(ok, 'Exercises list has horizontal overflow').toBeTruthy();
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
    await page.goto('/settings', { waitUntil: 'networkidle' });
  });

  test('shows title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ajustes');
  });

  test('has language options', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasLang = body?.match(/español|English|idioma|lengua/i);
    expect(hasLang, 'No language options visible').toBeTruthy();
  });

  test('has text size options', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasSize = body?.match(/tamaño|fuente|letra|normal|grande/i);
    expect(hasSize, 'No text size options visible').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const ok = await checkNoOverflow(page);
    expect(ok, 'Settings page has horizontal overflow').toBeTruthy();
  });
});

test.describe('Progress Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
    await page.goto('/progress', { waitUntil: 'networkidle' });
  });

  test('shows title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Progreso');
  });

  test('shows stats area', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasStats = body?.match(/Precisión|Palabras|Aún no hay datos|dominadas|progreso/i);
    expect(hasStats, 'No stats content on progress page').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const ok = await checkNoOverflow(page);
    expect(ok, 'Progress page has horizontal overflow').toBeTruthy();
  });
});

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page);
    await waitForDBSeed(page);
    await page.goto('/about', { waitUntil: 'networkidle' });
  });

  test('loads with content', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('no horizontal overflow', async ({ page }) => {
    const ok = await checkNoOverflow(page);
    expect(ok, 'About page has horizontal overflow').toBeTruthy();
  });
});
