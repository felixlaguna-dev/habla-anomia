#!/usr/bin/env python3
"""
Validate word images using GLM-5.1 vision via Z.AI Anthropic API.
Sequential processing with progress bar. Resumable.

Usage:
    python scripts/validate-images.py [--start 0] [--limit 0] [--delay 1]

    --start N   Resume from word index N
    --limit N   Only check N words (0 = all)
    --delay N   Seconds between requests (default 1)
"""

import base64
import json
import os
import re
import sys
import time
import argparse
from pathlib import Path
from io import BytesIO
from PIL import Image
import urllib.request
import urllib.error

PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = PROJECT_ROOT / "static" / "images" / "words"
WORDS_TS = PROJECT_ROOT / "src" / "lib" / "data" / "words-es.ts"
REPORT_FILE = PROJECT_ROOT / "scripts" / "image-validation-report.json"
API_URL = "https://api.z.ai/api/anthropic/v1/messages"
IMG_SIZE = 384

PROMPT = """\
You are validating images for a Spanish aphasia rehabilitation app.
The image should represent the Spanish word: "{word}" (English: "{english}", category: {category}).

For elderly aphasia patients, images must be CLEAR and IMMEDIATELY RECOGNIZABLE as a single subject.

Reply with ONLY valid JSON (no markdown):
{{"match": true/false, "description": "what the image actually shows in one sentence", "issue": null or "wrong_subject" or "abstract" or "medical" or "diagram" or "text_only" or "ambiguous" or "multiple_subjects", "confidence": 0.0 to 1.0}}

Strict rules: REJECT medical scans, diagrams, text logos, abstract art. ACCEPT clear photos."""


def load_api_key():
    env_file = Path.home() / ".hermes" / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.strip().startswith("GLM_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("GLM_API_KEY")


def parse_words():
    content = WORDS_TS.read_text()
    pattern = r"id: '([^']+)',\s*\n\s*word: '([^']+)',\s*\n\s*category: '([^']+)',\s*\n.*?image_url: '([^']*)'"
    matches = re.findall(pattern, content, re.DOTALL)
    words, seen = [], set()
    for wid, word, cat, img in matches:
        fn = img.replace("/images/words/", "").replace(".webp", "") if img else word.lower().replace(" ", "_")
        if fn not in seen:
            seen.add(fn)
            words.append({"id": wid, "word": word, "category": cat, "filename": fn})
    return words


def load_english_map():
    english_map = {}
    map_file = Path("/tmp/habla_words_all.json")
    if map_file.exists():
        with open(map_file) as f:
            for w in json.load(f):
                english_map[w["filename"]] = w.get("english", w["word"])
    return english_map


def validate_one(word_info, api_key, english_map):
    img_path = IMAGES_DIR / f"{word_info['filename']}.webp"
    if not img_path.exists():
        return {**word_info, "status": "missing", "error": "file not found"}

    img = Image.open(img_path).convert("RGB").resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="PNG")
    png_b64 = base64.b64encode(buf.getvalue()).decode()

    english = english_map.get(word_info["filename"], word_info["word"])
    prompt = PROMPT.format(word=word_info["word"], english=english, category=word_info["category"])

    payload = {
        "model": "glm-5.1",
        "max_tokens": 300,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": png_b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                result = json.loads(resp.read())
            content = result.get("content", [{}])[0].get("text", "").strip()
            content = re.sub(r"^```(?:json)?\s*", "", content).strip()
            content = re.sub(r"\s*```$", "", content).strip()
            try:
                v = json.loads(content)
            except json.JSONDecodeError:
                m = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                v = json.loads(m.group()) if m else {"match": None, "description": content[:100]}
            return {
                **word_info, "status": "ok",
                "match": v.get("match"), "description": v.get("description", ""),
                "issue": v.get("issue"), "confidence": v.get("confidence", 0),
            }
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                time.sleep(15 * (attempt + 1))
                continue
            return {**word_info, "status": "http_error", "error": f"HTTP {e.code}: {e.read().decode()[:100]}"}
        except Exception as e:
            if attempt < 2:
                time.sleep(5)
                continue
            return {**word_info, "status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--delay", type=float, default=1.0)
    args = parser.parse_args()

    api_key = load_api_key()
    if not api_key:
        print("ERROR: GLM_API_KEY not found"); sys.exit(1)

    english_map = load_english_map()
    words = parse_words()

    # Load previous report
    prev_results = {}
    if REPORT_FILE.exists():
        with open(REPORT_FILE) as f:
            prev = json.load(f)
        for r in prev.get("results", []):
            prev_results[r.get("filename", "")] = r

    to_check = words[args.start:]
    if args.limit > 0:
        to_check = to_check[:args.limit]

    print(f"📊 Total: {len(words)} | Checking: {len(to_check)} (from idx {args.start})")
    print(f"📚 English map loaded: {len(english_map)} entries")
    print("=" * 70)

    results = []
    bad, good, err = 0, 0, 0
    t0 = time.time()

    for i, w in enumerate(to_check):
        idx = args.start + i
        fn = w["filename"]

        # Skip if previously validated as good
        if fn in prev_results:
            pr = prev_results[fn]
            if pr.get("match") is True and pr.get("confidence", 0) >= 0.8:
                results.append(pr)
                good += 1
                print(f"  [{idx+1}/{len(words)}] ⏩ {w['word']:<20} (cached ✅)")
                continue

        r = validate_one(w, api_key, english_map)
        results.append(r)

        if r.get("status") != "ok":
            icon, err = "💥", err + 1
        elif r.get("match") is False or r.get("issue"):
            icon, bad = "❌", bad + 1
        elif r.get("confidence", 1) < 0.7:
            icon, good = "🟡", good + 1
        else:
            icon, good = "✅", good + 1

        elapsed = time.time() - t0
        rate = (i + 1) / elapsed if elapsed > 0 else 1
        eta = (len(to_check) - i - 1) / rate if rate > 0 else 0

        desc = r.get("description", r.get("error", ""))[:55]
        issue = r.get("issue", "")
        match = r.get("match")
        conf = r.get("confidence", 0)

        print(f"  [{idx+1}/{len(words)}] {icon} {w['word']:<20} m={str(match):<5} c={conf:.1f} {issue or desc}  ({eta:.0f}s left)")

        if args.delay > 0:
            time.sleep(args.delay)

    # Save full report
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_words": len(words),
        "checked": len(to_check),
        "good": good, "bad": bad, "errors": err,
        "results": results,
    }
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"📊 ✅ {good} | ❌ {bad} | 💥 {err} | Total checked: {len(to_check)}")
    print(f"📄 Report: {REPORT_FILE}")

    if bad > 0:
        print(f"\n🚨 BAD IMAGES ({bad}):")
        for r in results:
            if r.get("match") is False or r.get("issue"):
                print(f"  • {r.get('word', '?'):<20} [{r.get('issue', '?')}] conf={r.get('confidence', 0):.1f}")
                print(f"    → {r.get('description', '')[:80]}")

    return bad + err


if __name__ == "__main__":
    sys.exit(1 if main() > 0 else 0)
