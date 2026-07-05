#!/usr/bin/env python3
"""
compile_collages.py
-------------------
Automatically scans public/data/journal.json for articles.
For each article, it extracts all inline markdown image links (up to 3).
If multiple images are found, it generates a widescreen split-screen WebP collage.
It then updates journal.json and patches index.html card images.
"""

import json
import os
import re
import sys
from PIL import Image

JOURNAL_JSON_PATH = 'public/data/journal.json'
INDEX_HTML_PATH = 'index.html'
IMAGES_DIR = 'public/assets/images'
WEB_ROOT = 'public'

def crop_and_resize(img, target_width, target_height):
    target_aspect = target_width / target_height
    src_width, src_height = img.size
    src_aspect = src_width / src_height
    
    if src_aspect > target_aspect:
        new_width = int(src_height * target_aspect)
        left = (src_width - new_width) // 2
        img_cropped = img.crop((left, 0, left + new_width, src_height))
    else:
        new_height = int(src_width / target_aspect)
        top = (src_height - new_height) // 2
        img_cropped = img.crop((0, top, src_width, top + new_height))
        
    return img_cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)

def generate_collage(art_id, img_paths):
    canvas_w = 1200
    canvas_h = 675
    canvas = Image.new('RGB', (canvas_w, canvas_h), (0, 0, 0))
    
    try:
        opened_imgs = []
        for p in img_paths:
            # Map /assets/... to public/assets/...
            local_path = p.lstrip('/')
            if local_path.startswith('assets/'):
                local_path = os.path.join(WEB_ROOT, local_path)
            
            if os.path.exists(local_path):
                opened_imgs.append(Image.open(local_path))
            else:
                print(f"  WARNING: Image not found: {local_path}")
                
        if len(opened_imgs) == 0:
            return None
            
        if len(opened_imgs) == 1:
            # If only 1 valid image was found, just use it directly
            return img_paths[0]
            
        elif len(opened_imgs) == 2:
            print(f"  Generating 2-image split collage for article {art_id}...")
            # Left: 595 x 675
            img_left = crop_and_resize(opened_imgs[0], 595, 675)
            canvas.paste(img_left, (0, 0))
            # Right: 595 x 675
            img_right = crop_and_resize(opened_imgs[1], 595, 675)
            canvas.paste(img_right, (605, 0))
            
        elif len(opened_imgs) >= 3:
            print(f"  Generating 3-image grid collage for article {art_id}...")
            # Left vertical: 595 x 675
            img_left = crop_and_resize(opened_imgs[0], 595, 675)
            canvas.paste(img_left, (0, 0))
            # Top-Right: 595 x 332
            img_tr = crop_and_resize(opened_imgs[1], 595, 332)
            canvas.paste(img_tr, (605, 0))
            # Bottom-Right: 595 x 333
            img_br = crop_and_resize(opened_imgs[2], 595, 333)
            canvas.paste(img_br, (605, 342))
            
        output_name = f"collage_article_{art_id}.webp"
        output_path = os.path.join(IMAGES_DIR, output_name)
        canvas.save(output_path, 'webp', quality=90)
        return f"/assets/images/{output_name}"
        
    except Exception as e:
        print(f"  ERROR generating collage for {art_id}: {e}")
        return None

def update_index_html(art_id, image_url):
    if not os.path.exists(INDEX_HTML_PATH):
        return
        
    with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Pattern to find the card matching the article ID, then locate the img tag inside it
    # and substitute its source URL.
    pattern = rf'(<a\s+href="/article.html\?id={art_id}"[^>]*>.*?<div\s+class="card-bg">.*?<img\s+src=")(.*?)(")'
    
    match = re.search(pattern, html, flags=re.DOTALL)
    if match:
        old_url = match.group(2)
        if old_url != image_url:
            print(f"  Updating index.html card cover for ID {art_id}: {old_url} -> {image_url}")
            new_html = re.sub(pattern, fr'\g<1>{image_url}\3', html, flags=re.DOTALL)
            with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
                f.write(new_html)
    else:
        print(f"  Card for ID {art_id} not found in index.html.")

def main():
    if not os.path.exists(JOURNAL_JSON_PATH):
        print(f"Error: {JOURNAL_JSON_PATH} not found.")
        sys.exit(1)
        
    with open(JOURNAL_JSON_PATH, 'r', encoding='utf-8') as f:
        articles = json.load(f)
        
    updated = False
    
    for art in articles:
        art_id = art.get('id')
        content = art.get('content', '')
        
        # 1. Parse markdown image tags
        img_urls = re.findall(r'!\[.*?\]\((.*?)\)', content)
        
        # 2. Check if we should build/use collage or set default cover
        if len(img_urls) >= 2:
            collage_url = generate_collage(art_id, img_urls[:3])
            if collage_url:
                if art.get('image') != collage_url:
                    art['image'] = collage_url
                    updated = True
                update_index_html(art_id, collage_url)
        elif len(img_urls) == 1:
            single_img = img_urls[0]
            if art.get('image') != single_img:
                print(f"  Setting single image as cover for ID {art_id}: {single_img}")
                art['image'] = single_img
                updated = True
            update_index_html(art_id, single_img)
            
    if updated:
        with open(JOURNAL_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print("Updated journal.json successfully!")
    else:
        print("No updates needed for journal.json.")

if __name__ == '__main__':
    main()
