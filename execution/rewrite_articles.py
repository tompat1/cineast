#!/usr/bin/env python3
"""
rewrite_articles.py
-------------------
Reads raw articles from data/articles_output.json and uses OpenAI ChatGPT to rewrite them 
into polished CINEAST journal entries.
Outputs to data/articles_final.json incrementally (checkpointing).

Usage: python3 execution/rewrite_articles.py
"""

import json
import os
import sys
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
API_KEY = os.environ.get("OPENAI_API_KEY")

if not API_KEY:
    print("ERROR: OPENAI_API_KEY not found in .env file.")
    sys.exit(1)

client = OpenAI(api_key=API_KEY)

SYSTEM_PROMPT = """You are the editorial voice of CINEAST — a cinematic lifestyle journal.
Your writing is: intentional, intimate, atmospheric. Quiet intelligence over noise.
Film references, light, shadow, memory, and slowness are your subjects.
You write like someone who notices what others walk past.

Transform the raw post below into a polished CINEAST journal entry.

IMPORTANT INSTRUCTIONS:
- Retain all original Markdown image links (e.g., ![Archive Image](/assets/...)) exactly as they appear in the raw text. Integrate them naturally into the body.
- Retain any original URLs and format them as Markdown links if appropriate.
- Do not invent new facts.

Return a JSON object with exactly these keys:
- title: A short, evocative title (max 8 words)
- excerpt: One sentence teaser (max 20 words), cinematic and intriguing
- body: The rewritten article (2-4 paragraphs, preserve the original ideas but elevate the prose)
- tags: Array of 2-3 lowercase tags (e.g. "visual essay", "midnight notes", "on film")
- read_time: Estimated read time as string e.g. "4 MIN READ"
"""

INPUT_PATH = "data/articles_output.json"
CHECKPOINT_PATH = "data/articles_final.json"


def rewrite_article(raw_text):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Raw post:\n{raw_text}"}
            ],
            response_format={ "type": "json_object" },
            temperature=0.7
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"  WARNING: AI rewrite failed — {e}")
        return None


def load_checkpoint():
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH, "r") as f:
            return json.load(f)
    return []


def save_checkpoint(articles):
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)


def main():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: {INPUT_PATH} not found. Run parse_facebook_posts.py first.")
        sys.exit(1)

    with open(INPUT_PATH, "r") as f:
        articles = json.load(f)

    processed_articles = load_checkpoint()
    processed_ids = {a["id"] for a in processed_articles}

    print(f"Total articles: {len(articles)}")
    print(f"Already processed: {len(processed_ids)}")
    print(f"Remaining: {len(articles) - len(processed_ids)}\n")

    for i, article in enumerate(articles):
        if article["id"] in processed_ids:
            continue

        preview = article["raw_text"][:60].replace('\n', ' ') + "..."
        print(f"  [{i+1}/{len(articles)}] Rewriting: {article['date_display']} — {preview}")

        rewritten = rewrite_article(article["raw_text"])
        
        if rewritten:
            # Merge rewritten content with original metadata
            final_article = {**article, **rewritten}
            processed_articles.append(final_article)
            # Sort chronologically (newest first)
            processed_articles.sort(key=lambda x: x["date_original"], reverse=True)
            save_checkpoint(processed_articles)
            
            # Brief pause to respect rate limits
            time.sleep(1)
        else:
            # If it failed (e.g. rate limit), break so we can resume later
            break

    print(f"\nDone! {len(processed_articles)} articles written to {CHECKPOINT_PATH}")
    print("Next step: python3 execution/inject_journal.py")


if __name__ == "__main__":
    main()
