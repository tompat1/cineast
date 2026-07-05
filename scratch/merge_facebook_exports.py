import json
import os
import re

DL_PATH = '/Users/thomasrynell/Downloads/386201384739926_posts_2026-07-05T11-32-31.json'
EXPORT_PATH = '/Users/thomasrynell/proj/cineast/data/facebook_export.json'

def clean_text(text):
    if not text:
        return ""
    # remove punctuation and whitespace
    return re.sub(r'\W+', '', text).lower()

def is_duplicate(p1, p2):
    # Match by postUrl
    u1 = p1.get('postUrl', '').split('?')[0].rstrip('/') if p1.get('postUrl') else ''
    u2 = p2.get('postUrl', '').split('?')[0].rstrip('/') if p2.get('postUrl') else ''
    if u1 and u2 and u1 == u2:
        return True
        
    # Match by videoUrl
    v1 = p1.get('videoUrl', '').split('?')[0].rstrip('/') if p1.get('videoUrl') else ''
    v2 = p2.get('videoUrl', '').split('?')[0].rstrip('/') if p2.get('videoUrl') else ''
    if v1 and v2 and v1 == v2:
        return True
        
    # Match by postId (if not hash)
    id1 = p1.get('postId', '')
    id2 = p2.get('postId', '')
    if id1 and id2 and not id1.startswith('hash_') and not id2.startswith('hash_') and id1 == id2:
        return True
        
    # Match by text similarity
    t1 = clean_text(p1.get('text', ''))
    t2 = clean_text(p2.get('text', ''))
    if t1 and t2:
        # Check if one is a substring of the other and they are reasonably long
        if (len(t1) > 15 and len(t2) > 15) and (t1 in t2 or t2 in t1):
            return True
            
    return False

def merge_posts(p1, p2):
    merged = p1.copy()
    
    # postUrl
    if p2.get('postUrl') and not p1.get('postUrl'):
        merged['postUrl'] = p2['postUrl']
        
    # videoUrl
    if p2.get('videoUrl') and not p1.get('videoUrl'):
        merged['videoUrl'] = p2['videoUrl']
        
    # postId
    id1 = p1.get('postId', '')
    id2 = p2.get('postId', '')
    if id2 and (id1.startswith('hash_') or not id1) and not id2.startswith('hash_'):
        merged['postId'] = id2
        
    # text
    text1 = p1.get('text', '')
    text2 = p2.get('text', '')
    if len(text2) > len(text1):
        merged['text'] = text2
        
    # timestamp
    if p2.get('timestamp') and not p1.get('timestamp'):
        merged['timestamp'] = p2['timestamp']
        
    # imageUrls
    imgs1 = set(p1.get('imageUrls', []))
    imgs2 = set(p2.get('imageUrls', []))
    union_imgs = list(imgs1.union(imgs2))
    merged['imageUrls'] = union_imgs
    merged['totalImages'] = max(p1.get('totalImages', 0), p2.get('totalImages', 0), len(union_imgs))
    
    # scrapedAt
    # Prefer keeping the older scrapedAt if both are set, to preserve the timeline origin
    # unless one has a timestamp and the other doesn't
    s1 = p1.get('scrapedAt', '')
    s2 = p2.get('scrapedAt', '')
    if s2 and not s1:
        merged['scrapedAt'] = s2
        
    # stats
    merged['reactions'] = max(p1.get('reactions', 0), p2.get('reactions', 0))
    merged['comments'] = max(p1.get('comments', 0), p2.get('comments', 0))
    merged['shares'] = max(p1.get('shares', 0), p2.get('shares', 0))
    
    return merged

def main():
    print("Loading datasets...")
    with open(EXPORT_PATH, 'r') as f:
        export_data = json.load(f)
    with open(DL_PATH, 'r') as f:
        new_data = json.load(f)
        
    print(f"Current export size: {len(export_data)}")
    print(f"New scraped size: {len(new_data)}")
    
    merged_list = list(export_data)
    added_count = 0
    updated_count = 0
    
    for new_post in new_data:
        # Try to find a match in the merged_list
        match_idx = -1
        for idx, existing in enumerate(merged_list):
            if is_duplicate(existing, new_post):
                match_idx = idx
                break
                
        if match_idx != -1:
            # Merge
            merged_list[match_idx] = merge_posts(merged_list[match_idx], new_post)
            updated_count += 1
        else:
            # Append
            merged_list.append(new_post)
            added_count += 1
            
    print(f"Added {added_count} new posts, updated {updated_count} existing posts.")
    print(f"Final export size: {len(merged_list)}")
    
    with open(EXPORT_PATH, 'w') as f:
        json.dump(merged_list, f, indent=2)
    print("Saved merged data to facebook_export.json")

if __name__ == '__main__':
    main()
