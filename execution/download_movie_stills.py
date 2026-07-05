#!/usr/bin/env python3
"""
download_movie_stills.py
------------------------
Checks public/data/journal.json for articles with a "movie_query" field.
If found, searches the TMDb API, downloads the top 3 backdrops/stills,
converts them to WebP, and distributes them inline inside the article content.
"""

import json
import os
import re
import sys
import urllib.request
import urllib.parse

JOURNAL_JSON_PATH = 'public/data/journal.json'
ENV_PATH = '.env'
IMAGES_DIR = 'public/assets/images'
Image = None
IMAGE_PATTERN = re.compile(r'\n{0,2}!\[.*?\]\(.*?\)\n{0,2}')

def get_api_key():
    if not os.path.exists(ENV_PATH):
        return None
    with open(ENV_PATH, 'r') as f:
        content = f.read()
    match = re.search(r'TMDB_API_KEY=["\']?(.*?)["\']?$', content, re.MULTILINE)
    return match.group(1).strip() if match else None

def normalize_title(value):
    value = value.lower()
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()

def select_best_movie(results, query):
    normalized_query = normalize_title(query)

    def score(result):
        title = normalize_title(result.get('title') or result.get('original_title') or '')
        points = 0
        if title == normalized_query:
            points += 100
        elif title.startswith(normalized_query):
            points += 90
        elif normalized_query in title:
            points += 70
        elif title in normalized_query:
            points += 60
        if result.get('backdrop_path'):
            points += 5
        if result.get('release_date'):
            points += 2
        points += float(result.get('popularity') or 0) / 100
        return points

    return max(results, key=score) if results else None

def search_movie(query, api_key):
    encoded_query = urllib.parse.quote(query)
    url = f"https://api.themoviedb.org/3/search/movie?api_key={api_key}&query={encoded_query}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get('results', [])
            if results:
                movie = select_best_movie(results, query)
                return movie['id']
    except Exception as e:
        print(f"  TMDb search failed for '{query}': {e}")
    return None

def fetch_movie_stills(movie_id, api_key):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/images?api_key={api_key}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            backdrops = data.get('backdrops', [])
            # Sort by vote average descending to get the best scenes
            backdrops.sort(key=lambda x: x.get('vote_average', 0), reverse=True)
            return [b['file_path'] for b in backdrops[:3]]
    except Exception as e:
        print(f"  TMDb images fetch failed for movie ID {movie_id}: {e}")
    return []

