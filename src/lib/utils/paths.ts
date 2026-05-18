/**
 * Centralised path helpers for Habla Anomia.
 *
 * Every URL that points to an asset (image, manifest, icon, etc.) or an
 * internal route MUST go through these helpers so that the GitHub Pages
 * subdirectory deployment (BASE_PATH=/habla-anomia) works everywhere.
 *
 * SvelteKit's `$app/paths.base` is '' locally and '/habla-anomia' in prod.
 */

import { base } from '$app/paths';

/** Prepend the deployment base to any absolute path. */
export function resolveUrl(path: string): string {
  if (!path) return '';
  if (base && path.startsWith('/')) return base + path;
  return path;
}

/** Shorthand specifically for word images — most common call site. */
export function resolveImageUrl(url: string): string {
  return resolveUrl(url);
}

/** PWA manifest path. */
export function manifestUrl(): string {
  return resolveUrl('/manifest.json');
}

/** Icon paths. */
export function iconUrl(name: string): string {
  return resolveUrl(`/icons/${name}`);
}
