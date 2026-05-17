import { test, expect } from '@playwright/test';
import { gotoWithHydration, waitForDBSeed, checkNoOverflow } from './helpers';

const viewports = [
  { name: 'iPhone-SE', width: 320, height: 568 },
  { name: 'iPhone-standard', width: 375, height: 812 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad-landscape', width: 1024, height: 768 },
];

const pages = [
  { name: 'dashboard', path: '/' },
  { name: 'exercises', path: '/exercises' },
  { name: 'settings', path: '/settings' },
  { name: 'progress', path: '/progress' },
  { name: 'about', path: '/about' },
];

for (const viewport of viewports) {
  test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const pageInfo of pages) {
      test(`${pageInfo.name}: no horizontal overflow`, async ({ page }) => {
        await gotoWithHydration(page);
        await waitForDBSeed(page);
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const ok = await checkNoOverflow(page);
        expect(ok, `${pageInfo.name} overflows at ${viewport.width}px`).toBeTruthy();
      });
    }

    test('dashboard: buttons are at least 44px tall', async ({ page }) => {
      await gotoWithHydration(page);
      await waitForDBSeed(page);

      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      let tooSmall = 0;
      for (let i = 0; i < Math.min(count, 20); i++) {
        const box = await buttons.nth(i).boundingBox();
        if (box && box.height < 44) tooSmall++;
      }
      // Allow small icon buttons but flag if too many are undersized
      expect(tooSmall, `${tooSmall} buttons under 44px at ${viewport.width}`).toBeLessThan(5);
    });

    test('bottom nav is visible', async ({ page }) => {
      await gotoWithHydration(page);
      await waitForDBSeed(page);
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });
}
