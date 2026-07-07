#!/usr/bin/env python3
"""
Local CINEAST maintenance runner.

Refreshes the small local IMDb score cache and reports image assets that still
need WebP versions. Use --convert-webp when you want it to create missing WebP
files through the project WebP conversion skill script.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMDB_DATA_PATH = ROOT / "public" / "data" / "imdb_scores.json"
ASSETS_DIR = ROOT / "public" / "assets"
WEBP_CONVERTER = ROOT / ".agents" / "skills" / "webp-conversion" / "scripts" / "convert.py"

DEFAULT_FILMS = {
    "the bridges of madison county": {
        "title": "The Bridges of Madison County",
        "imdb_id": "tt0112579",
        "year": "1995",
        "score": "7.6",
    },
    "paris, texas": {
        "title": "Paris, Texas",
        "imdb_id": "tt0087884",
        "year": "1984",
        "score": "8.1",
    },
    "jeanne dielman": {
        "title": "Jeanne Dielman, 23 quai du Commerce, 1080 Bruxelles",
        "imdb_id": "tt0073198",
        "year": "1975",
        "score": "7.5",
    },
    "taxi driver": {
        "title": "Taxi Driver",
        "imdb_id": "tt0075314",
        "year": "1976",
        "score": "8.2",
    },
}


def load_imdb_data() -> dict:
    if not IMDB_DATA_PATH.exists():
        return {"updated_at": None, "films": DEFAULT_FILMS}

    with IMDB_DATA_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    films = data.get("films") if isinstance(data, dict) else None
    if not isinstance(films, dict):
        films = {}

    merged = DEFAULT_FILMS.copy()
    merged.update(films)
    return {"updated_at": data.get("updated_at"), "films": merged}


def fetch_imdb_rating(imdb_id: str) -> str | None:
    url = f"https://www.imdb.com/title/{imdb_id}/"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
        },
    )

    with urllib.request.urlopen(request, timeout=15) as response:
        html = response.read().decode("utf-8", errors="ignore")

    patterns = [
        r'"aggregateRating"\s*:\s*\{[^}]*"ratingValue"\s*:\s*"?([0-9.]+)"?',
        r'"ratingValue"\s*:\s*"?([0-9.]+)"?',
    ]

    for pattern in patterns:
        match = re.search(pattern, html)
        if match:
            return f"{float(match.group(1)):.1f}"

    return None


def refresh_imdb_scores() -> bool:
    data = load_imdb_data()
    changed = False

    print("Checking IMDb scores...")
    for key, film in data["films"].items():
        imdb_id = film.get("imdb_id")
        if not imdb_id:
            print(f"  - {film.get('title', key)}: missing IMDb id, skipped")
            continue

        try:
            rating = fetch_imdb_rating(imdb_id)
        except Exception as error:
            print(f"  - {film.get('title', key)}: unable to refresh ({error})")
            continue

        if not rating:
            print(f"  - {film.get('title', key)}: rating not found")
            continue

        old_rating = film.get("score")
        film["score"] = rating
        changed = changed or rating != old_rating
        print(f"  - {film.get('title', key)}: {old_rating or 'n/a'} -> {rating}")

    if changed:
        data["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        IMDB_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        with IMDB_DATA_PATH.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        print(f"Updated {IMDB_DATA_PATH.relative_to(ROOT)}")
    else:
        print("IMDb score cache already looks current, or refresh was unavailable.")

    return changed


def find_webp_candidates() -> list[Path]:
    candidates = []
    for path in ASSETS_DIR.rglob("*"):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            continue

        webp_path = path.with_suffix(".webp")
        if not webp_path.exists() or path.stat().st_mtime > webp_path.stat().st_mtime:
            candidates.append(path)

    return candidates


def check_webp_assets(convert: bool) -> bool:
    print("Checking WebP asset coverage...")
    candidates = find_webp_candidates()

    if not candidates:
        print("  All PNG/JPEG assets have current WebP siblings.")
        return False

    print(f"  {len(candidates)} asset(s) need WebP conversion:")
    for path in candidates[:30]:
        print(f"  - {path.relative_to(ROOT)}")
    if len(candidates) > 30:
        print(f"  - ...and {len(candidates) - 30} more")

    if convert:
        print("Running WebP converter...")
        subprocess.check_call([sys.executable, str(WEBP_CONVERTER), str(ASSETS_DIR)])
        return True

    print("  Run `npm run maintenance:fix` to create missing WebP files.")
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Run local CINEAST maintenance checks.")
    parser.add_argument("--imdb-only", action="store_true", help="Only refresh IMDb score data.")
    parser.add_argument("--webp-only", action="store_true", help="Only check WebP asset coverage.")
    parser.add_argument("--convert-webp", action="store_true", help="Create missing WebP files.")
    args = parser.parse_args()

    if args.imdb_only and args.webp_only:
        parser.error("--imdb-only and --webp-only cannot be used together")

    if not args.webp_only:
        refresh_imdb_scores()

    if not args.imdb_only:
        check_webp_assets(convert=args.convert_webp)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
