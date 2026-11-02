/* R47b contrast audit, run in the page: page.evaluate(contrastIssues, { root: '.dv', min: 4.5 }) → [{ cls, txt, fg, bg, r }].
   Every visible text node under `root` (and its ::before / ::after content): the text colour composited over the
   effective background (each ancestor's background-color with its alpha, down to the page's #050b1f-ish body; a
   background-image gradient counts as its lightest and darkest stop, whichever is worse). WCAG 2 contrast ratio;
   `min` 4.5 for normal text, 3 for large text (≥ 24px, or ≥ 18.66px bold); a one- or two-glyph ::before/::after icon
   Disabled controls are skipped (exempt).
   (the › of a jump button, the i of an info chip) is a graphic, so it needs `icon` (3, WCAG 1.4.11). Plain JS so box scripts can use it too. */
export function contrastIssues({ root = 'body', min = 4.5, icon = 3 } = {}) {
  const out = [], seen = new Set();
  const parse = (c) => { const m = String(c).match(/[\d.]+/g); if (!m) return null; return [Number(m[0]), Number(m[1]), Number(m[2]), m.length > 3 ? Number(m[3]) : 1]; };
  const over = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1); /* a over opaque b */
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  /* candidate backgrounds of element e: the stack of ancestors' colours; gradient stops give several candidates */
  const bgs = (e) => {
    const chain = []; for (let n = e; n; n = n.parentElement) chain.push(n);
    let base = [[5, 11, 31, 1]];
    for (const n of chain.reverse()) {
      const s = getComputedStyle(n), c = parse(s.backgroundColor), img = s.backgroundImage;
      if (c && c[3] > 0) base = base.map((b) => over(c, b));
      if (img && img !== 'none' && /gradient/.test(img)) { const stops = [...img.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])); if (stops.length) base = stops.flatMap((st) => base.map((b) => over(st, b))); }
    }
    return base;
  };
  const vis = (e) => { if (e.closest(':disabled, [aria-disabled="true"]')) return false; /* inactive controls are exempt (WCAG 1.4.3) */ for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false; const p = n.parentElement; if (p && p.tagName === 'DETAILS' && !p.open && n.tagName !== 'SUMMARY') return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const check = (e, s, txt, pseudo, floor) => {
    const fg0 = parse(s.color); if (!fg0) return;
    const px = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700, need = px >= 24 || (bold && px >= 18.66) ? Math.min(min, 3) : min, needF = floor == null ? need : Math.min(need, floor);
    let worst = null;
    for (const b of bgs(e)) { const fg = over(fg0, b), r = ratio(fg, b); if (!worst || r < worst.r) worst = { r, fg: hex(fg), bg: hex(b) }; }
    const cls = ((e.getAttribute('class') || e.tagName.toLowerCase()) + (pseudo || '')).slice(0, 48), key = cls + '|' + worst.fg + '|' + worst.bg;
    if (worst.r < needF && !seen.has(key)) { seen.add(key); out.push({ cls, txt: txt.trim().replace(/\s+/g, ' ').slice(0, 24), fg: worst.fg, bg: worst.bg, r: Math.round(worst.r * 100) / 100 }); }
  };
  for (const R of document.querySelectorAll(root)) {
    const w = document.createTreeWalker(R, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) { const e = t.parentElement; if (!e || !t.textContent.trim() || !vis(e)) continue; check(e, getComputedStyle(e), t.textContent); }
    for (const e of R.querySelectorAll('*')) { if (!vis(e)) continue; for (const p of ['::before', '::after']) { const s = getComputedStyle(e, p), c = s.content; if (!c || c === 'none' || c === 'normal' || c === '""' || s.display === 'none') continue; const txt = c.replace(/^["']|["']$/g, ''); if (!txt.trim()) continue; const glyph = [...txt.trim()].length <= 2;
      /* a pseudo with its own background (a round badge) is checked against that */
      const pb = parse(s.backgroundColor); if (pb && pb[3] > 0.5) { const fg = parse(s.color), b = over(pb, bgs(e)[0]), r = ratio(over(fg, b), b), px = parseFloat(s.fontSize), need = px >= 24 || glyph ? Math.min(min, icon) : min; const cls = (e.getAttribute('class') || e.tagName.toLowerCase()) + p; if (r < need && !seen.has(cls)) { seen.add(cls); out.push({ cls, txt, fg: hex(over(fg, b)), bg: hex(b), r: Math.round(r * 100) / 100 }); } }
      else check(e, s, txt, p, glyph ? icon : null); } }
  }
  return out;
}
