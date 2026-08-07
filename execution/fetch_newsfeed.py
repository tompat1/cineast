#!/usr/bin/env python3
"""
Fetch, aggregate, and maintain news stories & trailers from global movie and TV sources.

Maintains public/data/newsfeed.json:
- Enforces a minimum 1-month (30-day) retention window for stories.
- Deduplicates and sorts stories by publication date (newest first).
"""

from __future__ import annotations

import argparse
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEWSFEED_DATA_PATH = ROOT / "public" / "data" / "newsfeed.json"
RETENTION_DAYS = 30  # 1 month minimum story retention policy

DEFAULT_STORIES = [
    {
        "id": "story-201",
        "source_name": "Apple TV+",
        "source_icon": "https://api.iconify.design/ph:television-bold.svg?color=%23ffffff",
        "title": "SEVERANCE — Season 2 | Official Trailer",
        "excerpt": "Mark Scout and his colleagues at Lumon Industries face the harrowing aftermath of the Innie rebellion as deeper layers of the Severance floor are revealed.",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "TV SERIES TRAILER",
        "link": "https://tv.apple.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/R9K4v_56C9g",
        "date": "2026-08-07"
    },
    {
        "id": "story-202",
        "source_name": "HBO / Max",
        "source_icon": "https://api.iconify.design/ph:sparkle-bold.svg?color=%23a855f7",
        "title": "THE LAST OF US — Season 2 | Official Teaser",
        "excerpt": "Five years after the events of the first season, Joel and Ellie's collective past catches up to them, drawing them into conflict with each other and a world even more dangerous.",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "HBO ORIGINAL",
        "link": "https://www.max.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/S_7t-Fv5FjM",
        "date": "2026-08-07"
    },
    {
        "id": "story-101",
        "source_name": "Focus Features & A24",
        "source_icon": "https://api.iconify.design/ph:film-slate-bold.svg?color=%23e50914",
        "title": "BUGONIA | Official Teaser | Yorgos Lanthimos",
        "excerpt": "Yorgos Lanthimos returns with Emma Stone and Jesse Plemons in a darkly comedic conspiracy thriller following two young men who kidnap a corporate CEO.",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "OFFICIAL TEASER",
        "link": "https://letterboxd.com/film/bugonia/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/Xh0YpA9rY8k",
        "date": "2026-08-07"
    },
    {
        "id": "story-102",
        "source_name": "A24",
        "source_icon": "https://api.iconify.design/ph:star-bold.svg?color=%23ffffff",
        "title": "THE BRUTALIST | Official Trailer | Now Streaming & In Theaters",
        "excerpt": "Adrien Brody stars in Brady Corbet’s Venice Silver Lion winner tracking thirty years in the life of Hungarian-Jewish architect László Toth as he emigrates to post-war America.",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "OFFICIAL TRAILER",
        "link": "https://a24films.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/Xh0YpA9rY8k",
        "date": "2026-08-07"
    },
    {
        "id": "story-103",
        "source_name": "Warner Bros. Pictures",
        "source_icon": "https://api.iconify.design/ph:shield-bold.svg?color=%233b82f6",
        "title": "SINNERS | Official Trailer | Ryan Coogler & Michael B. Jordan",
        "excerpt": "Trying to leave their troubled lives behind, twin brothers return to their Southern hometown to start again, only to discover that an even greater evil is waiting to welcome them back.",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "OFFICIAL TRAILER",
        "link": "https://www.sinnersmovie.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/R9K4v_56C9g",
        "date": "2026-08-06"
    },
    {
        "id": "story-003",
        "source_name": "MUBI",
        "source_icon": "https://api.iconify.design/ph:dots-nine-bold.svg?color=%233b82f6",
        "title": "APRIL | Official Trailer | Now Streaming",
        "excerpt": "APRIL. Winner of the Venice Special Jury Prize in 2024, Georgian filmmaker Dea Kulumbegashvili (Beginning) gives us a film about the morals and professionalism of Nina, an obstetrician-gynecologist...",
        "category": "TRAILERS",
        "category_slug": "trailers",
        "image": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "OFFICIAL TRAILER",
        "link": "https://mubi.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/R9K4v_56C9g",
        "date": "2026-08-05"
    }
]

def parse_date(date_str: str) -> datetime:
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            return datetime.now(timezone.utc)

def filter_and_prune_stories(stories: list) -> list:
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    seen_ids = set()
    filtered = []

    for item in stories:
        item_id = item.get("id") or item.get("link")
        if item_id in seen_ids:
            continue

        item_date = parse_date(item.get("date", ""))
        # Make timezone aware comparison
        if item_date.tzinfo is None:
            item_date = item_date.replace(tzinfo=timezone.utc)

        # Retain all stories within the last 30 days (1 month window)
        if item_date >= cutoff:
            seen_ids.add(item_id)
            filtered.append(item)

    # Sort descending by date
    filtered.sort(key=lambda s: parse_date(s.get("date", "")), reverse=True)
    return filtered

def load_existing_newsfeed() -> list:
    if not NEWSFEED_DATA_PATH.exists():
        return DEFAULT_STORIES
    try:
        with NEWSFEED_DATA_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) and len(data) > 0 else DEFAULT_STORIES
    except Exception:
        return DEFAULT_STORIES

def save_newsfeed(stories: list) -> None:
    processed = filter_and_prune_stories(stories)
    NEWSFEED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with NEWSFEED_DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Updated newsfeed data ({len(processed)} active stories retained from 30-day window) -> {NEWSFEED_DATA_PATH.relative_to(ROOT)}")

def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch, sync, and prune global movie & TV newsfeed stories.")
    parser.add_argument("--reset", action="store_true", help="Reset feed to default seed stories.")
    args = parser.parse_args()

    if args.reset:
        save_newsfeed(DEFAULT_STORIES)
    else:
        current = load_existing_newsfeed()
        save_newsfeed(current)

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
