#!/usr/bin/env python3
"""
Generate habla-anomia images via ChatGPT/Codex internal API.

Reads credentials from ~/.hermes/auth.json (Hermes auth store),
generates images via the Codex Responses API (gpt-image-2),
saves them to static/images/words/ and updates words-es.ts.

Usage:
    python scripts/generate-images.py --dry-run     # preview only
    python scripts/generate-images.py --limit 5      # generate 5 images
    python scripts/generate-images.py                # generate all missing

Makefile target: make generate-images
"""
import argparse
import base64
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
HERMES_AUTH = Path.home() / ".hermes" / "auth.json"
CODEX_BASE_URL = "https://chatgpt.com/backend-api/codex"
CODEX_CHAT_MODEL = "gpt-5.4"
IMAGE_MODEL = "gpt-image-2"
IMAGE_SIZE = "1024x1024"
IMAGE_QUALITY = "high"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORDS_FILE = PROJECT_ROOT / "src/lib/data/words-es.ts"
IMAGE_DIR = PROJECT_ROOT / "static/images/words"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
def get_codex_token() -> tuple[str, dict]:
    """Read Codex OAuth token + account ID from Hermes auth store."""
    if not HERMES_AUTH.exists():
        print("ERROR: ~/.hermes/auth.json not found. Run 'hermes auth' first.", file=sys.stderr)
        sys.exit(1)

    with open(HERMES_AUTH) as f:
        auth = json.load(f)

    tokens = auth.get("providers", {}).get("openai-codex", {}).get("tokens", {})
    access_token = tokens.get("access_token", "")
    if not access_token:
        print("ERROR: No Codex access token in Hermes auth store.", file=sys.stderr)
        sys.exit(1)

    # Decode JWT to get account ID and check expiry
    payload_b64 = access_token.split(".")[1]
    payload_b64 += "=" * (-len(payload_b64) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload_b64))

    import datetime
    exp = datetime.datetime.fromtimestamp(claims.get("exp", 0), tz=datetime.timezone.utc)
    now = datetime.datetime.now(datetime.timezone.utc)
    if now > exp:
        print(f"ERROR: Codex token expired at {exp}. Run 'hermes auth' to refresh.", file=sys.stderr)
        sys.exit(1)

    acct_id = claims.get("https://api.openai.com/auth", {}).get("chatgpt_account_id", "")
    print(f"Token valid until {exp.strftime('%Y-%m-%d %H:%M UTC')}")
    return access_token, {"account_id": acct_id}


