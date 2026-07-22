import type { AppSettings } from '$lib/types';

/**
 * CSS classes that set `--font-scale` on the element they're applied to.
 * Kept as a list so we can strip them all before applying the active one.
 */
const TEXT_SIZE_CLASSES = ['text-small', 'text-medium', 'text-large', 'text-extra-large'] as const;

/**
 * Sync `<meta name="theme-color">` with the active theme's `--primary`.
 *
 * Reads the *live* computed value from `el` — whose `light-theme` /
 * `high-contrast` classes the caller has just toggled, so the cascade already
 * reflects the new theme. This keeps `theme.css` as the single source of truth
 * for the brand colour: no second hardcoded copy that can drift when someone
 * edits `--primary`. No-ops outside the browser or when the tag/variable is
 * unavailable.
 */
function applyThemeColor(el: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const color = getComputedStyle(el).getPropertyValue('--primary').trim();
  if (!color) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

/**
 * Map a `text_size` setting value to its CSS class.
 * `normal` (and any unexpected value) falls back to the medium/base scale.
 */
function getFontScaleClass(textSize: AppSettings['text_size']): string {
  switch (textSize) {
    case 'small':
      return 'text-small';
    case 'large':
      return 'text-large';
    case 'xlarge':
      return 'text-extra-large';
    case 'normal':
    default:
      return 'text-medium';
  }
}

/**
 * Apply theme, text-size, and high-contrast classes to `document.documentElement`.
 *
 * The classes MUST live on `<html>` (not a descendant): `--font-scale` is
 * consumed by the `html` selector in `app.css`
 * (`font-size: calc(var(--font-size-base) * var(--font-scale))`), and CSS
 * custom properties only cascade *downward* — setting `--font-scale` on a
 * child never reaches the `html` rule, leaving the text-size setting inert.
 *
 * No-ops outside the browser (SSR / prerender guards).
 */
export function applyAppearance(
  settings: Pick<AppSettings, 'theme' | 'text_size' | 'high_contrast'>
): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;

  el.classList.toggle('light-theme', settings.theme === 'light');

  el.classList.remove(...TEXT_SIZE_CLASSES);
  el.classList.add(getFontScaleClass(settings.text_size));

  el.classList.toggle('high-contrast', settings.high_contrast);

  applyThemeColor(el);
}
