from PIL import Image
import os

def resize_image(input_path, output_path, size):
    """Resize image to specified size while maintaining aspect ratio."""
    with Image.open(input_path) as img:
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Create a new image with transparent background
        new_img = Image.new('RGBA', size, (0, 0, 0, 0))
        
        # Calculate position to center the image
        img.thumbnail(size, Image.Resampling.LANCZOS)
        position = ((size[0] - img.size[0]) // 2, (size[1] - img.size[1]) // 2)
        
        # Paste the resized image onto the center of the new image
        new_img.paste(img, position, img)
        
        # Save the result
        new_img.save(output_path, 'PNG')
        print(f"Created {output_path} with size {size}")

def main():
    # Create professor directory if it doesn't exist
    professor_dir = os.path.join('img', 'professor')
    os.makedirs(professor_dir, exist_ok=True)
    
    # Input image path
    input_image = os.path.join('img', 'professor_tempo.png')
    
    # Define sizes and output paths
    sizes = {
        '240x240': (240, 240),
        '48x48': (48, 48),
        '32x32': (32, 32)
    }
    
    # Process each size
    for size_name, size in sizes.items():
        output_path = os.path.join(professor_dir, f'professor_tempo_{size_name}.png')
        resize_image(input_image, output_path, size)

if __name__ == '__main__':
    main() 