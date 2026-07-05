import json
data = json.load(open('public/data/articles.json'))
total = len(data)
targets = [9, 11, 18, 19, 20, 21, 23]
for t in targets:
    idx = total - t
    if idx >= 0 and idx < total:
        print(f"ENTRY {t:03d} - Platform: {data[idx]['platform']}")
        print(f"raw_text: {repr(data[idx]['raw_text'])}")
        print("---")
