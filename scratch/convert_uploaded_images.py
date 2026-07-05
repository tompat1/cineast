from PIL import Image
import os

images = [
    ('/Users/thomasrynell/.gemini/antigravity-ide/brain/06260954-9fa3-4ea5-8295-a0d595bf4a42/media__1783268765582.png', 'bridges_of_madison_county_1.webp'),
    ('/Users/thomasrynell/.gemini/antigravity-ide/brain/06260954-9fa3-4ea5-8295-a0d595bf4a42/media__1783268765601.jpg', 'bridges_of_madison_county_2.webp'),
    ('/Users/thomasrynell/.gemini/antigravity-ide/brain/06260954-9fa3-4ea5-8295-a0d595bf4a42/media__1783268765608.jpg', 'bridges_of_madison_county_3.webp')
]

dest_dir = '/Users/thomasrynell/proj/cineast/public/assets/images'
os.makedirs(dest_dir, exist_ok=True)

for src, name in images:
    dest = os.path.join(dest_dir, name)
    print(f"Converting {src} to {dest}...")
    with Image.open(src) as img:
        img.save(dest, 'webp', quality=85)
        
print("Conversion completed!")
