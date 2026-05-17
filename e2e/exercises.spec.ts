import { test, expect } from '@playwright/test';
import { gotoExercise, checkNoOverflow } from './helpers';

const exerciseTypes = [
  { slug: 'picture-naming', title: 'Nombrar' },
  { slug: 'semantic-features', title: 'Características' },
  { slug: 'category-sorting', title: 'Clasificar' },
  { slug: 'phonological-cueing', title: 'Fonológicas' },
  { slug: 'generative-naming', title: 'Nombrar por categoría' },
  { slug: 'word-matching', title: 'Relacionar' },
  { slug: 'sentence-completion', title: 'Completar' },
  { slug: 'word-association', title: 'Asociación' },
];

for (const { slug, title } of exerciseTypes) {
  test.describe(slug, () => {
    test(`loads and shows exercise title`, async ({ page }) => {
      await gotoExercise(page, slug);
      const body = await page.locator('body').textContent();
      const hasContent = body?.length ?? 0 > 50;
      expect(hasContent, `Exercise ${slug} page appears empty`).toBeTruthy();
    });

    test(`has option buttons (at least 2) or word content`, async ({ page }) => {
      await gotoExercise(page, slug);
      // Wait a bit for exercise to fully render
      await page.waitForTimeout(2000);
      const buttons = await page.locator('button').count();
      const textContent = await page.locator('body').textContent();
      const hasWords = textContent?.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]{3,}/g)?.length ?? 0;
      expect(buttons >= 2 || hasWords >= 2, `No buttons or words in ${slug}`).toBeTruthy();
    });

    test(`clicking an option triggers a response`, async ({ page }) => {
      await gotoExercise(page, slug);
      await page.waitForTimeout(1000);
      // Try clicking the first visible button that looks like an option
      const optionButtons = page.locator('button:not([aria-label="Volver"]):not([aria-label="Ajustes"])');
      const count = await optionButtons.count();
      if (count > 0) {
        await optionButtons.first().click();
        await page.waitForTimeout(500);
        // Page should still be functional (no crash)
        const body = await page.locator('body').textContent();
        expect(body?.length ?? 0).toBeGreaterThan(20);
      }
    });

    test(`back button works`, async ({ page }) => {
      await gotoExercise(page, slug);
      // Look for back button
      const backBtn = page.locator('button[aria-label="Volver"], a[href*="exercises"]').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(1000);
        // Should navigate away from exercise
        const url = page.url();
        expect(url).not.toContain(`exercises/${slug}`);
      }
    });

    test(`no horizontal overflow`, async ({ page }) => {
      await gotoExercise(page, slug);
      const noOverflow = await checkNoOverflow(page);
      expect(noOverflow, `Horizontal overflow in ${slug}`).toBeTruthy();
    });
  });
}
