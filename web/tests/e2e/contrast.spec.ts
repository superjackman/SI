import { test, expect } from '@playwright/test';

/* Every visible string against its own background, at 1440, in both themes.
   Small text needs 7:1 (WCAG AAA). Large headings and heavy UI labels need 4.5:1.
   No exceptions: a string that cannot clear its own fill has to change token, not get a waiver. */
const ROUTES = [
  '#home', '#about', '#map', '#D', '#D/map', '#D/routes',
  '#D/0', '#D/P', '#D/1', '#D/2', '#D/3', '#D/4', '#D/5', '#D/6', '#D/7',
  '#D/8a', '#D/8b', '#D/9', '#D/E', '#D/10', '#D/11', '#D/12', '#D/13', '#D/14',
  '#D/S', '#D/15a', '#D/15b', '#D/A', '#D/16',
  '#L1', '#L2', '#L3', '#L4', '#L5',
  '#P', '#R', '#tools', '#news', '#W',
];

const SCAN = () => {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (rgb: { r: number; g: number; b: number }) => 0.2126 * lin(rgb.r / 255) + 0.7152 * lin(rgb.g / 255) + 0.0722 * lin(rgb.b / 255);
  const ratio = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const parse = (c: string | null) => {
    if (!c || c === 'transparent' || c === 'none') return null;
    const m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/);
    if (!m) return null;
    const raw = m[4];
    const a = raw === undefined ? 1 : raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
    return { r: +m[1]!, g: +m[2]!, b: +m[3]!, a };
  };
  const hex = (c: { r: number; g: number; b: number }) => '#' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  const over = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) => {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a <= 0) return { r: bg.r, g: bg.g, b: bg.b, a: bg.a };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  };
  const pageBg = () => parse(getComputedStyle(document.body).backgroundColor) || { r: 243, g: 241, b: 235, a: 1 };
  const cssBg = (el: Element): { r: number; g: number; b: number; a: number } => {
    const stops: { r: number; g: number; b: number; a: number }[] = [];
    let n: Element | null = el;
    while (n) {
      const cs = getComputedStyle(n);
      const img = cs.backgroundImage;
      if (img && img !== 'none') {
        for (const m of img.matchAll(/rgba?\([^)]+\)/g)) {
          const c = parse(m[0]);
          if (c && c.a > 0.45) stops.push(c);
        }
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a >= 0.98 && (!img || img === 'none')) return c;
      if (c && c.a > 0.05) {
        const parent = n.parentElement ? cssBg(n.parentElement) : pageBg();
        return over(c, parent);
      }
      n = n.parentElement;
    }
    return stops[0] || pageBg();
  };
  const hidden = (el: Element) => {
    let n: Element | null = el;
    while (n) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return true;
      n = n.parentElement;
    }
    return false;
  };
  const inView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const needOf = (el: Element) => {
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    const w = parseInt(cs.fontWeight, 10) || 400;
    if (px >= 24 || (px >= 18.66 && w >= 700)) return 4.5;
    const ui = el.closest('button, .l4-b, .pt-links a, .pt-more a, .st-tabs a, [role="tab"], summary');
    if (ui && w >= 600 && px >= 14) return 4.5;
    return 7;
  };
  const out: { r: number; need: number; fg: string; bg: string; t: string; sel: string }[] = [];
  let floor = { r: 99, need: 7, fg: '', bg: '', t: '', sel: '' };
  const take = (el: Element, text: string, fg0: { r: number; g: number; b: number; a: number } | null, bgs: { r: number; g: number; b: number; a: number }[]) => {
    if (!fg0 || !bgs.length || !text.trim()) return;
    let fade = fg0.a;
    let n: Element | null = el;
    while (n) { fade *= Number(getComputedStyle(n).opacity) || 0; n = n.parentElement; }
    if (fade < 0.2) return;
    const need = needOf(el);
    let worst = 99;
    let worstBg = bgs[0]!;
    for (const bg of bgs) {
      const fg = over({ ...fg0, a: fade }, bg);
      const r = ratio(fg, bg);
      if (r < worst) { worst = r; worstBg = bg; }
    }
    if (worst < floor.r) floor = { r: Math.round(worst * 100) / 100, need, fg: hex(fg0), bg: hex(worstBg), t: text.replace(/\s+/g, ' ').trim().slice(0, 42), sel: el.tagName.toLowerCase() };
    if (worst + 0.05 >= need) return;
    const cls = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    out.push({ r: Math.round(worst * 100) / 100, need, fg: hex(fg0), bg: hex(worstBg), t: text.replace(/\s+/g, ' ').trim().slice(0, 42), sel: el.tagName.toLowerCase() + (cls ? '.' + cls : '') });
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue || '';
    if (!text.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest('script,style,noscript,[hidden]') || hidden(el) || !inView(el)) continue;
    const cs = getComputedStyle(el);
    let fg = parse(cs.color);
    let bgs = [cssBg(el)];
    if (el.namespaceURI === 'http://www.w3.org/2000/svg' || el.closest('svg')) {
      fg = parse(cs.fill) || fg;
      const bb = el.getBoundingClientRect();
      const cx = bb.left + bb.width / 2, cy = bb.top + Math.min(bb.height * 0.35, bb.height / 2);
      const stack = document.elementsFromPoint(cx, cy);
      for (const hit of stack) {
        if (hit === el || el.contains(hit) || hit.matches?.('text, tspan, line, polyline')) continue;
        const hb = hit.getBoundingClientRect();
        if (cx < hb.left || cx > hb.right || cy < hb.top || cy > hb.bottom) continue;
        const fill = parse(getComputedStyle(hit).fill);
        if (fill && fill.a > 0.5 && hit.matches?.('rect,circle,ellipse,path,polygon')) {
          bgs = [fill.a > 0.98 ? fill : over(fill, cssBg(hit))];
          break;
        }
        const b = parse(getComputedStyle(hit).backgroundColor);
        if (b && b.a > 0.5) { bgs = [b.a > 0.98 ? b : cssBg(hit)]; break; }
      }
    }
    const img = cs.backgroundImage;
    if (img && img !== 'none') {
      const stops = [...img.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter((c): c is NonNullable<typeof c> => !!c && c.a > 0.45);
      if (stops.length) bgs = stops;
    }
    take(el, text, fg, bgs);
  }
  for (const inp of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]')) {
    if (hidden(inp) || !inView(inp) || inp.value) continue;
    const cs = getComputedStyle(inp, '::placeholder');
    take(inp, inp.getAttribute('placeholder') || '', parse(cs.color), [cssBg(inp)]);
  }
  return { out, floor };
};

