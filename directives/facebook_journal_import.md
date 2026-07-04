# Directive: Facebook Journal Import Pipeline

## Goal
Transform raw Facebook post export data into polished CINEAST journal articles, injected into the site's journal section with original timestamps preserved.

## Inputs
- `data/facebook_export.json` — Facebook data export (drop file here)
- `data/articles_output.json` — Generated output (auto-created by script)

## Steps

### Step 1: Export from Facebook
1. Go to Facebook → Settings → Your Facebook Information → Download Your Information
2. Select **Format: JSON**, Date range: All time
3. Choose only **Posts** (to keep file size small)
4. Download and extract the zip
5. Find the file: `your_posts/your_posts_1.json` (or similar)
6. Copy it into `data/facebook_export.json` in this project

### Step 2: Run the Parser Script
```bash
python3 execution/parse_facebook_posts.py
```
Filters posts, preserves timestamps, outputs to `data/articles_output.json`.

### Step 3: Run the AI Rewriter Script
```bash
python3 execution/rewrite_articles.py
```
Uses Gemini API to rewrite each post in the CINEAST editorial voice.
Outputs to `data/articles_final.json`.

### Step 4: Inject into Site
```bash
python3 execution/inject_journal.py
```
Updates the journal section of `index.html` with the generated articles.

## Output Format (articles_final.json)
```json
[
  {
    "id": "entry_001",
    "title": "On the Weight of a Still Frame",
    "date_original": "2019-03-14T21:32:00",
    "date_display": "MAR 14, 2019",
    "excerpt": "Notes on slowing down, paying attention...",
    "body": "Full article text...",
    "tags": ["visual essay", "midnight notes"],
    "read_time": "4 MIN READ"
  }
]
```

## Edge Cases
- Posts shorter than 100 characters → skip (likely not articles)
- Posts with no text (links/photos only) → skip
- Duplicate timestamps → keep latest edit
- Facebook timestamps are Unix epoch ms → convert to ISO 8601
- Facebook may encode characters in latin1 → open files with utf-8-sig
