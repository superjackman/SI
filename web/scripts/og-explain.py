"""1200x630 explanatory Open Graph cards.

A card shows one concrete question or conclusion, a same-colour diagram, and a short invite.
Chinese and English are separate files. News keeps its source and date. Tools do not show star counts.
Run from web/: python3 scripts/og-explain.py
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

web = Path(__file__).resolve().parents[1]
FONT = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'
CJK = re.compile(r'[\u3400-\u9fff]')
W, H = 1200, 630
LEFT, RIGHT = 72, 1128
MAX_W = RIGHT - LEFT
GOLD, WHITE, BLUE, TEAL, INK, MUTED = '#ffd77a', '#ffffff', '#8eb0ff', '#5ee0c0', '#1a1204', '#d5e4ff'
KEYS = ['0', 'P', '1', '2', '3', '4', '5', '6', '7', '8a', '8b', '9', 'E', '10', '11', '12', '13', '14', 'S', '15a', '15b', 'A', '16']

# Short lines taken from the station's own question. Numbers on the diagram come from nums.ts.
ST = {
    '0': ('不写规则，用例子把函数拧对', 'Set the function with examples, not a handwritten rule'),
    'P': ('下一个字，是一组加起来为 1 的概率', 'The next word is probabilities that add up to 1'),
    '1': ('猜错要罚分，罚分就是损失', 'A wrong guess is penalised. That penalty is the loss'),
    '2': ('顺着坡往下走，损失会变小', 'Walk downhill and the loss gets smaller'),
    '3': ('直线叠不出弯，中间要折一下', 'Straight layers stay straight. A bend makes curves'),
    '4': ('误差往回传，每一层乘自己的那一档', 'The error passes back. Each layer multiplies its own factor'),
    '5': ('步子太大，就会走过最低点', 'Too big a step walks past the bottom'),
    '6': ('猫和狗，为什么比猫和汽车更近？', 'Why is cat closer to dog than to car?'),
    '7': ('记不住远处时，注意力可以回头看', 'When a chain forgets, attention can look back'),
    '8a': ('每个字都问一遍：我和谁有关？', 'Each word asks: who am I related to?'),
    '8b': ('先交流，再各自消化，一层层叠上去', 'Exchange, then digest, and stack that block'),
    '9': ('温度一变，下一个字的概率就变', 'Change the temperature, and the next-word probabilities change'),
    'E': ('同一把尺子，才知道有没有变强', 'The same ruler is how you know it got better'),
    '10': ('先学会怎么答，再按人的偏好改', 'Learn the format first, then follow what people prefer'),
    '11': ('原矩阵冻住，只训练旁边一条细路', 'Freeze the matrix. Train only a thin side path'),
    '12': ('前面的结果存下来，就不用重算', 'Save what came before, and you do not recompute it'),
    '13': ('先查出资料，再只按资料回答', 'Look the notes up, then answer only from them'),
    '14': ('它会选工具，付钱之前要先问人', 'It can pick a tool. It asks a person before paying'),
    'S': ('塞进来的文字是数据，不是新命令', 'Pasted text is data, not a new instruction'),
    '15a': ('一张图切成小块，和字排进同一句', 'Cut a picture into patches and line them up with the words'),
    '15b': ('窗口变长，不等于每个字都被用上', 'A longer window does not mean every token is used'),
    'A': ('修一个报错：读、改、跑，失败再改', 'Fix one error: read, change, run, then change again'),
    '16': ('从一道算术回头看，路是怎么接上的', 'From one sum, look back at how the path connects'),
}
NEWS = {
    'ling-32': ('总参数 5600 亿，每步只算约 250 亿', '560 billion parameters, about 25 billion each step'),
    'hy4': ('Hy4 加上看图，并能在界面里办事', 'Hy4 adds images and work inside an interface'),
    'kimi-k31': ('总参数 2.8 万亿，每步约 1040 亿', '2.8 trillion parameters, about 104 billion active'),
    'gpt6-cyber': ('面向授权的安全研究，并要求留在范围内', 'Authorized security research, trained to stay in scope'),
    'endeavor-11': ('能看图，思维过程可以打开看', 'Image input, and thinking traces you can open'),
}

def load_nums():
    src = (web / 'src/dv/nums.ts').read_text()
    block = src[src.index('export const NUM = {'):src.index('} satisfies Record<string, Num>')]
    out = {}
    for m in re.finditer(r"\n  (\w+): \{\n    zh: '((?:\\'|[^'])*)',\s*en: '((?:\\'|[^'])*)'", block):
        out[m.group(1)] = {'zh': m.group(2).replace('`', ''), 'en': m.group(3).replace('`', '')}
    if 'dot' not in out or 't1' not in out or 'kv100' not in out:
        raise SystemExit('og: nums.ts parse missed dot/t1/kv100')
    return out

def font(size):
    return ImageFont.truetype(FONT, size)

def width(draw, text, f):
    return draw.textlength(text, font=f)

def wrap(draw, text, f, max_w):
    parts = re.findall(r'[\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F](?:[，。、：；！？）」』”’,.!?:;)]*)|[^\s\u2E80-\u9FFF\uFF00-\uFFEF\u3000-\u303F]+\s*|\s+', text) or [text]
    lines, cur = [], ''
    for t in parts:
        trial = cur + t
        if width(draw, trial, f) <= max_w or not cur.strip():
            cur = trial
            continue
        lines.append(cur.rstrip())
        cur = t.lstrip()
    if cur.strip():
        lines.append(cur.rstrip())
    return lines

def fit(draw, text, size, min_size, max_lines, key):
    for z in range(size, min_size - 1, -2):
        f = font(z)
        lines = wrap(draw, text, f, MAX_W)
        if len(lines) <= max_lines and all(width(draw, ln, f) <= MAX_W + 0.5 for ln in lines):
            return f, lines
    raise SystemExit(f'{key}: main line does not fit at {min_size}px without cutting: {text}')

def say(draw, xy, text, f, fill, lang, key):
    if lang == 'en' and CJK.search(text):
        raise SystemExit(f'{key}: Chinese on an English card: {text}')
    draw.text(xy, text, font=f, fill=fill)

def chip(draw, label, y, lang, key):
    f = font(28)
    cw = max(88, int(width(draw, label, f) + 36))
    draw.rounded_rectangle((LEFT, y, LEFT + cw, y + 46), 10, fill=GOLD)
    say(draw, (LEFT + 18, y + 8), label, f, INK, lang, key)
    return y + 46

def bars(draw, box, pairs, lang, key):
    """Horizontal bars: the label stays readable, and the length is the comparison."""
    x, y, w, h = box
    row, gap = 34, 14
    lab_w = 130
    max_bar = max(80, w - lab_w - 8)
    for i, (lab, frac, col) in enumerate(pairs):
        yy = y + i * (row + gap)
        if yy + row > y + h:
            break
        say(draw, (x, yy + 2), lab, font(30), WHITE, lang, key)
        bw = max(18, max_bar * max(0.04, min(1, frac)))
        draw.rounded_rectangle((x + lab_w, yy, x + lab_w + bw, yy + row), 8, fill=col)

def flow(draw, box, labels, lang, key):
    x, y, w, h = box
    n = len(labels)
    gap = 36
    bw = (w - gap * (n - 1)) / n
    by, bh = y + h * 0.22, h * 0.5
    cols = [GOLD, TEAL, BLUE, '#c4b5fd']
    f = font(32 if lang == 'zh' else 26)
    for i, lab in enumerate(labels):
        bx = x + i * (bw + gap)
        draw.rounded_rectangle((bx, by, bx + bw, by + bh), 16, fill=cols[i % len(cols)])
        tw = width(draw, lab, f)
        say(draw, (bx + (bw - tw) / 2, by + bh / 2 - 18), lab, f, INK if i < 2 else '#0b1230', lang, key)
        if i < n - 1:
            ax = bx + bw + 6
            mid = by + bh / 2
            draw.polygon([(ax, mid - 10), (ax + gap - 18, mid), (ax, mid + 10)], fill=WHITE)

def vectors(draw, box, lang, key):
    x, y, w, h = box
    ox, oy = x + 70, y + h - 36
    arrows = [(150, -30, GOLD), (180, -70, TEAL), (40, -150, BLUE)]
    labels = ('猫', '狗', '汽车') if lang == 'zh' else ('cat', 'dog', 'car')
    for (dx, dy, col), lab in zip(arrows, labels):
        draw.line((ox, oy, ox + dx, oy + dy), fill=col, width=8)
        draw.ellipse((ox + dx - 8, oy + dy - 8, ox + dx + 8, oy + dy + 8), fill=col)
        say(draw, (ox + dx + 10, oy + dy - 16), lab, font(30), col, lang, key)
    say(draw, (x + w * 0.42, y + 16), 'q·k = 8.5', font(40), GOLD, lang, key)

def save(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(path, optimize=True)

def flat(s):
    return s.replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')

def card(path, lang, chip_s, title, invite, diagram, key):
    chip_s, title, invite = flat(chip_s), flat(title), flat(invite)
    im = Image.new('RGB', (W, H), '#0b1230')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((36, 36, 1164, 594), 28, fill='#101a3d', outline='#c99a2e', width=3)
    y = chip(d, chip_s, 64, lang, key) + 18
    f, lines = fit(d, title, 58, 46, 2, key)
    for ln in lines:
        say(d, (LEFT, y), ln, f, WHITE, lang, key)
        y += int(f.size * 1.28)
    diagram(d, (LEFT, y + 8, MAX_W, 500 - y), lang, key)
    say(d, (LEFT, 528), invite, font(32), GOLD, lang, key)
    save(im, path)

def write_root():
    """Home-page cover: the same promise as the first screen, plus a path, not a trapezoid."""
    im = Image.new('RGB', (W, H), '#0b1230')
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((36, 36, 1164, 594), 28, fill='#101a3d', outline='#c99a2e', width=3)
    y = chip(d, '零基础', 64, 'zh', 'root') + 16
    title = '从一道小学算术，一路搭到 ChatGPT'
    f, lines = fit(d, title, 54, 46, 2, 'root')
    for ln in lines:
        say(d, (LEFT, y), ln, f, WHITE, 'zh', 'root')
        y += int(f.size * 1.25)
    say(d, (LEFT, y + 6), '每站 5 分钟 · 不用注册', font(32), MUTED, 'zh', 'root')
    flow(d, (LEFT, 360, MAX_W, 150), ('算术', '概率', '注意力', 'ChatGPT'), 'zh', 'root')
    say(d, (LEFT, 528), '现在做一道', font(34), GOLD, 'zh', 'root')
    save(im, web / 'public' / 'og.png')

def main():
    nums = load_nums()
    st = json.loads((web / 'src/dv/zh-st.json').read_text())['st']
    en = json.loads((web / 'src/dv/en-st.json').read_text())['st']
    news = json.loads((web / 'src/hub/news.json').read_text())
    tools = json.loads((web / 'src/hub/tools.json').read_text())
    dot = nums['dot']['zh']
    if '8.5' not in dot:
        raise SystemExit('og: dot example no longer ends in 8.5; update the vector diagram from nums.ts')
    t1 = [p.strip() for p in nums['t1']['zh'].split('/')]
    if len(t1) != 3:
        raise SystemExit('og: t1 is not three probabilities')
    kv = nums['kv100']['zh']
    if '5050' not in kv:
        raise SystemExit('og: kv100 no longer contains 5050')

    def diag_for(k):
        def draw_it(d, box, lang, key):
            if k == '6':
                vectors(d, box, lang, key)
            elif k == '9':
                fr = [0.90, 0.08, 0.06]
                bars(d, box, list(zip(t1, fr, [GOLD, TEAL, BLUE])), lang, key)
            elif k == '12':
                lab = ('重算 5050', '缓存 100') if lang == 'zh' else ('recompute 5050', 'cache 100')
                flow(d, box, lab, lang, key)
            elif k == '13':
                flow(d, box, ('查', '对上', '答') if lang == 'zh' else ('find', 'match', 'answer'), lang, key)
            else:
                flow(d, box, ('1', '2', '3'), lang, key)
        return draw_it

    n = 0
    for i, k in enumerate(KEYS):
        zh_t, en_t = ST[k]
        card(web / 'public/og-st' / f'{k}.png', 'zh', f'第 {k} 站', zh_t, '打开，自己算一遍', diag_for(k), k)
        card(web / 'public/og-st/en' / f'{k}.png', 'en', f'Stop {k}', en_t, 'Open it and work it out', diag_for(k), 'en-' + k)
        n += 2
        _ = st[i]['n'], en[i]['n']
    card(web / 'public/og-st/en/catalog.png', 'en', '23 stops', 'From grade-school arithmetic all the way to ChatGPT', 'Do one question now', lambda d, box, lang, key: flow(d, box, ('sum', 'attention', 'chat'), lang, key), 'catalog')
    n += 1

    items = [it for w in news['weeks'] for it in w['items']]
    for it in items:
        zh_t, en_t = NEWS[it['id']]
        src = f"{it['source']} · {it['date']}"
        def news_diag(d, box, lang, key, src=src, nid=it['id']):
            x, y, w, h = box
            d.rounded_rectangle((x, y + 4, x + min(640, w), y + 72), 14, outline=GOLD, width=3)
            say(d, (x + 20, y + 22), src, font(32), GOLD, lang, key)
            if nid == 'ling-32':
                bars(d, (x, y + 88, w, h - 88), [('5600', 1, GOLD), ('250', 250 / 5600, TEAL)], lang, key)
            elif nid == 'kimi-k31':
                bars(d, (x, y + 88, w, h - 88), [('2.8T', 1, GOLD), ('104B', 104 / 2800, TEAL)], lang, key)
        card(web / 'public/og-hub/news' / f"{it['id']}.png", 'zh', it['source'], zh_t, '打开这篇来源', news_diag, it['id'])
        card(web / 'public/og-hub/en/news' / f"{it['id']}.png", 'en', it['source'], en_t, 'Open the source', news_diag, 'en-' + it['id'])
        n += 2
    card(web / 'public/og-hub/en/news-index.png', 'en', 'News', 'Each note has a source and a date', 'Open a note', lambda d, box, lang, key: flow(d, box, ('source', 'date', 'stop'), lang, key), 'news-index')
    n += 1

    def tool_diag(name):
        def draw_it(d, box, lang, key):
            if name == 'Dify':
                flow(d, box, ('资料', '检索', '问人') if lang == 'zh' else ('notes', 'search', 'ask'), lang, key)
            elif name == 'RAGFlow':
                flow(d, box, ('切块', '检索', '回答') if lang == 'zh' else ('chunk', 'search', 'answer'), lang, key)
            else:
                flow(d, box, ('输入', '工具', '结果') if lang == 'zh' else ('in', 'tool', 'out'), lang, key)
        return draw_it

    for t in tools['items']:
        en_name = t['name'] if not CJK.search(t['name']) else t['id']
        card(web / 'public/og-hub/tools' / f"{t['id']}.png", 'zh', t['name'], t['zh'], '看看适不适合', tool_diag(t['name']), t['id'])
        card(web / 'public/og-hub/en/tools' / f"{t['id']}.png", 'en', en_name, t['en'], 'See if it fits', tool_diag(t['name']), 'en-' + t['id'])
        n += 2
    card(web / 'public/og-hub/en/tools-index.png', 'en', 'Tools', 'Real products, chosen by the job', 'See if it fits', lambda d, box, lang, key: flow(d, box, ('write', 'lookup', 'code'), lang, key), 'tools-index')
    n += 1
    print(f'wrote {n} explanatory og pngs')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'root':
        write_root()
    else:
        main()
