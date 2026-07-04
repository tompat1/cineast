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

DATA_PATH = "data/articles_output.json"
PUBLIC_DATA_DIR = "public/data"
PUBLIC_DATA_PATH = os.path.join(PUBLIC_DATA_DIR, "articles.json")
INDEX_PATH = "index.html"

def extract_image(text):
    """Extracts the first markdown image URL from the text."""
    match = re.search(r'!\[.*?\]\((.*?)\)', text)
    if match:
        return match.group(1)
    return "/assets/images/journal_feature.webp"  # Fallback image

def clean_text(text):
    """Removes markdown images and links for plain text excerpt."""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'Original Link:.*', '', text)
    return text.strip()

def generate_short_html(article, entry_num, array_index):
    img_url = extract_image(article['raw_text'])
    plain_text = clean_text(article['raw_text'])
    
    words = plain_text.split()
    title = " ".join(words[:4]) + "..." if len(words) > 4 else plain_text
    excerpt = " ".join(words[4:15]) + "..." if len(words) > 15 else " ".join(words[4:])
    if not title:
        title = "Archive Photo"
    
    # Escape quotes for HTML attributes
    title_escaped = title.replace('"', '&quot;')
    
    html = f"""            <article class="short-card" data-index="{array_index}">
              <div class="short-image-wrap">
                <img src="{img_url}" alt="{title_escaped}" />
              </div>
              <div class="short-content">
                <div class="short-meta">{article['date_display']}</div>
                <h4 class="short-title">{title_escaped}</h4>
                <p class="short-excerpt">{excerpt}</p>
              </div>
            </article>"""
    return html

def main():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        articles = json.load(f)

    if not articles:
        print("No articles found.")
        return

    print(f"Loaded {len(articles)} articles.")

    # Copy to public folder
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
    shutil.copyfile(DATA_PATH, PUBLIC_DATA_PATH)
    print(f"Copied data to {PUBLIC_DATA_PATH}")

    # Generate HTML
    total = len(articles)
    
    shorts_html_parts = []
    # We will iterate through all 17 articles
    for i, article in enumerate(articles):
        entry_num = total - i
        shorts_html_parts.append(generate_short_html(article, entry_num, i))
    
    # Duplicate the entire list of cards once to allow for infinite CSS marquee scrolling
    duplicated_parts = shorts_html_parts + shorts_html_parts
    shorts_html = "\n".join(duplicated_parts)

    # Inject into index.html
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the shorts-carousel-track and replace its contents
    start_str = '<div class="shorts-carousel-track" id="shorts-track">'
    end_str = '</div>\n        </div>\n      </section>'
    
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
        
    print(f"Successfully injected {len(articles)} articles (duplicated for infinite scroll) into {INDEX_PATH}")

if __name__ == "__main__":
    main()
