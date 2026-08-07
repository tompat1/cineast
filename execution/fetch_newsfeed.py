#!/usr/bin/env python3
"""
Fetch and aggregate news stories from global movie & cinema sources.

Generates and updates public/data/newsfeed.json with normalized story cards.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEWSFEED_DATA_PATH = ROOT / "public" / "data" / "newsfeed.json"

# Default seed stories matching reference image & international cinema sources
DEFAULT_STORIES = [
    {
        "id": "story-001",
        "source_name": "AFI",
        "source_icon": "https://api.iconify.design/ph:film-strip-bold.svg?color=%23e50914",
        "title": "Play Today’s Game #1587",
        "excerpt": "Guess this movie image! Track your Get the Picture play and win streaks and challenge yourself with past games.",
        "category": "RETROSPECTIVES",
        "category_slug": "retrospectives",
        "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "question",
        "overlay_badge": "Get the Picture",
        "link": "https://www.afi.com/",
        "is_video": False,
        "date": "2026-08-07"
    },
    {
        "id": "story-002",
        "source_name": "DCA Cinema",
        "source_icon": "https://api.iconify.design/ph:video-camera-bold.svg?color=%23ffffff",
        "title": "Sculpting in Time: Andrei Tarkovsky",
        "excerpt": "David Nixon, DCA’s Head of Cinema, shares more about our Andrei Tarkovsky season, taking place throughout August.",
        "category": "RETROSPECTIVES",
        "category_slug": "retrospectives",
        "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "",
        "link": "https://www.dca.org.uk/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/S_7t-Fv5FjM",
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
        "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "OFFICIAL TRAILER",
        "link": "https://mubi.com/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/R9K4v_56C9g",
        "date": "2026-08-05"
    },
    {
        "id": "story-004",
        "source_name": "Denver Film",
        "source_icon": "https://api.iconify.design/ph:ticket-bold.svg?color=%23ec4899",
        "title": "DFF49 Passes Are On Sale!",
        "excerpt": "However you DFF, it all starts with a pass. From first-time festivalgoers to seasoned cinephiles and red carpet regulars, there's a pass designed to unlock your perfect festival experience.",
        "category": "FESTIVALS",
        "category_slug": "festivals",
        "image": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "banner",
        "overlay_badge": "OCTOBER 22 - NOVEMBER 1",
        "link": "https://www.denverfilm.org/",
        "is_video": False,
        "date": "2026-08-04"
    },
    {
        "id": "story-005",
        "source_name": "Votiv Kino & Kino de France",
        "source_icon": "https://api.iconify.design/ph:rainbow-cloud-bold.svg?color=%23ef4444",
        "title": "Queerfilmfestival 2026",
        "excerpt": "Vom 10. bis 16. September 2026 zeigt das Votiv Kino gemeinsam mit dem Kino De France wieder die ganze Bandbreite des internationalen queeren Kinos.",
        "category": "FESTIVALS",
        "category_slug": "festivals",
        "image": "https://images.unsplash.com/photo-1518676599625-5835928f6458?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "QUEER FILM FESTIVAL",
        "link": "https://www.votivkino.at/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/S_7t-Fv5FjM",
        "date": "2026-08-03"
    },
    {
        "id": "story-006",
        "source_name": "Film Independent",
        "source_icon": "https://api.iconify.design/ph:graduation-cap-bold.svg?color=%23f97316",
        "title": "‘The Perfect Neighbor’: A Documentary Ethics Case Study",
        "excerpt": "Filmmaker Tuesday case study on documentary ethics, exploring filmmaker responsibilities when representing complex non-fiction subjects.",
        "category": "INDIES",
        "category_slug": "indies",
        "image": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
        "overlay_type": "play",
        "overlay_badge": "DOCUMENTARY ETHICS",
        "link": "https://www.filmindependent.org/",
        "is_video": True,
        "video_url": "https://www.youtube.com/embed/S_7t-Fv5FjM",
        "date": "2026-08-02"
    }
]

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
    NEWSFEED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with NEWSFEED_DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(stories, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Updated newsfeed data ({len(stories)} stories) -> {NEWSFEED_DATA_PATH.relative_to(ROOT)}")

def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch and sync global movie newsfeed stories.")
    parser.add_argument("--reset", action="store_true", help="Reset feed to default reference seed stories.")
    args = parser.parse_args()

    if args.reset:
        save_newsfeed(DEFAULT_STORIES)
    else:
        current = load_existing_newsfeed()
        save_newsfeed(current)

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
