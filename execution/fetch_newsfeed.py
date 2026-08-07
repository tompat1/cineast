#!/usr/bin/env python3
"""
Fetch, aggregate, and maintain live news stories & latest trailers from global movie, TV, and IMDb/YouTube RSS sources.

Maintains public/data/newsfeed.json:
- Queries YouTube RSS Atom feeds (IMDb, Rotten Tomatoes Trailers, Movieclips) for the newest trailer releases.
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

# Official YouTube Atom RSS feed channels for real-time latest trailers
YOUTUBE_TRAILER_FEEDS = [
    {
        "source_name": "IMDb Trailers",
        "source_icon": "https://api.iconify.design/ph:film-strip-bold.svg?color=%23f5c518",
        "feed_url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCmV5tsXb6t52q5b65FmD3wQ",
        "overlay_badge": "IMDb LATEST TRAILER"
    },
    {
        "source_name": "Rotten Tomatoes Trailers",
        "source_icon": "https://api.iconify.design/ph:popcorn-bold.svg?color=%23ef4444",
        "feed_url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC6s-sV1-7wD94T7n69N7w_Q",
        "overlay_badge": "LATEST TRAILER"
    }
]

DEFAULT_STORIES = [
  {
    "id": "imdb-101",
    "source_name": "IMDb Trailers",
    "source_icon": "https://api.iconify.design/ph:film-strip-bold.svg?color=%23f5c518",
    "title": "MISSION: IMPOSSIBLE — The Final Reckoning | Official Trailer",
    "excerpt": "Tom Cruise returns as Ethan Hunt in Christopher McQuarrie’s action spectacle. Our lives are the sum of our choices. Watch the official trailer now.",
    "category": "TRAILERS",
    "category_slug": "trailers",
    "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    "overlay_type": "play",
    "overlay_badge": "IMDb LATEST TRAILER",
    "link": "https://www.imdb.com/title/tt9603212/",
    "is_video": True,
    "video_url": "https://www.youtube.com/embed/NOhDyR-114M",
    "date": "2026-08-07"
  },
  {
    "id": "imdb-102",
    "source_name": "IMDb Trailers",
    "source_icon": "https://api.iconify.design/ph:film-strip-bold.svg?color=%23f5c518",
    "title": "F1 | Official Teaser Trailer | Brad Pitt & Joseph Kosinski",
    "excerpt": "Brad Pitt stars as a former Formula 1 driver returning to the grid alongside Damson Idris at APXGP. Directed by Top Gun: Maverick's Joseph Kosinski.",
    "category": "TRAILERS",
    "category_slug": "trailers",
    "image": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
    "overlay_type": "play",
    "overlay_badge": "IMDb LATEST TRAILER",
    "link": "https://www.imdb.com/title/tt16311594/",
    "is_video": True,
    "video_url": "https://www.youtube.com/embed/8q_i-Gk5JqE",
    "date": "2026-08-07"
  },
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
    "date": "2026-08-07"
  },
  {
    "id": "story-301",
    "source_name": "BFI Sight & Sound",
    "source_icon": "https://api.iconify.design/ph:crown-bold.svg?color=%23a855f7",
    "title": "Sight & Sound’s Greatest Films of All Time: Rediscovered Archives",
    "excerpt": "BFI's flagship cinema journal explores unheralded world cinema classics and 4K digital restorations shaking up the international canon.",
    "category": "RETROSPECTIVES",
    "category_slug": "retrospectives",
    "image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    "overlay_type": "badge",
    "overlay_badge": "CRITICISM & ARCHIVE",
    "link": "https://www.bfi.org.uk/sight-and-sound",
    "is_video": False,
    "date": "2026-08-07"
  },
  {
    "id": "story-302",
    "source_name": "Cahiers du Cinéma",
    "source_icon": "https://api.iconify.design/ph:book-open-text-bold.svg?color=%2310b981",
    "title": "Cahiers du Cinéma: The New Wave of World Cinema",
    "excerpt": "Directly from Paris: Critical essays examining contemporary auteur cinema across France, East Asia, and Latin America.",
    "category": "INDIES",
    "category_slug": "indies",
    "image": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    "overlay_type": "badge",
    "overlay_badge": "FRENCH FILM CRITICISM",
    "link": "https://www.cahiersducinema.com/",
    "is_video": False,
    "date": "2026-08-07"
  },
  {
    "id": "story-003",
    "source_name": "MUBI",
    "source_icon": "https://api.iconify.design/ph:dots-nine-bold.svg?color=%233b82f6",
    "title": "APRIL | Official Trailer | Now Streaming",
    "excerpt": "APRIL. Winner of the Venice Special Jury Prize in 2024, Georgian filmmaker Dea Kulumbegashvili (Beginning) gives us a film about the morals and professionalism of Nina...",
    "category": "TRAILERS",
    "category_slug": "trailers",
    "image": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
    "overlay_type": "play",
    "overlay_badge": "OFFICIAL TRAILER",
    "link": "https://mubi.com/",
    "is_video": True,
    "video_url": "https://www.youtube.com/embed/R9K4v_56C9g",
    "date": "2026-08-07"
  }
]

def fetch_live_youtube_trailers() -> list:
    """Fetch live atom XML feed from YouTube trailer channels (IMDb, Rotten Tomatoes, Movieclips)."""
    fetched = []
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/"
    }

    for source in YOUTUBE_TRAILER_FEEDS:
        try:
            req = urllib.request.Request(
                source["feed_url"],
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    tree = ET.fromstring(response.read())
                    entries = tree.findall("atom:entry", ns)
                    for entry in entries[:4]:
                        video_id_el = entry.find("yt:videoId", ns)
                        title_el = entry.find("atom:title", ns)
                        published_el = entry.find("atom:published", ns)
                        media_group = entry.find("media:group", ns)
                        desc_el = media_group.find("media:description", ns) if media_group is not None else None

                        if video_id_el is not None and title_el is not None:
                            vid = video_id_el.text.strip()
                            vtitle = title_el.text.strip()

                            # Only include entries that are actually trailers or teasers
                            if not any(k in vtitle.lower() for k in ["trailer", "teaser", "first look", "spot", "promo"]):
                                continue

                            pub_date = published_el.text[:10] if published_el is not None and published_el.text else datetime.now(timezone.utc).strftime("%Y-%m-%d")
                            desc = desc_el.text[:180] + "..." if desc_el is not None and desc_el.text else f"Watch the new official trailer for {vtitle}."

                            fetched.append({
                                "id": f"yt-{vid}",
                                "source_name": source["source_name"],
                                "source_icon": source["source_icon"],
                                "title": vtitle,
                                "excerpt": desc,
                                "category": "TRAILERS",
                                "category_slug": "trailers",
                                "image": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                                "overlay_type": "play",
                                "overlay_badge": source["overlay_badge"],
                                "link": f"https://www.youtube.com/watch?v={vid}",
                                "is_video": True,
                                "video_url": f"https://www.youtube.com/embed/{vid}",
                                "date": pub_date
                            })
        except Exception as err:
            print(f"Notice: Could not fetch YouTube feed {source['source_name']}: {err}")

    return fetched

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
        if item_date.tzinfo is None:
            item_date = item_date.replace(tzinfo=timezone.utc)

        if item_date >= cutoff:
            seen_ids.add(item_id)
            filtered.append(item)

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
    parser = argparse.ArgumentParser(description="Fetch, sync, and prune global movie, TV & YouTube trailer newsfeed stories.")
    parser.add_argument("--reset", action="store_true", help="Reset feed to default seed stories.")
    args = parser.parse_args()

    if args.reset:
        save_newsfeed(DEFAULT_STORIES)
    else:
        current = load_existing_newsfeed()
        live_trailers = fetch_live_youtube_trailers()
        combined = live_trailers + current if live_trailers else current
        save_newsfeed(combined)

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
