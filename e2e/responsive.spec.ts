import { test, expect } from '@playwright/test';
import { gotoWithHydration, checkNoOverflow } from './helpers';

const viewports = [
  { name: 'iPhone-SE', width: 320, height: 568 },
  { name: 'iPhone-14', width: 390, height: 844 },
  { name: 'iPad-Mini', width: 768, height: 1024 },
  { name: 'small-phone', width: 280, height: 653 },
];

for (const vp of viewports) {
  test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('dashboard renders without overflow', async ({ page }) => {
      await gotoWithHydration(page, './');
      const noOverflow = await checkNoOverflow(page);
      expect(noOverflow, `Overflow on ${vp.name}`).toBeTruthy();
    });

    test('exercises page renders', async ({ page }) => {
      await gotoWithHydration(page, './exercises');
      const body = await page.locator('body').textContent();
      expect(body?.length ?? 0).toBeGreaterThan(20);
    });
  });
}
