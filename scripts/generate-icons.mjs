#!/usr/bin/env node
/**
 * Generate the PWA icon set from a single canonical source SVG.
 *
 * Source : static/favicon.svg  (speech-bubble + "H", full-bleed brand bg)
 * Outputs (written to static/icons/):
 *   - icon-192.png           192×192   purpose "any"
 *   - icon-512.png           512×512   purpose "any"
 *   - icon-maskable-512.png  512×512   purpose "maskable"
 *
 * Maskable safe zone: Android adaptive icons crop the outer 10% on every side,
 * so visible content must sit within the inner 80%. The source SVG already
 * carries a full-bleed `--primary` background, so scaling it to 80% and
 * compositing it centred on the SAME background yields a maskable icon whose
 * glyph stays inside the safe zone while the background fills the whole canvas
 * (no transparent edges to show as a letterboxed square).
 *
 * Usage:   node scripts/generate-icons.mjs
 * npm:     npm run generate:icons
 *
 * Regenerate after editing static/favicon.svg, then bump the icons cache-bust
 * query in src/routes/+layout.svelte if the manifest link is fingerprinted.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'static', 'favicon.svg');
const OUT_DIR = join(ROOT, 'static', 'icons');

// Must match --primary in src/lib/styles/theme.css (the app default theme).
const PRIMARY = '#3b82f6';
// Maskable content is scaled to this fraction and centred → inner 80% safe zone.
const SAFE_ZONE_SCALE = 0.8;
// Rasterise the SVG at high DPI so curves stay crisp when downscaled to PNG.
const SVG_DENSITY = 512;
const KB = 1024;

/**
 * Render the source SVG to a square PNG of `size` px.
 * fit:'contain' preserves the square viewBox exactly (the SVG has no
 * transparency, so the background fills the whole tile).
 */
async function renderPng(svgBuffer, size) {
  return sharp(svgBuffer, { density: SVG_DENSITY })
    .resize(size, size, { fit: 'contain' })
    .png()
    .toBuffer();
}

/**
 * Render the maskable variant: artwork scaled to SAFE_ZONE_SCALE on a
 * full-bleed PRIMARY canvas, centred.
 */
async function renderMaskable(svgBuffer, size) {
  const artworkSize = Math.round(size * SAFE_ZONE_SCALE);
  const artwork = await renderPng(svgBuffer, artworkSize);
  return sharp({
    create: { width: size, height: size, channels: 4, background: PRIMARY }
  })
    .composite([{ input: artwork, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  const svg = await readFile(SOURCE);

  // The three rasters are independent — render them concurrently so the run
  // takes as long as the slowest single render, not their sum.
  const [b192, b512, bMask] = await Promise.all([
    renderPng(svg, 192),
    renderPng(svg, 512),
    renderMaskable(svg, 512)
  ]);
  const outputs = [
    { name: 'icon-192.png', size: 192, buf: b192 },
    { name: 'icon-512.png', size: 512, buf: b512 },
    { name: 'icon-maskable-512.png', size: 512, buf: bMask }
  ];

  console.log(`Source : ${SOURCE}`);
  console.log(`Output : ${OUT_DIR}`);
  console.log('─'.repeat(52));
  for (const o of outputs) {
    await writeFile(join(OUT_DIR, o.name), o.buf);
    console.log(`  ${o.name.padEnd(24)} ${String(o.size).padStart(3)}×${o.size}  ${(o.buf.length / KB).toFixed(1)} KB`);
  }
  console.log('─'.repeat(52));
  console.log(`Done. ${outputs.length} icons written.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
