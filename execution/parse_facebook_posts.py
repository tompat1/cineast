#!/usr/bin/env python3
"""
parse_facebook_posts.py
-----------------------
Parses scraped Facebook JSON data and extracts text posts and local images suitable for journal articles.
Outputs cleaned, structured JSON to data/articles_output.json.

Usage: python3 execution/parse_facebook_posts.py
"""

import json
import os
import sys
import re
import time
import urllib.request
from datetime import datetime, timedelta

try:
    from PIL import Image
except ImportError:
    Image = None

INPUT_PATH = "data/facebook_export.json"
OUTPUT_PATH = "data/articles_output.json"
ASSETS_DIR = "public/assets/journal-images/facebook-assets/386201384739926"
ASSETS_BASE_URL = "/assets/journal-images/facebook-assets/386201384739926"
MIN_LENGTH = 10  # Reduced to allow posts with mostly images


def parse_scraped_date(timestamp_str, scraped_at_str):
    """Calculates absolute date from relative timestamp and scrapedAt."""
    try:
        scraped_dt = datetime.strptime(scraped_at_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        try:
            scraped_dt = datetime.strptime(scraped_at_str, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            scraped_dt = datetime.now()

    if not timestamp_str:
        dt = scraped_dt
    else:
        # e.g., "3d", "5h", "2w", "1m", "1y"
        match = re.match(r"(\d+)([a-zA-Z]+)", timestamp_str.strip())
        if match:
            val = int(match.group(1))
            unit = match.group(2).lower()
            
            delta = timedelta()
            if 'm' in unit and 'min' not in unit: # month
                delta = timedelta(days=val * 30)
            elif 'y' in unit:
                delta = timedelta(days=val * 365)
            elif 'w' in unit:
                delta = timedelta(weeks=val)
            elif 'd' in unit:
                delta = timedelta(days=val)
            elif 'h' in unit:
                delta = timedelta(hours=val)
            elif 'min' in unit:
                delta = timedelta(minutes=val)
                
            dt = scraped_dt - delta
        else:
            # Try parsing as direct date (e.g., "July 4") just in case
            try:
                # Naive attempt
                dt = datetime.strptime(f"{timestamp_str} {scraped_dt.year}", "%B %d %Y")
                if dt > scraped_dt:
                    dt = dt.replace(year=dt.year - 1)
            except ValueError:
                dt = scraped_dt

    return {
        "date_original": dt.isoformat() + "Z",
        "date_display": dt.strftime("%b %d, %Y").upper(),
        "year": dt.year,
    }


def get_local_images(post_id):
    """Finds local images for a given post ID."""
    clean_id = post_id.replace("/", "_").strip("_")
    folder_path = os.path.join(ASSETS_DIR, clean_id)
    
    images = []
    if os.path.exists(folder_path) and os.path.isdir(folder_path):
        for filename in sorted(os.listdir(folder_path)):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
                images.append(f"{ASSETS_BASE_URL}/{clean_id}/{filename}")
    return images


def fetch_og_data(url, post_id):
    """Fetches og:image and og:description from a URL if local data is missing."""
    clean_id = post_id.replace("/", "_").strip("_")
    dir_path = os.path.join(ASSETS_DIR, clean_id)
    
    # Check if we already downloaded it previously to avoid re-fetching
    if os.path.exists(dir_path):
        for filename in os.listdir(dir_path):
            if filename.startswith('og_image_'):
                return f"{ASSETS_BASE_URL}/{clean_id}/{filename}", None
                
    # If the URL is just facebook.com it might block, but we try anyway with a generic user agent
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8', errors='ignore')
        img_match = re.search(r'\"og:image\"\s+content=\"([^\"]+)\"', html)
        desc_match = re.search(r'\"og:description\"\s+content=\"([^\"]+)\"', html)
        
        desc = desc_match.group(1).replace('&amp;', '&') if desc_match else None
        
        if img_match:
            img_url = img_match.group(1).replace('&amp;', '&')
            os.makedirs(dir_path, exist_ok=True)
            img_path = os.path.join(dir_path, 'og_image_thumbnail.jpg')
            webp_path = os.path.join(dir_path, 'og_image_thumbnail.webp')
            urllib.request.urlretrieve(img_url, img_path)
            if Image:
                with Image.open(img_path) as image:
                    image.save(webp_path, 'WEBP', quality=85)
                os.remove(img_path)
                img_filename = 'og_image_thumbnail.webp'
            else:
                img_filename = 'og_image_thumbnail.jpg'
            
            time.sleep(1) # Be nice to servers
            return f"{ASSETS_BASE_URL}/{clean_id}/{img_filename}", desc
    except Exception as e:
        print(f"  [!] Failed to fetch OG data for {url}: {e}")
        
    return None, None




def main():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: {INPUT_PATH} not found.")
        sys.exit(1)

    print(f"Reading {INPUT_PATH}...")
    with open(INPUT_PATH, "r", encoding="utf-8-sig") as f:
        raw = json.load(f)

    posts = raw if isinstance(raw, list) else raw.get("posts", [])

    print(f"Found {len(posts)} total posts. Processing...")

    articles = []
    skipped = 0

    for post in posts:
        post_id = post.get("postId")
        text = post.get("text", "")
        post_url = post.get("postUrl", "") or post.get("videoUrl", "")
        timestamp_str = post.get("timestamp", "")
        scraped_at_str = post.get("scrapedAt", "")
        
        if not post_id:
            skipped += 1
            continue
            
        local_images = get_local_images(post_id)
        
        # Fallback: if no local images were scraped but there's a link, fetch Open Graph data
        if not local_images and post_url:
            og_img, og_desc = fetch_og_data(post_url, post_id)
            if og_img:
                local_images.append(og_img)
            if not text and og_desc:
                text = og_desc
        
        # Build raw text content
        content_parts = []
        if text:
            content_parts.append(text.strip())
            
        if post_url:
            content_parts.append(f"\nOriginal Link: {post_url}")
            
        for img_url in local_images:
            content_parts.append(f"\n![Archive Image]({img_url})")
            
        raw_text = "\n".join(content_parts)

        has_text = len(text.strip()) >= 5
        has_images = len(local_images) > 0
        has_link = bool(post_url)
        
        if not has_text and not has_images and not has_link:
            skipped += 1
            continue

        date_info = parse_scraped_date(timestamp_str, scraped_at_str)

        articles.append({
            "id": f"entry_{len(articles) + 1:03d}",
            "raw_text": raw_text,
            "title": "",
            "excerpt": "",
            "body": "",
            "tags": [],
            "read_time": "",
            **date_info,
        })

    articles.sort(key=lambda x: x["date_original"], reverse=True)

    os.makedirs("data", exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"\nDone!")
    print(f"  Extracted: {len(articles)} articles (with image linking)")
    print(f"  Skipped:   {skipped} posts (too short or invalid)")
    print(f"  Output:    {OUTPUT_PATH}")
    print(f"\nNext step: python3 execution/rewrite_articles.py")


if __name__ == "__main__":
    main()
