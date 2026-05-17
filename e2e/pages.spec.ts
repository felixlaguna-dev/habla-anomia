import { test, expect } from '@playwright/test';
import { gotoWithHydration, waitForDBSeed, checkNoOverflow } from './helpers';

test.describe('Exercises List Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page, './exercises');
  });

  test('lists all 8 exercises', async ({ page }) => {
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
      await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('exercise cards are clickable', async ({ page }) => {
    const firstCard = page.locator('a[href*="picture-naming"], button:has-text("Nombrar")').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('picture-naming');
    }
  });
});

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page, './settings');
  });

  test('loads settings page', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasSettings = body?.match(/ajustes|configur|idioma|dificultad|volumen/i);
    expect(hasSettings, 'Settings content not found').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page);
    expect(noOverflow, 'Horizontal overflow on settings page').toBeTruthy();
  });
});

test.describe('Progress Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page, './progress');
  });

  test('shows stats area', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasStats = body?.match(/Precisión|Palabras|Aún no hay datos|dominadas|progreso/i);
    expect(hasStats, 'Progress page has no stats').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page);
    expect(noOverflow, 'Horizontal overflow on progress page').toBeTruthy();
  });
});

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithHydration(page, './about');
  });

  test('shows about content', async ({ page }) => {
    const body = await page.locator('body').textContent();
    const hasAbout = body?.match(/Habla Anomia|afasia|anomia|rehabilit/i);
    expect(hasAbout, 'About content not found').toBeTruthy();
  });

  test('no horizontal overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page);
    expect(noOverflow, 'Horizontal overflow on about page').toBeTruthy();
  });
});
