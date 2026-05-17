#!/usr/bin/env python3
"""
Generate images for all words using Wikimedia Commons (free, no API key).
Downloads real photographs. Uses English search terms for precision.

Usage:
  python3 scripts/generate-images.py --dry-run --limit 5
  python3 scripts/generate-images.py --category animals --limit 10
  python3 scripts/generate-images.py                           # all missing
  python3 scripts/generate-images.py --replace                 # regenerate all
"""
import argparse, json, os, sys, time, urllib.request, urllib.parse
from pathlib import Path
from io import BytesIO
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_DIR / 'static' / 'images' / 'words'
WORDS_JSON = '/tmp/habla_words_all.json'
RATE_LIMIT = 3.0
IMG_SIZE = 512
THUMB_SIZE = 500


def wikimedia_get(url, retries=3):
    """GET request to Wikimedia with 429 backoff."""
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={'User-Agent': 'HablaAnomia/1.0 (educational)'})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 15 * (attempt + 1)
                time.sleep(wait)
                continue
            raise
        except Exception:
            if attempt < retries - 1:
                time.sleep(5)
                continue
            raise
    raise Exception(f'Failed after {retries} retries')


def search_wikimedia(query, limit=5):
    """Search Wikimedia Commons. Returns list of {thumb, title}."""
    params = urllib.parse.urlencode({
        'action': 'query',
        'generator': 'search',
        'gsrnamespace': 6,
        'gsrsearch': query,
        'gsrlimit': limit,
        'prop': 'imageinfo',
        'iiprop': 'url|size|mime',
        'iiurlwidth': THUMB_SIZE,
        'format': 'json',
    })
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    raw = wikimedia_get(url)
    data = json.loads(raw)

    results = []
    pages = data.get('query', {}).get('pages', {})
    for pid, page in sorted(pages.items()):
        info = page.get('imageinfo', [{}])[0]
        mime = info.get('mime', '')
        if mime not in ('image/jpeg', 'image/png'):
            continue
        thumb = info.get('thumburl', '')
        w = info.get('width', 0)
        h = info.get('height', 0)
        if w < 100 or h < 100:
            continue
        if max(w, h) / max(min(w, h), 1) > 3:
            continue
        results.append({'thumb': thumb, 'title': page.get('title', '')})
    return results


def download_and_convert(url, dest_path):
    """Download image, crop to square, convert to WebP."""
    raw = wikimedia_get(url)
    if len(raw) < 500:
        raise Exception(f'Too small ({len(raw)}B)')
    img = Image.open(BytesIO(raw)).convert('RGB')
    w, h = img.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    img.save(dest_path, 'WEBP', quality=80)
    return dest_path.stat().st_size


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--category', type=str)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--resume', type=str)
    parser.add_argument('--replace', action='store_true')
    args = parser.parse_args()

    with open(WORDS_JSON) as f:
        words = json.load(f)

    # Filter
    filtered = words
    if args.category:
        filtered = [w for w in words if w['category'] == args.category]

    if not args.replace:
        existing = {f.stem for f in OUTPUT_DIR.glob('*.webp')}
        queue = [w for w in filtered if w.get('filename') and w['filename'] not in existing]
    else:
        queue = [w for w in filtered if w.get('filename')]

    print(f'🎨 Wikimedia Commons Image Generator')
    print(f'   Total: {len(words)} | To generate: {len(queue)} | Cost: FREE')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for w in queue[:args.limit or 10]:
            english = w.get('english', w['word'])
            print(f'\n  {w["word"]} → "{english}"')
            results = search_wikimedia(english, limit=3)
            for r in results:
                print(f'    → {r["title"][:60]}')
        return

    if args.limit:
        queue = queue[:args.limit]
    if args.resume:
        idx = next((i for i, w in enumerate(queue)
                     if w['word'] == args.resume or w['filename'] == args.resume), 0)
        queue = queue[idx:]

    print(f'\n🚀 Generating {len(queue)} images...\n')

    success = failed = 0

    for i, w in enumerate(queue):
        dest = OUTPUT_DIR / f'{w["filename"]}.webp'
        english = w.get('english', w['word'])
        print(f'  [{i+1}/{len(queue)}] {w["word"]} ({english})', end=' ', flush=True)

        try:
            # Search using English term for precision
            results = search_wikimedia(english, limit=5)
            if not results:
                raise Exception('No results')

            # Try top 3 results
            ok = False
            for r in results[:3]:
                if not r['thumb']:
                    continue
                try:
                    size = download_and_convert(r['thumb'], dest)
                    print(f'✅ {size/1024:.1f}KB')
                    ok = True
                    success += 1
                    break
                except Exception:
                    continue

            if not ok:
                print('💀 download failed')
                failed += 1

        except Exception as e:
            print(f'❌ {e}')
            failed += 1

        if i < len(queue) - 1:
            time.sleep(RATE_LIMIT)

    total = len(list(OUTPUT_DIR.glob('*.webp')))
    print(f'\n✨ Done! ✅ {success} ❌ {failed} | Total images: {total}')


if __name__ == '__main__':
    main()
