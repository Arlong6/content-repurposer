#!/bin/bash
# Create simple placeholder icons using sips (macOS built-in)
for size in 16 32 48 128; do
  # Create a simple colored PNG using built-in tools
  python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGBA', ($size, $size), (129, 140, 248, 255))
draw = ImageDraw.Draw(img)
# Draw a simple 'R' letter
cx, cy = $size//2, $size//2
r = $size//3
draw.text((cx-r//2, cy-r), 'R', fill='white')
img.save('icon-${size}.png')
" 2>/dev/null || python3 -c "
import struct, zlib
def create_png(w, h, color):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes(color)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
with open('icon-${size}.png', 'wb') as f:
    f.write(create_png($size, $size, (129, 140, 248, 255)))
"
done
