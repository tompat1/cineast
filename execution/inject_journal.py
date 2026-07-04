#!/usr/bin/env python3
"""
inject_journal.py
-----------------
Reads parsed Facebook posts from data/articles_output.json and generates HTML.
Injects the generated HTML into index.html, replacing the existing journal grid.
Saves a copy to public/data/articles.json for frontend fetching.

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

def generate_featured_html(article, entry_num, array_index):
    img_url = extract_image(article['raw_text'])
    plain_text = clean_text(article['raw_text'])
    
    words = plain_text.split()
    title = " ".join(words[:5]) + "..." if len(words) > 5 else plain_text
    excerpt = " ".join(words[5:30]) + "..." if len(words) > 30 else " ".join(words[5:])
    if not title:
        title = "Archive Photo"
    
    html = f"""            <!-- Featured Entry -->
            <article class="journal-card featured" data-index="{array_index}">
              <div class="card-bg">
                <img src="{img_url}" alt="{title}" />
                <div class="card-overlay"></div>
              </div>
              <div class="card-content">
                <div class="entry-label">ARCHIVE ENTRY {entry_num:03d}</div>
                <h3 class="entry-title">{title}</h3>
                <div class="entry-meta">{article['date_display']} / RAW NOTES</div>
                <p class="entry-excerpt">{excerpt}</p>
                <button class="btn-text" aria-label="Read Entry">READ ENTRY {entry_num:03d} &rarr;</button>
              </div>
            </article>"""
    return html

def generate_secondary_html(article, entry_num, array_index):
    img_url = extract_image(article['raw_text'])
    plain_text = clean_text(article['raw_text'])
    
    words = plain_text.split()
    title = " ".join(words[:4]) + "..." if len(words) > 4 else plain_text
    excerpt = " ".join(words[4:20]) + "..." if len(words) > 20 else " ".join(words[4:])
    if not title:
        title = "Archive Photo"
    
    html = f"""              <article class="journal-card secondary" data-index="{array_index}">
                <div class="card-image-wrap">
                  <img src="{img_url}" alt="{title}" />
                </div>
                <div class="card-content">
                  <div class="entry-label">ARCHIVE ENTRY {entry_num:03d}</div>
                  <h4 class="entry-title">{title}</h4>
                  <div class="entry-meta">{article['date_display']}</div>
                  <p class="entry-excerpt">{excerpt}</p>
                  <button class="btn-text" aria-label="Read Entry">&rarr;</button>
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
    featured_html = generate_featured_html(articles[0], total, 0)
    
    secondary_html_parts = []
    for i, article in enumerate(articles[1:7]): # Limit to 6 secondary posts to avoid a huge page
        array_index = i + 1
        entry_num = total - array_index
        secondary_html_parts.append(generate_secondary_html(article, entry_num, array_index))
    
    secondary_html = "\n".join(secondary_html_parts)
    
    grid_html = f"""          <div class="journal-grid">
{featured_html}

            <!-- Secondary Entries -->
            <div class="secondary-grid">
{secondary_html}
            </div>
          </div>"""

    # Inject into index.html
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the journal-grid and replace it
    start_str = '<div class="journal-grid">'
    end_str = '<div class="section-footer">'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str, start_idx)
    
    if start_idx == -1 or end_idx == -1:
        print("Error: Could not find journal-grid in index.html")
        return
        
    # Inject
    new_content = content[:start_idx] + grid_html + "\n          \n          " + content[end_idx:]
    
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Successfully injected {min(len(articles), 7)} articles into {INDEX_PATH}")

if __name__ == "__main__":
    main()
