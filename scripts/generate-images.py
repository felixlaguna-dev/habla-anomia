#!/usr/bin/env python3
"""
Generate images for all words using Pollinations.ai (free, no API key).
Usage: python3 scripts/generate-images.py [--dry-run] [--category animals] [--limit 10]
Output: static/images/words/<filename>.webp
"""
import argparse, json, os, sys, time, urllib.request, urllib.parse, tempfile
from pathlib import Path
from PIL import Image

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_DIR / 'static' / 'images' / 'words'
WORDS_JSON = '/tmp/habla_words_all.json'
RATE_LIMIT = 1.5  # seconds between requests
MAX_RETRIES = 3
IMG_SIZE = 512

PROMPT_TEMPLATES = {
    'animals': 'A clear realistic photo of a {english} ({defn}), on white background, well-lit, educational photo, no text no watermark',
    'food': 'A clear appetizing photo of {english} ({defn}), on white background, food photography, no text no watermark',
    'body-parts': 'A clear anatomical illustration of the {english} on the human body, clean medical style, white background, educational, no text',
    'clothing': 'A clear photo of a {english} ({defn}), on white background, product photography, no text',
    'vehicles': 'A clear photo of a {english} ({defn}), on white background, side view, no text',
    'tools': 'A clear photo of a {english} ({defn}), on white background, studio shot, no text',
    'professions': 'A friendly cartoon illustration of a {english} ({defn}), in professional uniform, white background, no text',
    'colors': 'A clean solid square of {english}, vibrant and saturated color, minimalist, no text',
    'actions': 'A clear illustration of a person {english} ({defn}), cartoon style, white background, no text',
    'places': 'A clear photo of a {english} ({defn}), well-lit, clean composition, no text',
    'nature': 'A clear photo of a {english} ({defn}), on white background, nature photography, no text',
    'household': 'A clear photo of a {english} ({defn}), on white background, product photography, no text',
    'emotions': 'A clear illustration of a person face showing {english} emotion ({defn}), cartoon style, white background, no text',
    'family': 'A friendly cartoon illustration of a {english} ({defn}), white background, diverse representation, no text',
    'weather': 'A clear illustration of {english} ({defn}), realistic, light background, no text',
}

DEFAULT_TEMPLATE = 'A clear photo of a {english} ({defn}), on white background, educational, no text'


def build_prompt(word, english, category, definition):
    template = PROMPT_TEMPLATES.get(category, DEFAULT_TEMPLATE)
    defn = definition or word
    return template.format(word=word, english=english or word, defn=defn)


def download_image(prompt, dest_path):
    """Download image from Pollinations.ai"""
    encoded = urllib.parse.quote(prompt)
    url = f'https://image.pollinations.ai/prompt/{encoded}?width={IMG_SIZE}&height={IMG_SIZE}&nologo=true'
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'})
    with urllib.request.urlopen(req, timeout=180) as resp:
        if resp.status != 200:
            raise Exception(f'HTTP {resp.status}')
        data = resp.read()
    
    if len(data) < 500:
        raise Exception(f'Image too small ({len(data)}B)')
    
    # Save raw to temp file
    tmp = dest_path.with_suffix('.tmp')
    tmp.write_bytes(data)
    
    # Convert to WebP using Pillow
    img = Image.open(tmp)
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    img.save(dest_path, 'WEBP', quality=80)
    tmp.unlink()
    
    return dest_path.stat().st_size


def main():
    parser = argparse.ArgumentParser(description='Generate images for word bank')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--category', type=str, help='Filter by category')
    parser.add_argument('--limit', type=int, help='Max images to generate')
    parser.add_argument('--resume', type=str, help='Resume from word')
    args = parser.parse_args()
    
    with open(WORDS_JSON) as f:
        words = json.load(f)
    
    print(f'🎨 Habla Anomia — Image Generator (Pollinations.ai)')
    print(f'   Words loaded: {len(words)}')
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Filter
    filtered = words
    if args.category:
        filtered = [w for w in words if w['category'] == args.category]
        print(f'   Category: "{args.category}" → {len(filtered)} words')
    
    # Skip existing
    existing = {f.stem for f in OUTPUT_DIR.glob('*.webp')}
    to_generate = [w for w in filtered if w['filename'] and w['filename'] not in existing]
    
    print(f'   Existing: {len(filtered) - len(to_generate)}, To generate: {len(to_generate)}')
    
    if args.dry_run:
        sample = to_generate[:args.limit or 10]
        print(f'\n📋 Dry run ({len(sample)} prompts):')
        for w in sample:
            prompt = build_prompt(w['word'], w.get('english', ''), w['category'], w['definition'])
            print(f'\n  {w["word"]} ({w["category"]}) → {w["filename"]}.webp')
            print(f'  "{prompt}"')
        return
    
    queue = to_generate
    if args.limit:
        queue = queue[:args.limit]
    if args.resume:
        idx = next((i for i, w in enumerate(queue) if w['word'] == args.resume or w['filename'] == args.resume), 0)
        queue = queue[idx:]
        print(f'   Resuming from "{args.resume}"')
    
    print(f'\n🚀 Generating {len(queue)} images...\n')
    
    success = failed = skipped = 0
    
    for i, w in enumerate(queue):
        dest = OUTPUT_DIR / f'{w["filename"]}.webp'
        
        if dest.exists():
            skipped += 1
            continue
        
        prompt = build_prompt(w['word'], w.get('english', ''), w['category'], w['definition'])
        print(f'  [{i+1}/{len(queue)}] {w["word"]} ({w["category"]}) → {w["filename"]}.webp', end='', flush=True)
        
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                size = download_image(prompt, dest)
                print(f' ✅ {size/1024:.1f}KB')
                success += 1
                break
            except Exception as e:
                print(f' ❌ ({attempt}/{MAX_RETRIES}: {e})', end='', flush=True)
                if attempt == MAX_RETRIES:
                    print(f' 💀')
                    failed += 1
                    # Clean up
                    for tmp in OUTPUT_DIR.glob(f'{w["filename"]}.*.tmp'):
                        tmp.unlink(missing_ok=True)
                else:
                    time.sleep(RATE_LIMIT * attempt)
        
        if i < len(queue) - 1:
            time.sleep(RATE_LIMIT)
    
    total = len(list(OUTPUT_DIR.glob('*.webp')))
    print(f'\n✨ Done! ✅ {success} ❌ {failed} ⏭️ {skipped} | Total: {total}')


if __name__ == '__main__':
    main()
