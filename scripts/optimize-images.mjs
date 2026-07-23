#!/usr/bin/env node
/**
 * Normalize word images for the web.
 *
 * For every .webp under static/images/words this:
 *   - resizes so the longest edge is <= 640 px (never upscales),
 *   - strips all metadata (EXIF, ICC, etc. — sharp strips by default),
 *   - re-encodes as webp at quality 80,
 *   - if the result is still > 150 KB, re-encodes from the ORIGINAL at quality 70,
 *   - overwrites the file IN PLACE, keeping the exact same filename (word data
 *     references filenames by name — they MUST NOT change).
 *
 * A file is left untouched when either: (a) it is already <= 640 px AND <= 50 KB
 * (idempotent on re-runs — protects already-optimal images from webp→webp
 * generation loss), or (b) encoding would make it larger than the original.
 * This never grows anything; every other file is normalized to <= 640 px /
 * q80 / stripped.
 *
 * Targets: average <= 50 KB, directory total <= ~30 MB.
 *
 * Usage:
 *   node scripts/optimize-images.mjs                 # optimize all (default)
 *   node scripts/optimize-images.mjs --dry-run       # report only, no writes
 *   node scripts/optimize-images.mjs --dir <path>    # custom directory
 *
 * npm script: `npm run optimize:images`
 * Makefile target: `make optimize-images`
 */
import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = join(__dirname, '..', 'static', 'images', 'words');

const MAX_EDGE = 640;
const QUALITY_PRIMARY = 80;
const QUALITY_FALLBACK = 70;
const REENCODE_THRESHOLD = 150 * 1024; // re-encode at q70 if still above this
// Ticket targets — reported as pass/fail so the run self-verifies.
const AVG_TARGET_KB = 50;
const TOTAL_TARGET_MB = 30;

// ---- Args ----
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirIdx = args.indexOf('--dir');
const DIR = dirIdx !== -1 && args[dirIdx + 1] ? args[dirIdx + 1] : DEFAULT_DIR;

const KB = 1024;
const MB = KB * KB;
const fmtKB = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
const fmtMB = (bytes) => `${(bytes / MB).toFixed(2)} MB`;

/**
 * Encode a buffer: resize (longest edge <= MAX_EDGE, no upscale) + webp.
 * fit:'inside' + withoutEnlargement does both. sharp strips metadata by
 * default since we never call .keepMetadata().
 */
function encode(buffer, quality) {
  return sharp(buffer)
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

async function main() {
  const entries = await readdir(DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.webp'))
    .map((e) => e.name)
    .sort();

  if (files.length === 0) {
    console.error(`No .webp files found in ${DIR}`);
    process.exit(1);
  }

  console.log(`Directory : ${DIR}`);
  console.log(`Files     : ${files.length}`);
  console.log(`Max edge  : ${MAX_EDGE}px  (no upscale)`);
  console.log(`Quality   : ${QUALITY_PRIMARY}${dryRun ? '  [DRY RUN — no writes]' : ''}`);
  console.log('─'.repeat(60));

  let totalBefore = 0;
  let totalAfter = 0;
  const results = []; // { name, before, after, quality, kept }
  let reencodedCount = 0;
  let keptCount = 0;
  let skippedCount = 0;

  for (const name of files) {
    const filePath = join(DIR, name);
    const original = await readFile(filePath);
    const before = original.length;
    totalBefore += before;

    // Idempotency: a file already at target dimensions AND target size is
    // already optimal — skip it so re-running never causes webp→webp
    // generation loss on good images. Files that are too large OR too tall
    // still get normalized below.
    const meta = await sharp(original).metadata();
    const longestEdge = Math.max(meta.width || 0, meta.height || 0);
    if (longestEdge <= MAX_EDGE && before <= AVG_TARGET_KB * KB) {
      totalAfter += before;
      skippedCount++;
      results.push({ name, before, after: before, quality: null, kept: true });
      continue;
    }

    // Primary pass at quality 80.
    let optimized = await encode(original, QUALITY_PRIMARY);
    let quality = QUALITY_PRIMARY;

    // Fallback: still too large → re-encode from the ORIGINAL at quality 70
    // (encoding from the original avoids compound lossy compression).
    if (optimized.length > REENCODE_THRESHOLD) {
      const fallback = await encode(original, QUALITY_FALLBACK);
      if (fallback.length < optimized.length) {
        optimized = fallback;
        quality = QUALITY_FALLBACK;
        reencodedCount++;
      }
    }

    // Defensive: never grow a file. Only the rare already-optimal tiny image
    // hits this; everything else is normalized and overwritten in place.
    const kept = optimized.length >= before;
    const after = kept ? before : optimized.length;
    totalAfter += after;
    if (kept) {
      keptCount++;
    } else if (!dryRun) {
      await writeFile(filePath, optimized);
    }
    results.push({ name, before, after, quality, kept });
  }

  // ---- Report ----
  const savedBytes = totalBefore - totalAfter;
  const savedPct = totalBefore > 0 ? (savedBytes / totalBefore) * 100 : 0;
  const avgBefore = totalBefore / files.length;
  const avgAfter = totalAfter / files.length;

  console.log('─'.repeat(60));
  console.log('SUMMARY');
  console.log('─'.repeat(60));
  console.log(`  Total before   : ${fmtMB(totalBefore).padStart(10)}`);
  console.log(`  Total after    : ${fmtMB(totalAfter).padStart(10)}   (${savedPct.toFixed(1)}% smaller)`);
  console.log(`  Saved          : ${fmtMB(savedBytes).padStart(10)}`);
  console.log(`  Avg before     : ${fmtKB(avgBefore).padStart(10)}`);
  console.log(`  Avg after      : ${fmtKB(avgAfter).padStart(10)}`);
  console.log(`  Re-encoded q70 : ${reencodedCount}`);
  console.log(`  Skipped optimal: ${skippedCount}  (already <= ${MAX_EDGE}px & <= ${AVG_TARGET_KB}KB)`);
  console.log(`  Kept original  : ${keptCount}  (would have grown)`);

  // Ticket targets: average <= 50 KB, total <= ~30 MB.
  const overTarget = results.filter((r) => r.after > AVG_TARGET_KB * KB);
  if (overTarget.length > 0) {
    console.log(`  Files > ${AVG_TARGET_KB}KB : ${overTarget.length}`);
  }
  const avgOk = avgAfter <= AVG_TARGET_KB * KB;
  const totalOk = totalAfter <= TOTAL_TARGET_MB * MB;
  console.log(
    `  Avg <= ${AVG_TARGET_KB}KB    : ${avgOk ? 'PASS' : 'FAIL'}   |   Total <= ${TOTAL_TARGET_MB}MB : ${totalOk ? 'PASS' : 'FAIL'}`,
  );

  console.log('─'.repeat(60));
  console.log('WORST 10 FILES (by size after)');
  console.log('─'.repeat(60));
  const worst = [...results].sort((a, b) => b.after - a.after).slice(0, 10);
  for (const r of worst) {
    const tag = r.kept ? '[kept]' : `[q${r.quality}]`;
    console.log(
      `  ${r.name.padEnd(28)} ${fmtKB(r.before).padStart(10)} → ${fmtKB(r.after).padStart(9)}  ${tag}`,
    );
  }

  if (dryRun) {
    console.log('─'.repeat(60));
    console.log('Dry run complete — no files written. Re-run without --dry-run to apply.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
