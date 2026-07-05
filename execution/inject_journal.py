#!/usr/bin/env python3
"""
inject_journal.py
-----------------
Reads parsed Facebook posts from data/articles_output.json and generates HTML.
Injects the generated HTML into index.html, replacing the contents of the 
shorts carousel track.

Usage: python3 execution/inject_journal.py
"""

import json
import os
import re
import shutil
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

DATA_PATH = "data/articles_output.json"
PUBLIC_DATA_DIR = "public/data"
PUBLIC_DATA_PATH = os.path.join(PUBLIC_DATA_DIR, "articles.json")
INDEX_PATH = "index.html"

import glob

placeholders = sorted(glob.glob("public/assets/images/cineast_placeholder_*.png"))
placeholders = [p.replace("public", "") for p in placeholders]
p_idx = 0

def extract_image(text):
    """Extracts the first markdown image URL from the text."""
    global p_idx
    match = re.search(r'!\[.*?\]\((.*?)\)', text)
    if match:
        return match.group(1)
    
    if placeholders:
        img = placeholders[p_idx % len(placeholders)]
        p_idx += 1
        return img
    return "/assets/images/journal_feature.webp"  # Fallback image

def clean_text(text):
    """Removes markdown images and links for plain text excerpt."""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'Original Link:.*', '', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = text.replace('\\n', ' ')
    text = re.sub(r'\n+', ' ', text)
    return text.strip()

def generate_short_html(article, entry_num, array_index):
    img_url = extract_image(article['raw_text'])
    article['feature_image'] = img_url
    plain_text = clean_text(article['raw_text'])
    
    words = plain_text.split()
    title = " ".join(words[:4]) + "..." if len(words) > 4 else plain_text
    excerpt = " ".join(words[4:15]) + "..." if len(words) > 15 else " ".join(words[4:])
    if not title:
        title = "Archive Photo"
    
    # Escape quotes for HTML attributes
    title_escaped = title.replace('"', '&quot;')
    
    platform = article.get('platform', 'facebook')
    icon_html = ""
    if platform == "facebook":
        icon_html = '<div class="short-platform-icon fb-icon"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>'
    elif platform == "letterboxd":
        icon_html = '<div class="short-platform-icon lb-icon"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="5" cy="12" r="3.2"/><circle cx="12" cy="12" r="3.2"/><circle cx="19" cy="12" r="3.2"/></svg></div>'
    elif platform == "x":
        icon_html = '<div class="short-platform-icon x-icon"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>'

    html = f"""            <article class="short-card" data-index="{array_index}" data-platform="{platform}">
              <div class="short-image-wrap">
                {icon_html}
                <img src="{img_url}" alt="{title_escaped}" />
              </div>
              <div class="short-content">
                <div class="short-meta">{article['date_display']}</div>
                <h4 class="short-title">{title_escaped}</h4>
                <p class="short-excerpt">{excerpt}</p>
              </div>
            </article>"""
    return html

def fetch_letterboxd_rss(username):
    url = f"https://letterboxd.com/{username}/rss/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Error fetching Letterboxd: {e}")
        return []
    
    root = ET.fromstring(xml_data)
    items = []
    
    for item in root.findall('./channel/item'):
        title = item.find('title').text
        link = item.find('link').text
        pubDate = item.find('pubDate').text
        desc = item.find('description').text
        
        try:
            dt = datetime.strptime(pubDate[:-6].strip(), "%a, %d %b %Y %H:%M:%S")
            date_sort = dt.strftime("%Y-%m-%dT%H:%M:%S")
            date_display = dt.strftime("%b %d, %Y").upper()
        except Exception:
            date_sort = ""
            date_display = pubDate
            
        raw_text = f"**{title}**\n\n"
        
        # Extract paragraphs from HTML
        paragraphs = re.findall(r'<p>(.*?)</p>', desc, flags=re.DOTALL|re.IGNORECASE)
        for p in paragraphs:
            img_match = re.search(r'<img[^>]+src="(.*?)"', p)
            if img_match:
                raw_text += f"![Poster]({img_match.group(1)})\n\n"
            else:
                p_text = re.sub(r'<[^>]+>', '', p).strip()
                if p_text:
                    raw_text += p_text + "\n\n"
            
        raw_text += f"Original Link: {link}"
        
        items.append({
            "raw_text": raw_text,
            "date_display": date_display,
            "date_sort": date_sort,
            "platform": "letterboxd"
        })
        
    return items

def main():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        articles = json.load(f)

    if not articles:
        print("No articles found.")
        return

    print(f"Loaded {len(articles)} Facebook articles.")

    # Tag existing articles
    for a in articles:
        if 'platform' not in a:
            a['platform'] = 'facebook'

    # Fetch Letterboxd
    lb_items = fetch_letterboxd_rss("tompat1")
    if lb_items:
        print(f"Loaded {len(lb_items)} Letterboxd items.")
        articles.extend(lb_items)
        
    # Sort all by date desc
    articles.sort(key=lambda x: x.get('date_sort', ''), reverse=True)

    # Generate HTML (this also populates feature_image in the articles)
    total = len(articles)
    
    shorts_html_parts = []
    # We will iterate through all articles
    for i, article in enumerate(articles):
        entry_num = total - i
        shorts_html_parts.append(generate_short_html(article, entry_num, i))

    # Save the merged and sorted articles to public folder
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
    with open(PUBLIC_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(articles)} merged items to {PUBLIC_DATA_PATH}")
    
    # Duplicate the entire list of cards once to allow for infinite JS scrolling
    duplicated_parts = shorts_html_parts + shorts_html_parts
    shorts_html = "\n".join(duplicated_parts)

    # Inject into index.html
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the shorts-carousel-track and replace its contents
    start_str = '<div class="shorts-carousel-track" id="shorts-track">'
    end_str = '</div>\n          <!-- END SHORTS TRACK -->'
    
    start_idx = content.find(start_str)
    
    if start_idx == -1:
        print("Error: Could not find shorts-track in index.html")
        return
        
    start_idx += len(start_str) # move past the start string
    end_idx = content.find(end_str, start_idx)
    
    if end_idx == -1:
        print("Error: Could not find end of shorts-track in index.html")
        return
        
    # Inject
    new_content = content[:start_idx] + "\n" + shorts_html + "\n          " + content[end_idx:]
    
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Successfully injected {len(articles)} articles into {INDEX_PATH}")

if __name__ == "__main__":
    main()
