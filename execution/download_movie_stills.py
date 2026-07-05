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

def distribute_images(content, image_urls, movie_name):
    # Check if images are already injected
    if '![' in content:
        return content
        
    paras = content.split('\n\n')
    n = len(paras)
    
    # If article is too short, just append
    if n < 4:
        appended = '\n\n'.join(f"![{movie_name} Still]({url})" for url in image_urls)
        return content + '\n\n' + appended
        
    # Distribute: insert from bottom up to preserve indices
    paras.insert(2 * n // 3, f"![{movie_name} Still]({image_urls[1]})")
    paras.insert(n // 3, f"![{movie_name} Still]({image_urls[0]})")
    paras.append(f"![{movie_name} Still]({image_urls[2]})")
    
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
    
    for art in articles:
        query = art.get('movie_query')
        art_id = art.get('id')
        
        if not query:
            continue
            
        # Skip if stills already exist or are in the content
        content = art.get('content', '')
        if f"stills_{art_id}_" in content or '![' in content:
            continue
            
        print(f"Enriching article '{art.get('title')}' with stills for query '{query}'...")
        
        movie_id = search_movie(query, api_key)
        if not movie_id:
            continue
            
        paths = fetch_movie_stills(movie_id, api_key)
        if not paths:
            print(f"  No stills found for '{query}'.")
            continue
            
        downloaded_urls = []
        for i, file_path in enumerate(paths, 1):
            out_name = f"stills_{art_id}_{i}.webp"
            web_url = download_and_convert_image(file_path, out_name)
            if web_url:
                downloaded_urls.append(web_url)
                
        if len(downloaded_urls) >= 3:
            art['content'] = distribute_images(content, downloaded_urls, query)
            updated = True
            print(f"  Successfully enriched article {art_id} with 3 stills from TMDb!")
            
    if updated:
        with open(JOURNAL_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print("Successfully updated journal.json with movie stills!")
    else:
        print("No movie stills enrichment was performed.")

if __name__ == '__main__':
    enrich_articles()
