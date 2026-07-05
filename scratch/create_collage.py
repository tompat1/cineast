from PIL import Image
import os

def crop_and_resize(img, target_width, target_height):
    target_aspect = target_width / target_height
    src_width, src_height = img.size
    src_aspect = src_width / src_height
    
    if src_aspect > target_aspect:
        # Source is wider than target aspect ratio - crop sides
        new_width = int(src_height * target_aspect)
        left = (src_width - new_width) // 2
        img_cropped = img.crop((left, 0, left + new_width, src_height))
    else:
        # Source is taller than target aspect ratio - crop top/bottom
        new_height = int(src_width / target_aspect)
        top = (src_height - new_height) // 2
        img_cropped = img.crop((0, top, src_width, top + new_height))
        
    return img_cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)

def main():
    images_dir = 'public/assets/images'
    canvas_w = 1200
    canvas_h = 675
    
    # 1. Create a black canvas (matches dark theme background border lines)
    canvas = Image.new('RGB', (canvas_w, canvas_h), (0, 0, 0))
    
    # Paths to source images
    img1_path = os.path.join(images_dir, 'bridges_of_madison_county_1.webp')
    img2_path = os.path.join(images_dir, 'bridges_of_madison_county_2.webp')
    img3_path = os.path.join(images_dir, 'bridges_of_madison_county_3.webp')
    
    if not (os.path.exists(img1_path) and os.path.exists(img2_path) and os.path.exists(img3_path)):
        print("Error: Source WebP images not found.")
        return
        
    # Open images
    img1 = Image.open(img1_path)
    img2 = Image.open(img2_path)
    img3 = Image.open(img3_path)
    
    # Left column: 595 width, 675 height
    left_img = crop_and_resize(img1, 595, 675)
    canvas.paste(left_img, (0, 0))
    
    # Top-right panel: 595 width, 332 height
    top_right_img = crop_and_resize(img2, 595, 332)
    canvas.paste(top_right_img, (605, 0))
    
    # Bottom-right panel: 595 width, 333 height
    bottom_right_img = crop_and_resize(img3, 595, 333)
    canvas.paste(bottom_right_img, (605, 342))
    
    # Save the collage
    collage_path = os.path.join(images_dir, 'bridges_of_madison_county_collage.webp')
    canvas.save(collage_path, 'webp', quality=90)
    print(f"Collage created and saved to {collage_path}!")

if __name__ == '__main__':
    main()