def split_movie_query(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if not isinstance(value, str) or not value.strip():
        return []
    return [part.strip() for part in re.split(r'\s*(?:\||;|\n)\s*', value) if part.strip()]

def strip_markdown_images(content):
    return IMAGE_PATTERN.sub('\n\n', content).strip()

def extract_mentioned_movie_titles(content):
    content = strip_markdown_images(content)
    titles = []

    # Match markdown-emphasized titles followed by a parenthetical year, e.g.
    # *Paris, Texas* (Wim Wenders, 1984). This avoids most prose false positives.
    pattern = re.compile(r'(?<!\*)\*([^*\n]{2,100})\*\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)')
    for match in pattern.finditer(content):
        title = match.group(1).strip()
        if title:
            titles.append(title)

    return titles

def unique_titles(titles):
    seen = set()
    unique = []
    for title in titles:
        key = normalize_title(title)
        if not key:
            continue
        if key in seen:
            continue
        if any(
            existing.startswith(key + ' ') or
            existing.endswith(' ' + key) or
            key.startswith(existing + ' ') or
            key.endswith(' ' + existing)
            for existing in seen
        ):
            continue
        seen.add(key)
        unique.append(title)
    return unique

def get_movie_titles_for_article(article):
    explicit_titles = split_movie_query(article.get('movie_queries'))
    if not explicit_titles:
        explicit_titles = split_movie_query(article.get('movie_query'))

    mentioned_titles = extract_mentioned_movie_titles(article.get('content', ''))
    return unique_titles(explicit_titles + mentioned_titles)

def download_and_convert_image(file_path, output_name):
    img_url = f"https://image.tmdb.org/t/p/original{file_path}"
    temp_path = output_name + '.temp'
    
    try:
        # Download temp file
        req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(temp_path, 'wb') as out_file:
            out_file.write(response.read())
            
        # Convert to WebP using PIL
        with Image.open(temp_path) as img:
            dest_path = os.path.join(IMAGES_DIR, output_name)
            img.save(dest_path, 'webp', quality=85)
            
        os.remove(temp_path)
        return f"/assets/images/{output_name}"
    except Exception as e:
        print(f"  Failed to download/convert image {img_url}: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
    return None

def distribute_images(content, image_items):
    # Check if images are already injected
    if '![' in content:
        return content

    if not image_items:
        return content
        
    paras = content.split('\n\n')
    n = len(paras)
    
    # If article is too short, just append
    if n < 4:
        appended = '\n\n'.join(f"![{item['title']} Still]({item['url']})" for item in image_items)
        return content + '\n\n' + appended

    inserts = []
    for i, item in enumerate(image_items):
        position = ((i + 1) * n) // (len(image_items) + 1)
        inserts.append((position, f"![{item['title']} Still]({item['url']})"))

    # Insert from bottom up to preserve indices.
    for position, markdown in sorted(inserts, reverse=True):
        paras.insert(position, markdown)
    
    return '\n\n'.join(paras)

def enrich_articles():
    global Image
    api_key = get_api_key()
    if not api_key:
        print("Warning: TMDB_API_KEY not found in .env file. Skipping movie still enrichment.")
        return

    try:
        from PIL import Image as PilImage
        Image = PilImage
    except ImportError:
        print("Warning: Pillow is not installed. Skipping movie still enrichment.")
        return
        
    if not os.path.exists(JOURNAL_JSON_PATH):
        print(f"Error: {JOURNAL_JSON_PATH} not found.")
        return
        
    with open(JOURNAL_JSON_PATH, 'r', encoding='utf-8') as f:
        articles = json.load(f)
        
    updated = False
    
    refresh = '--refresh' in sys.argv

    for art in articles:
        art_id = art.get('id')
        content = art.get('content', '')
        movie_titles = get_movie_titles_for_article(art)
        
        if not movie_titles:
            continue
            
        # Skip if stills already exist or are in the content
        if not refresh and (f"stills_{art_id}_" in content or '![' in content):
            continue

        if refresh:
            content = strip_markdown_images(content)

        stills_per_movie = 3 if len(movie_titles) == 1 else 1
        print(
            f"Enriching article '{art.get('title')}' with "
            f"{stills_per_movie} still(s) for {len(movie_titles)} movie title(s)..."
        )

        downloaded_items = []
        image_index = 1

        for query in movie_titles:
            movie_id = search_movie(query, api_key)
            if not movie_id:
                continue

            paths = fetch_movie_stills(movie_id, api_key)[:stills_per_movie]
            if not paths:
                print(f"  No stills found for '{query}'.")
                continue

            movie_downloads = []
            slug = re.sub(r'[^a-z0-9]+', '_', normalize_title(query)).strip('_')[:40]
            for file_path in paths:
                out_name = f"stills_{art_id}_{image_index}_{slug}.webp"
                image_index += 1
                web_url = download_and_convert_image(file_path, out_name)
                if web_url:
                    item = {"title": query, "url": web_url}
                    movie_downloads.append(item)
                    downloaded_items.append(item)

            if len(movie_downloads) < stills_per_movie:
                print(f"  Only downloaded {len(movie_downloads)} still(s) for '{query}'.")

        if downloaded_items:
            art['content'] = distribute_images(content, downloaded_items)
            updated = True
            print(f"  Successfully enriched article {art_id} with {len(downloaded_items)} stills from TMDb!")
            
    if updated:
        with open(JOURNAL_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print("Successfully updated journal.json with movie stills!")
    else:
        print("No movie stills enrichment was performed.")

if __name__ == '__main__':
    enrich_articles()
