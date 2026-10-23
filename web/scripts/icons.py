"""R16: app icons for the web manifest / apple-touch-icon (same look as the favicon: white "AI" on indigo).
Run: python3 scripts/icons.py"""
from PIL import Image, ImageDraw, ImageFont
import os
F = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
out = os.path.join(os.path.dirname(__file__), '..', 'public')
def icon(n, name, radius, scale):
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, n - 1, n - 1], int(n * radius), fill='#4f46e5')
    d.text((n / 2, n / 2), 'AI', font=ImageFont.truetype(F, int(n * scale), index=2), fill='white', anchor='mm')
    im.save(os.path.join(out, name), optimize=True)
icon(192, 'icon-192.png', .22, .47); icon(512, 'icon-512.png', .22, .47)
icon(512, 'icon-maskable-512.png', 0, .36)   # full-bleed, glyph inside the 80% safe zone
im = Image.new('RGB', (180, 180), '#4f46e5'); d = ImageDraw.Draw(im)  # iOS rounds the corners itself, no alpha
d.text((90, 90), 'AI', font=ImageFont.truetype(F, 85, index=2), fill='white', anchor='mm'); im.save(os.path.join(out, 'icon-180.png'), optimize=True)
print(sorted(os.listdir(out)))
