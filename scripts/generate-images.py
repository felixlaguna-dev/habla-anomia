#!/usr/bin/env python3
"""
Generate images for all words using Wikipedia article images (free, no API key).
Downloads the lead image from the Wikipedia article for each concept — much more
accurate than Wikimedia Commons search.

Usage:
  python3 scripts/generate-images.py --dry-run --limit 5
  python3 scripts/generate-images.py --replace                # regenerate all
"""
import json, os, sys, time, urllib.request, urllib.parse
from pathlib import Path
from io import BytesIO
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_DIR / 'static' / 'images' / 'words'
WORDS_JSON = '/tmp/habla_words_all.json'
ARTICLE_MAP = '/tmp/wiki_filename_map.json'
RATE_LIMIT = 1.0  # Wikipedia is more lenient than Commons
IMG_SIZE = 512


def http_get(url, retries=3):
    """GET with retry."""
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={
            'User-Agent': 'HablaAnomia/1.0 (educational project, https://github.com/felixlaguna-dev/habla-anomia)'
        })
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(10 * (attempt + 1))
                continue
            raise
        except Exception:
            if attempt < retries - 1:
                time.sleep(3)
                continue
            raise
    raise Exception(f'Failed after {retries} retries: {url}')


def get_wikipedia_image(article_title):
    """Get the lead image URL from a Wikipedia article."""
    encoded = urllib.parse.quote(article_title, safe='')
    url = f'https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}'
    raw = http_get(url)
    data = json.loads(raw)
    thumbnail = data.get('thumbnail', {}).get('source')
    original = data.get('originalimage', {}).get('source')
    # Prefer original for quality, fall back to thumbnail
    return original or thumbnail, data.get('title', article_title)


def download_and_convert(url, dest_path):
    """Download image, crop to square, convert to WebP."""
    raw = http_get(url)
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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--category', type=str)
    parser.add_argument('--limit', type=int)
    parser.add_argument('--replace', action='store_true')
    args = parser.parse_args()

    with open(WORDS_JSON) as f:
        words = json.load(f)
    with open(ARTICLE_MAP) as f:
        article_map = json.load(f)

    # Filter
    filtered = words
    if args.category:
        filtered = [w for w in words if w['category'] == args.category]

    if not args.replace:
        existing = {f.stem for f in OUTPUT_DIR.glob('*.webp')}
        queue = [w for w in filtered if w.get('filename') and w['filename'] not in existing]
    else:
        queue = [w for w in filtered if w.get('filename')]

    if args.limit:
        queue = queue[:args.limit]

    print(f'🎨 Wikipedia Image Generator')
    print(f'   Words: {len(words)} | To generate: {len(queue)} | Cost: FREE')
    print(f'   Source: en.wikipedia.org (curated article images)')

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for w in queue:
            article = article_map.get(w['filename'], w['word'])
            try:
                img_url, title = get_wikipedia_image(article)
                print(f'  ✅ {w["word"]:15s} → {article:30s} → {title}')
            except Exception as e:
                print(f'  ❌ {w["word"]:15s} → {article:30s} → {e}')
            time.sleep(0.5)
        return

    print(f'\n🚀 Generating {len(queue)} images...\n')

    success = failed = 0
    for i, w in enumerate(queue):
        dest = OUTPUT_DIR / f'{w["filename"]}.webp'
        article = article_map.get(w['filename'], w['word'])
        print(f'  [{i+1}/{len(queue)}] {w["word"]:15s} → {article}', end=' ', flush=True)

        try:
            img_url, title = get_wikipedia_image(article)
            if not img_url:
                raise Exception('No image')

            size = download_and_convert(img_url, dest)
            print(f'✅ {size/1024:.1f}KB ({title})')
            success += 1
        except Exception as e:
            print(f'❌ {e}')
            failed += 1

        if i < len(queue) - 1:
            time.sleep(RATE_LIMIT)

    total = len(list(OUTPUT_DIR.glob('*.webp')))
    print(f'\n✨ Done! ✅ {success} ❌ {failed} | Total images: {total}')


if __name__ == '__main__':
    main()
