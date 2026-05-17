/**
 * Shared test helpers for Habla Anomia E2E tests.
 */
import { expect, type Page } from '@playwright/test';

/**
 * Navigate to a page and wait for the app to hydrate.
 */
export async function gotoWithHydration(page: Page, path: string = '/') {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

/**
 * Wait for IndexedDB to finish seeding words. Polls up to 15s.
 * Returns the word count in the DB.
 */
export async function waitForDBSeed(page: Page, expectedMin: number = 100): Promise<number> {
  return await page.waitForFunction(
    async (min) => {
      for (let i = 0; i < 30; i++) {
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
      }
      return 0;
    },
    expectedMin,
    { timeout: 20000 }
  ).then(r => r as unknown as number);
}

/**
 * Check that the page has no horizontal overflow (mobile-friendly).
 */
export async function checkNoOverflow(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
}

/**
 * Navigate to an exercise page and wait for it to fully load (past loading state).
 */
export async function gotoExercise(page: Page, type: string): Promise<void> {
  await gotoWithHydration(page);
  await waitForDBSeed(page);
  await page.goto(`/exercises/${type}`, { waitUntil: 'networkidle' });
  // Wait for loading spinner to disappear (exercise content loaded)
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.loading-spinner');
    const error = document.querySelector('.error-message');
    const content = document.querySelector('.exercise-content');
    // Either exercise content is shown, or error (no spinner)
    return content !== null || error !== null;
  }, { timeout: 15000 });
  await page.waitForTimeout(500);
}

/**
 * Get the current viewport size.
 */
export function getViewport(project: { use: { viewport?: { width: number; height: number } } }): { width: number; height: number } {
  return project.use.viewport || { width: 375, height: 812 };
}
