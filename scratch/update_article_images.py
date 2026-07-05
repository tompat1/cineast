import json

path = 'public/data/journal.json'
data = json.load(open(path))

for item in data:
    if item['id'] == '004':
        content = item['content']
        
        target1 = "Perhaps no film understands this better than **The Bridges of Madison County**."
        replace1 = target1 + "\n\n![Bridges of Madison County](/assets/images/bridges_of_madison_county_2.webp)"
        content = content.replace(target1, replace1)
        
        target2 = "In the way someone stands too close. In the unbearable dignity of not taking what the heart wants most."
        replace2 = target2 + "\n\n![Bridges of Madison County](/assets/images/bridges_of_madison_county_1.webp)"
        content = content.replace(target2, replace2)
        
        target3 = "A traffic light. A decision. A hand on the door handle. A life splitting silently in two."
        replace3 = target3 + "\n\n![Bridges of Madison County](/assets/images/bridges_of_madison_county_3.webp)"
        content = content.replace(target3, replace3)
        
        item['content'] = content
        break

with open(path, 'w') as f:
    json.dump(data, f, indent=2)
print("Updated article content successfully!")