test.beforeEach(({ }, info) => { test.skip(info.project.name !== 'd1440', 'contrast is measured at 1440'); });

test('1440 light and dark: every visible string clears its own background', async ({ page }) => {
  test.setTimeout(240_000);
  const fails: string[] = [];
  let lowest = { r: 99, line: '' };
  for (const theme of ['light', 'dark'] as const) {
    await page.addInitScript((th) => { localStorage.setItem('si.onb', '1'); localStorage.setItem('si.a2hs', '1'); localStorage.setItem('si.theme', th); }, theme);
    for (const hash of ROUTES) {
      await page.goto('./?lang=zh' + hash);
      await page.locator('#l4').waitFor({ state: 'attached' });
      if (theme === 'dark') await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
      const passes = hash.startsWith('#D/') ? [0, 1] : [0];
      for (const morph of passes) {
        if (morph) await page.evaluate(() => { document.querySelectorAll<HTMLElement>('.dv-lead, .ly').forEach((e) => e.style.setProperty('--m', '1')); });
        const steps = await page.evaluate(() => {
          const home = document.querySelector('.l4-home');
          return Math.max(1, Math.ceil(((home ? home.scrollHeight : document.body.scrollHeight) || 800) / 780));
        });
        for (let i = 0; i < steps; i++) {
          await page.evaluate((y) => { const home = document.querySelector('.l4-home'); if (home) home.scrollTop = y; else scrollTo(0, y); }, i * 780);
          const pack = await page.evaluate(SCAN);
          const rows = pack.out;
          if (pack.floor.r < lowest.r) lowest = { r: pack.floor.r, line: `${pack.floor.r.toFixed(2)}/${pack.floor.need} ${theme} ${hash}${morph ? ' math' : ''} ${pack.floor.fg} on ${pack.floor.bg} ${pack.floor.sel} “${pack.floor.t}”` };
          for (const row of rows) {
            const line = `${row.r.toFixed(2)}/${row.need} ${theme} ${hash}${morph ? ' math' : ''} ${row.fg} on ${row.bg} ${row.sel} “${row.t}”`;
            fails.push(line);
            if (row.r < lowest.r) lowest = { r: row.r, line };
          }
        }
      }
    }
    await page.goto('./?lang=zh#home');
    await page.locator('[data-a="set"]').click();
    await page.locator('.l4-set').waitFor();
    const setPack = await page.evaluate(SCAN);
    if (setPack.floor.r < lowest.r) lowest = { r: setPack.floor.r, line: `${setPack.floor.r.toFixed(2)} settings ${theme} ${setPack.floor.fg} on ${setPack.floor.bg} “${setPack.floor.t}”` };
    for (const row of setPack.out) fails.push(`${row.r.toFixed(2)}/${row.need} ${theme} settings ${row.fg} on ${row.bg} ${row.sel} “${row.t}”`);
    await page.locator('.l4-done').click();
  }
  const uniq = [...new Set(fails)];
  console.log('lowest ' + (lowest.line || 'none'));
  expect(uniq, lowest.line || 'none').toEqual([]);
});
