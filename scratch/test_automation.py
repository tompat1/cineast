import json
import os
import subprocess

path = 'public/data/journal.json'

def main():
    print("--- STARTING AUTOMATION TEST ---")
    
    # 1. Read original data
    with open(path, 'r', encoding='utf-8') as f:
        original_data = json.load(f)
        
    # 2. Find article 003 and inject test images
    test_data = json.load(open(path))
    for item in test_data:
        if item['id'] == '003':
            # Append two test images
            item['content'] += "\n\n![Test Image 1](/assets/images/journal_film.webp)\n\n![Test Image 2](/assets/images/journal_room.webp)"
            break
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2)
        
    print("Injected dummy images into article 003 content.")
    
    # 3. Run pipeline
    print("Running inject_journal.py pipeline...")
    subprocess.run(["python3", "execution/inject_journal.py"], check=True)
    
    # 4. Verify output files
    collage_path = 'public/assets/images/collage_article_003.webp'
    print(f"Checking if {collage_path} exists: {os.path.exists(collage_path)}")
    
    # Read modified journal.json
    with open(path, 'r', encoding='utf-8') as f:
        modified_data = json.load(f)
    for item in modified_data:
        if item['id'] == '003':
            print(f"Updated cover image reference for ID 003: {item['image']}")
            break
            
    # 5. Restore original data
    print("Restoring original journal.json...")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(original_data, f, indent=2)
        
    # Remove generated test collage
    if os.path.exists(collage_path):
        os.remove(collage_path)
        print(f"Removed temporary test collage {collage_path}.")
        
    # Re-run pipeline to clean up cards
    print("Re-running inject_journal.py pipeline to restore clean states...")
    subprocess.run(["python3", "execution/inject_journal.py"], check=True)
    
    print("--- AUTOMATION TEST FINISHED ---")

if __name__ == '__main__':
    main()
