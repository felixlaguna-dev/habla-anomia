/**
 * Shared test helpers for Habla Anomia E2E tests.
 */
import { expect, type Page } from '@playwright/test';

/**
 * Navigate to a page and wait for the app to hydrate.
 * Uses './' relative paths so baseURL sub-path works on GitHub Pages.
 */
export async function gotoWithHydration(page: Page, path: string = './') {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
}

/**
 * Wait for IndexedDB to finish seeding words. Tries up to 20s.
 * Returns the word count, or 0 if it fails.
 */
export async function waitForDBSeed(page: Page, expectedMin: number = 100): Promise<number> {
  try {
    const count = await page.evaluate(async (min) => {
      for (let i = 0; i < 40; i++) {
        try {
          const count = await new Promise<number>((resolve) => {
            const req = indexedDB.open('habla-anomia');
            req.onsuccess = (e: any) => {
              try {
                const db = e.target.result;
                const tx = db.transaction('words', 'readonly');
                const store = tx.objectStore('words');
                const countReq = store.count();
                countReq.onsuccess = () => resolve(countReq.result);
                countReq.onerror = () => resolve(0);
              } catch {
                resolve(0);
              }
            };
            req.onerror = () => resolve(0);
          });
          if (count >= min) return count;
          await new Promise(r => setTimeout(r, 500));
        } catch {
          break;
        }
      }
      return 0;
    }, expectedMin);
    return count;
  } catch {
    await page.waitForTimeout(3000);
    return 0;
  }
}

/**
 * Check that the page has no horizontal overflow.
 */
export async function checkNoOverflow(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
}

/**
 * Navigate to an exercise page and wait for it to fully load.
 */
export async function gotoExercise(page: Page, type: string): Promise<void> {
  // Go home first to seed DB
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await waitForDBSeed(page);
  // Navigate to exercise using relative path
  await page.goto(`./exercises/${type}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  // Wait for exercise content
  try {
    await page.locator('.exercise-title, .exercise-content, .error-message, h1').first()
      .waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    const bodyText = await page.locator('body').textContent();
    if (!bodyText || bodyText.trim().length < 10) {
      throw new Error(`Exercise page ./exercises/${type} appears blank after load`);
    }
  }
}
