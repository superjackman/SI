"""One 1200x630 PNG per derivation station, for s/*/ Open Graph tags and the in-app share card.
   Flat colours, quantized, so the files stay small. Run from web/: python3 scripts/og-stations.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

web = Path(__file__).resolve().parents[1]
st = json.loads((web / 'src/dv/zh-st.json').read_text())['st']
en = json.loads((web / 'src/dv/en-st.json').read_text())['st']
keys = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16']
out = web / 'public' / 'og-st'
out.mkdir(parents=True, exist_ok=True)
font_b = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 72)
font_m = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 36)
font_s = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', 28)

def clip(s, n):
    s = ' '.join(s.split())
    return s if len(s) <= n else s[: n - 1] + '…'

for i, k in enumerate(keys):
    im = Image.new('RGB', (1200, 630), '#0b1230')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((48, 48, 1152, 582), 28, fill='#101a3d', outline='#c99a2e', width=3)
    d.rectangle((80, 92, 280, 148), fill='#ffd77a')
    title = st[i]['n']
    sub = en[i]['n']
    hook = clip(st[i].get('ly', {}).get('hook') or st[i].get('s') or '', 42)
    d.text((96, 100), f'{k}', fill='#1a1204', font=font_s)
    d.text((80, 190), title, fill='#ffffff', font=font_b)
    d.text((80, 290), sub, fill='#9cc8ff', font=font_m)
    d.text((80, 380), hook, fill='#e6eeff', font=font_m)
    d.text((80, 500), '大白话拆解 AI', fill='#ffd77a', font=font_m)
    q = im.quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q.save(out / f'{k}.png', optimize=True)
print(f'wrote {len(keys)} og-st pngs')
