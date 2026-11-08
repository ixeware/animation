#!/usr/bin/env python3
"""A transparent 1080x1920 watermark for a sponsor's preview copy: diagonal rows of "PREVIEW" and a small label
"PREVIEW · NOT FOR PUBLICATION" at the bottom. Usage: python3 tools/preview_overlay.py overlay.png
Then, from episodes/<ep>/build (two passes; 720p keeps a 85-second video near 16 MB):
  ffmpeg -y -i final.mp4 -i overlay.png -filter_complex "[0:v][1:v]overlay=0:0,scale=720:1280:flags=lanczos" \\
    -c:v libx264 -preset slow -b:v 1350k -pass 1 -passlogfile /tmp/pv -an -f mp4 /dev/null
  ffmpeg -y -i final.mp4 -i overlay.png -filter_complex "[0:v][1:v]overlay=0:0,scale=720:1280:flags=lanczos" \\
    -c:v libx264 -preset slow -b:v 1350k -pass 2 -passlogfile /tmp/pv -c:a aac -b:a 128k -movflags +faststart <name>_PREVIEW.mp4
"""
import sys
from PIL import Image, ImageDraw, ImageFont
W, H = 1080, 1920
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'  # any bold sans will do
big = ImageFont.truetype(F, 120)
tile = Image.new('RGBA', (W * 3, H * 3), (0, 0, 0, 0))
d = ImageDraw.Draw(tile)
text = 'PREVIEW'
tw = d.textlength(text, font=big)
for row, y in enumerate(range(0, H * 3, 420)):
    off = (row % 2) * (tw + 160) / 2
    x = -off
    while x < W * 3:
        d.text((x, y), text, font=big, fill=(255, 255, 255, 46))
        x += tw + 160
tile = tile.rotate(30, resample=Image.BICUBIC)
cx, cy = tile.width // 2, tile.height // 2
out = tile.crop((cx - W // 2, cy - H // 2, cx + W // 2, cy + H // 2))
d2 = ImageDraw.Draw(out)
small = ImageFont.truetype(F, 30)
lab = 'PREVIEW · NOT FOR PUBLICATION'
lw = d2.textlength(lab, font=small)
x0, y0 = (W - lw) / 2 - 22, 1790
d2.rounded_rectangle((x0, y0, x0 + lw + 44, y0 + 56), 14, fill=(0, 0, 0, 150))
d2.text((x0 + 22, y0 + 11), lab, font=small, fill=(255, 255, 255, 235))
out.save(sys.argv[1])
