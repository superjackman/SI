"""R16: renders web/public/og.png (1200x630 link-preview image) from the site title and description only.
Run: python3 scripts/og-image.py   (needs Pillow + Noto Sans CJK)."""
from PIL import Image, ImageDraw, ImageFont
import os
W, H = 1200, 630
F = '/usr/share/fonts/opentype/noto/NotoSansCJK-%s.ttc'
img = Image.new('RGB', (W, H), '#4f46e5')
d = ImageDraw.Draw(img)
for y in range(H):  # vertical gradient indigo -> deep indigo
    t = y / H; d.line([(0, y), (W, y)], fill=(int(79 - 49 * t), int(70 - 43 * t), int(229 - 154 * t)))
d.rounded_rectangle([80, 90, 200, 210], 28, fill='white')
d.text((140, 150), 'AI', font=ImageFont.truetype(F % 'Bold', 64, index=2), fill='#4f46e5', anchor='mm')
d.text((80, 250), '大白话拆解 AI', font=ImageFont.truetype(F % 'Bold', 92, index=2), fill='white')
d.text((80, 372), 'AI, explained plainly', font=ImageFont.truetype(F % 'Regular', 48, index=2), fill='#c7d2fe')
sub = ImageFont.truetype(F % 'Regular', 34, index=2)
d.text((80, 468), '一句话让 AI 干活的软件：从 Agent 应用', font=sub, fill='#e0e7ff')
d.text((80, 516), '到 Transformer 内部，再到训练与算力', font=sub, fill='#e0e7ff')
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'og.png')
img.save(out, optimize=True)
print(out, os.path.getsize(out))
