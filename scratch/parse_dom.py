import json
import re
from bs4 import BeautifulSoup

print("Loading DOM...")
try:
    with open('/Users/thomasrynell/proj/cineast/data/facebook_dom.txt', 'r') as f:
        html = f.read()
except Exception as e:
    print('Failed to read DOM:', e)
    exit(1)

soup = BeautifulSoup(html, 'html.parser')

with open('/Users/thomasrynell/proj/cineast/data/facebook_export.json', 'r') as f:
    export_data = json.load(f)

missing_count = 0
patched_count = 0

for post in export_data:
    if not post.get('postUrl') and not post.get('videoUrl') and post.get('text'):
        missing_count += 1
        text_snippet = post['text'][:40].replace('\n', ' ').strip()
        print(f'Looking for: {text_snippet}')
        
        # Find all elements that contain the snippet
        elements = soup.find_all(string=re.compile(re.escape(text_snippet[:20]), re.IGNORECASE))
        for el in elements:
            parent = el.parent
            # go up 10 levels to find links
            for _ in range(10):
                if parent:
                    links = parent.find_all('a', href=True)
                    for link in links:
                        href = link['href']
                        if '/posts/' in href or '/permalink/' in href or '/reel/' in href:
                            clean_url = 'https://www.facebook.com' + href if href.startswith('/') else href
                            clean_url = clean_url.split('?')[0]
                            print(f'  -> Found URL! {clean_url}')
                            post['postUrl'] = clean_url
                            patched_count += 1
                            break
                    if post.get('postUrl'):
                        break
                    parent = parent.parent
            if post.get('postUrl'):
                break

print(f'Missing: {missing_count}, Patched: {patched_count}')

if patched_count > 0:
    with open('/Users/thomasrynell/proj/cineast/data/facebook_export.json', 'w') as f:
        json.dump(export_data, f, indent=2)
    print('Saved patched facebook_export.json')