def codex_headers(access_token: str, account_id: str) -> dict:
    """Headers required by the Codex/ChatGPT backend API."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "User-Agent": "codex_cli_rs/0.0.0 (Hermes Agent)",
        "originator": "codex_cli_rs",
    }
    if account_id:
        headers["ChatGPT-Account-ID"] = account_id
    return headers


# ---------------------------------------------------------------------------
# Word parsing
# ---------------------------------------------------------------------------
def normalize_filename(word: str) -> str:
    s = unicodedata.normalize("NFKD", word)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.replace(" ", "-")


def parse_words():
    """Parse words-es.ts and return list of word dicts."""
    with open(WORDS_FILE) as f:
        content = f.read()

    pattern = r"""\{\s*\n\s*id:\s*'([^']+)'.*?\n\s*word:\s*'([^']+)'.*?\n\s*categories:\s*\[([^\]]*)\].*?\n\s*image_url:\s*'([^']*)'.*?\n\s*definition:\s*'([^']*)'"""
    entries = []
    for m in re.finditer(pattern, content, re.DOTALL):
        cats = [c.strip().strip("'\"") for c in m.group(3).split(",") if c.strip()]
        entries.append({
            "id": m.group(1),
            "word": m.group(2),
            "category": cats[0] if cats else "unknown",
            "image_url": m.group(4),
            "definition": m.group(5),
        })
    return entries, content


def find_missing_images(entries):
    """Find words whose image file doesn't exist on disk."""
    missing = []
    for e in entries:
        fname = normalize_filename(e["word"])
        path = IMAGE_DIR / f"{fname}.webp"
        if not path.exists():
            missing.append(e)
    return missing


# ---------------------------------------------------------------------------
# Image generation
# ---------------------------------------------------------------------------
def build_prompt(entry):
    """Build a descriptive prompt for image generation."""
    word = entry["word"]
    cat = entry["category"]
    definition = entry["definition"]

    if cat == "emotions":
        return (
            f"A realistic, well-lit photograph depicting the emotion '{word}' "
            f"({definition}), shown through an expressive human face, "
            f"centered composition, white neutral background, "
            f"professional portrait photography style"
        )
    elif cat == "weather":
        return (
            f"A realistic, well-lit photograph of '{word}' ({definition}), "
            f"centered composition, clear visible weather phenomenon, "
            f"professional nature photography style, high detail"
        )
    else:
        return (
            f"A clear, well-lit photograph of '{word}' ({definition}), "
            f"centered composition, white neutral background, "
            f"product photography style, high detail"
        )


def generate_image(access_token: str, account_id: str, prompt: str) -> tuple[bytes | None, str]:
    """Generate an image via the Codex Responses API. Returns (image_bytes, error)."""
    import httpx

    url = f"{CODEX_BASE_URL}/responses"
    headers = codex_headers(access_token, account_id)

    body = {
        "model": CODEX_CHAT_MODEL,
        "store": False,
        "instructions": "You are an assistant that must fulfill image generation requests by using the image_generation tool when provided.",
        "input": [{
            "type": "message",
            "role": "user",
            "content": [{"type": "input_text", "text": prompt}],
        }],
        "tools": [{
            "type": "image_generation",
            "model": IMAGE_MODEL,
            "size": IMAGE_SIZE,
            "quality": IMAGE_QUALITY,
            "output_format": "png",
            "background": "opaque",
            "partial_images": 1,
        }],
        "tool_choice": {
            "type": "allowed_tools",
            "mode": "required",
            "tools": [{"type": "image_generation"}],
        },
        "stream": True,
    }

    image_b64 = None

    with httpx.stream("POST", url, json=body, headers=headers, timeout=120) as resp:
        if resp.status_code != 200:
            error_text = resp.read().decode("utf-8", errors="replace")[:300]
            return None, f"HTTP {resp.status_code}: {error_text}"

        for line in resp.iter_lines():
            if not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str.strip() == "[DONE]":
                break
            try:
                event = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type", "")

            if event_type == "response.output_item.done":
                item = event.get("item", {})
                if item.get("type") == "image_generation_call":
                    result = item.get("result", "")
                    if result:
                        image_b64 = result

            elif event_type == "response.image_generation_call.partial_image":
                partial = event.get("partial_image_b64", "")
                if partial:
                    image_b64 = partial

    if image_b64:
        return base64.b64decode(image_b64), None
    return None, "No image in response stream"


def update_words_file(entry, filename):
    """Update the image_url in words-es.ts for a given word."""
    with open(WORDS_FILE) as f:
        content = f.read()

    new_url = f"/images/words/{filename}.webp"
    pattern = rf"(id:\s*'{re.escape(entry['id'])}'.*?image_url:\s*')([^']*)(')"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        content = content[:match.start(2)] + new_url + content[match.end(2):]
        with open(WORDS_FILE, "w") as f:
            f.write(content)
        return True
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Generate missing habla-anomia images")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    parser.add_argument("--limit", type=int, default=0, help="Max images to generate (0=all)")
    parser.add_argument("--word", type=str, help="Generate for a specific word only")
    args = parser.parse_args()

    print("=== Habla Anomia Image Generator ===")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Words file: {WORDS_FILE}")
    print(f"Image dir: {IMAGE_DIR}")
    print()

    # Auth
    access_token, auth_info = get_codex_token()
    account_id = auth_info.get("account_id", "")

    # Parse words
    entries, _ = parse_words()
    print(f"Total words in data file: {len(entries)}")

    # Find missing
    missing = find_missing_images(entries)
    print(f"Words missing images: {len(missing)}")

    if not missing:
        print("\nAll words have images! Nothing to do.")
        return

    # Filter by --word if specified
    if args.word:
        missing = [e for e in missing if e["word"] == args.word]
        if not missing:
            print(f"Word '{args.word}' not found or already has an image.")
            return

    # Apply limit
    if args.limit > 0:
        missing = missing[:args.limit]

    print(f"\nWill generate: {len(missing)} images")
    print()

    if args.dry_run:
        for i, e in enumerate(missing):
            fname = normalize_filename(e["word"])
            prompt = build_prompt(e)
            print(f"  [{i+1}/{len(missing)}] {e['word']} ({e['category']})")
            print(f"    file: {fname}.webp")
            print(f"    prompt: {prompt[:100]}...")
            print()
        return

    # Generate
    ok = fail = 0
    for i, entry in enumerate(missing):
        fname = normalize_filename(entry["word"])
        prompt = build_prompt(entry)
        outpath = IMAGE_DIR / f"{fname}.webp"

        print(f"[{i+1}/{len(missing)}] {entry['word']} ({entry['category']})...", flush=True)
        print(f"  prompt: {prompt[:80]}...", flush=True)

        img_bytes, error = generate_image(access_token, account_id, prompt)

        if img_bytes:
            with open(outpath, "wb") as f:
                f.write(img_bytes)
            updated = update_words_file(entry, fname)
            print(f"  ✓ saved {outpath.name} ({len(img_bytes):,} bytes) — ts {'updated' if updated else 'NOT updated'}", flush=True)
            ok += 1
        else:
            print(f"  ✗ FAILED: {error}", flush=True)
            fail += 1

        # Rate limit
        if i < len(missing) - 1:
            time.sleep(2)

        # Progress every 10
        if (i + 1) % 10 == 0:
            print(f"\n  === Progress: {i+1}/{len(missing)} ({ok} ok, {fail} fail) ===\n", flush=True)

    print(f"\n=== Done: {ok} generated, {fail} failed, {len(missing)} total ===")


if __name__ == "__main__":
    main()
