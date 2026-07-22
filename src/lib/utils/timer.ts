/**
 * A single cancellable timeout used to schedule an exercise's feedback→advance
 * step. Storing the id lets a word change or an early advance cancel a queued
 * callback, so pressing Enter / Escape during the feedback window can never
 * fire `nextWord` twice (which would silently drop a word).
 *
 * One per exercise instance.
 */
export function createCancellableTimer() {
  let id: ReturnType<typeof setTimeout> | null = null;

  function clear(): void {
    if (id !== null) {
      clearTimeout(id);
      id = null;
    }
  }

  function schedule(fn: () => void, ms: number): void {
    clear();
    id = setTimeout(() => {
      id = null;
      fn();
    }, ms);
  }

  return { schedule, clear };
}

export type CancellableTimer = ReturnType<typeof createCancellableTimer>;
