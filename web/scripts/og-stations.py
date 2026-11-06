"""One 1200x630 PNG per derivation station, for s/*/ Open Graph tags and the in-app share card.
   Text stays inside the gold frame: titles and the hook wrap, and a line that still does not fit is clamped.
   Flat colours, quantized, so the files stay small. Run from web/: python3 scripts/og-stations.py
"""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

web = Path(__file__).resolve().parents[1]
st = json.loads((web / 'src/dv/zh-st.json').read_text())['st']
en = json.loads((web / 'src/dv/en-st.json').read_text())['st']
keys = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16']
out = web / 'public' / 'og-st'
out.mkdir(parents=True, exist_ok=True)
FONT = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'
# the gold frame is (48, 48)–(1152, 582); glyphs stay inside this inset
LEFT, RIGHT, TOP, BOTTOM = 84, 1116, 80, 548
MAX_W = RIGHT - LEFT
TOK = re.compile(r'[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F](?:[，。、：；！？）」』”’,.!?:;)]*)|[^\s\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+')

def plain(s):
    s = re.sub(r'⟦[a-z]:([^⟧]*)⟧', r'\1', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'\1', s)
    s = re.sub(r'`([^`]+)`', r'\1', s)
    s = re.sub(r'\{#[^}]+\}', '', s)
    return ' '.join(s.split())

def width(draw, text, font):
    return draw.textlength(text, font=font)

def wrap(draw, text, font, max_w, max_lines):
    parts = TOK.findall(text) or ([text] if text else [])
    lines, cur = [], ''
    for t in parts:
        trial = cur + t
        if width(draw, trial, font) <= max_w or not cur.strip():
            cur = trial
            continue
        lines.append(cur.rstrip())
        cur = t.lstrip()
    if cur.strip():
        lines.append(cur.rstrip())
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        ell = '…'
        while lines[-1] and width(draw, lines[-1] + ell, font) > max_w:
            lines[-1] = lines[-1][:-1]
        lines[-1] = lines[-1].rstrip() + ell
    return [ln for ln in lines if ln]

def fit(draw, text, size, min_size, max_lines):
    for z in range(size, min_size - 1, -2):
        font = ImageFont.truetype(FONT, z)
        lines = wrap(draw, text, font, MAX_W, 99)
        if len(lines) <= max_lines and all(width(draw, ln, font) <= MAX_W + 0.5 for ln in lines):
            return font, lines
    font = ImageFont.truetype(FONT, min_size)
    return font, wrap(draw, text, font, MAX_W, max_lines)

def paint(draw, text, font, x, y, fill, key):
    bb = draw.textbbox((x, y), text, font=font)
    if bb[0] < LEFT - 1 or bb[2] > RIGHT + 1 or bb[1] < TOP - 1 or bb[3] > BOTTOM + 1:
        raise SystemExit(f'{key}: "{text}" spills the card {bb}')
    draw.text((x, y), text, font=font, fill=fill)
    return bb[3]

for i, k in enumerate(keys):
    im = Image.new('RGB', (1200, 630), '#0b1230')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((48, 48, 1152, 582), 28, fill='#101a3d', outline='#c99a2e', width=3)
    y = TOP
    kf = ImageFont.truetype(FONT, 28)
    kw = width(d, k, kf)
    cw, ch = max(72, int(kw + 44)), 48
    d.rounded_rectangle((LEFT, y, LEFT + cw, y + ch), 10, fill='#ffd77a')
    tb = d.textbbox((0, 0), k, font=kf)
    d.text((LEFT + (cw - (tb[2] - tb[0])) / 2 - tb[0], y + (ch - (tb[3] - tb[1])) / 2 - tb[1]), k, font=kf, fill='#1a1204')
    y += ch + 28
    title = plain(st[i]['n'])
    sub = plain(en[i]['n'])
    hook = plain((st[i].get('ly') or {}).get('hook') or st[i].get('s') or '')
    tf, tls = fit(d, title, 64, 40, 2)
    for ln in tls:
        y = paint(d, ln, tf, LEFT, y, '#ffffff', k) + 6
    y += 8
    sf, sls = fit(d, sub, 32, 22, 2)
    for ln in sls:
        y = paint(d, ln, sf, LEFT, y, '#9cc8ff', k) + 4
    y += 18
    brand = '大白话拆解 AI'
    bf = ImageFont.truetype(FONT, 30)
    brand_top = BOTTOM - 40
    room = brand_top - 16 - y
    hf, hls = fit(d, hook, 28, 22, 2 if room >= 28 * 2 + 8 else 1)
    # if two lines still will not fit above the brand, keep one
    step = int(hf.size * 1.35)
    if y + step * len(hls) > brand_top - 8:
        hf, hls = fit(d, hook, hf.size, 22, 1)
        step = int(hf.size * 1.35)
    for ln in hls:
        y = paint(d, ln, hf, LEFT, y, '#e6eeff', k) + 6
    paint(d, brand, bf, LEFT, brand_top, '#ffd77a', k)
    q = im.quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q.save(out / f'{k}.png', optimize=True)
print(f'wrote {len(keys)} og-st pngs')
