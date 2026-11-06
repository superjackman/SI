"""1200x630 preview for each news item and tool. Flat colours, quantized.
   Run from web/: python3 scripts/og-hub.py
"""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

web = Path(__file__).resolve().parents[1]
news = json.loads((web / 'src/hub/news.json').read_text())
tools = json.loads((web / 'src/hub/tools.json').read_text())
FONT = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'
LEFT, RIGHT, TOP, BOTTOM = 84, 1116, 80, 548
MAX_W = RIGHT - LEFT
TOK = re.compile(r'[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F](?:[，。、：；！？）」』”’,.!?:;)]*)|[^\s\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+')

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
        lines[-1] = (lines[-1] or '').rstrip() + ell
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

def card(kind, id_, chip, title, blurb):
    im = Image.new('RGB', (1200, 630), '#0b1230')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((48, 48, 1152, 582), 28, fill='#101a3d', outline='#c99a2e', width=3)
    y = TOP
    kf = ImageFont.truetype(FONT, 28)
    label = chip[:28]
    kw = width(d, label, kf)
    cw, ch = max(72, int(kw + 44)), 48
    d.rounded_rectangle((LEFT, y, LEFT + cw, y + ch), 10, fill='#ffd77a')
    tb = d.textbbox((0, 0), label, font=kf)
    d.text((LEFT + (cw - (tb[2] - tb[0])) / 2 - tb[0], y + (ch - (tb[3] - tb[1])) / 2 - tb[1]), label, font=kf, fill='#1a1204')
    y += ch + 28
    tf, tls = fit(d, title, 52, 32, 3)
    for ln in tls:
        y = paint(d, ln, tf, LEFT, y, '#ffffff', id_) + 8
    y += 12
    brand_top = BOTTOM - 40
    room_lines = 2 if brand_top - y > 80 else 1
    hf, hls = fit(d, blurb, 30, 22, room_lines)
    step = int(hf.size * 1.35)
    if y + step * len(hls) > brand_top - 8:
        hf, hls = fit(d, blurb, hf.size, 22, 1)
    for ln in hls:
        y = paint(d, ln, hf, LEFT, y, '#e6eeff', id_) + 6
    paint(d, '大白话拆解 AI', ImageFont.truetype(FONT, 30), LEFT, brand_top, '#ffd77a', id_)
    out = web / 'public' / 'og-hub' / kind
    out.mkdir(parents=True, exist_ok=True)
    im.quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out / f'{id_}.png', optimize=True)

n = 0
for week in news['weeks']:
    for it in week['items']:
        card('news', it['id'], it['source'], it['zh'], f"{it['date']} · 第 {it['goal']} 站")
        n += 1
for t in tools['items']:
    card('tools', t['id'], '工具', t['name'], t['zh'])
    n += 1
print(f'wrote {n} og-hub pngs')
