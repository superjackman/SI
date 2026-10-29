/* R42b text audit, run in the page: page.evaluate(textIssues, 12) → [{ k, px?, txt, cls }]. Geometric checks on every
   visible text node, HTML and SVG/chart labels alike:
   small  – drawn size < min px (computed font size × CSS zoom × transforms × SVG viewBox scaling)
   cover  – another painted element sits on top of the text (elementsFromPoint at sample points)
   clip   – the text box sticks out of an ancestor that clips (overflow hidden/clip, no scrolling) or out of the viewport sideways
   hscroll / cut – a box scrolls sideways / is cut (scrollWidth > clientWidth or scrollHeight > clientHeight with hidden overflow)
   wrap   – a button or chip label broken over two lines (answer rows ≥60% of the screen may wrap a long sentence); a paragraph whose last line is one lone character
   Plain JS so the box scan scripts can use it too. */
export function textIssues(min) {
  const out = [], seen = new Set(), seenB = new Set(), W = innerWidth, H = innerHeight;
  /* hit-test everything: labels drawn with pointer-events:none must still count as on top */
  const pe = document.createElement('style'); pe.textContent = '*, *::before, *::after { pointer-events: auto !important; }'; document.head.appendChild(pe);
  const cs = (e) => getComputedStyle(e);
  const hidden = (e) => { for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const s = cs(n); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return true; const pp = n.parentElement; if (pp && pp.tagName === 'DETAILS' && !pp.open && n.tagName !== 'SUMMARY') return true; } return false; };
  const lbl = (e) => (e.getAttribute('class') || e.tagName.toLowerCase()).toString().slice(0, 40);
  const add = (k, e, txt, x = {}) => out.push({ k, cls: lbl(e), txt: txt.trim().replace(/\s+/g, ' ').slice(0, 36), ...x });
  const painted = (e, x, y) => { const s = cs(e); if (/^(IMG|CANVAS|VIDEO|INPUT|TEXTAREA|SELECT)$/.test(e.tagName) || e instanceof SVGGraphicsElement && !(e instanceof SVGSVGElement)) return true;
    const bg = s.backgroundColor.match(/[\d.]+/g); if (s.backgroundImage !== 'none' || bg && (bg.length < 4 || Number(bg[3]) > 0.3)) return true;
    return null; };
  /* text-only boxes (no background) only cover what their glyphs cover, not their padding */
  const inks = (e, x, y) => [...e.childNodes].some((n) => { if (n.nodeType !== 3 || !n.textContent.trim()) return false; const r = document.createRange(); r.selectNodeContents(n);
    return [...r.getClientRects()].some((b) => x >= b.left && x <= b.right && y >= b.top + b.height * 0.2 && y <= b.bottom - b.height * 0.2); });
  /* an overlay layer: a positioned box on a high layer that spans the screen width (sheets, drawers, dropdowns, dialogs, prompts) — what is under it is meant to be covered */
  const modal = (o) => { for (let n = o; n && n !== document.body; n = n.parentElement) { const s = cs(n); if (/fixed|absolute/.test(s.position) && Number(s.zIndex) >= 10) { const a = n.getBoundingClientRect(); if (a.width >= W * 0.88 && a.height >= 60) return n; } } return null; };
  const scroller = (e) => { for (let n = e.parentElement; n; n = n.parentElement) { const s = cs(n); if (/auto|scroll/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n; } return null; };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const e = t.parentElement, txt = t.textContent; if (!e || !txt.trim()) continue;
    if (e.closest('script, style, noscript, title, desc, defs, .sr-only, [aria-hidden="true"] .sr-only')) continue;
    const er = e.getBoundingClientRect(); if (er.width <= 1 || er.height <= 1 || hidden(e)) continue;
    const rg = document.createRange(); rg.selectNodeContents(t); const rs = [...rg.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5); if (!rs.length) continue;
    const first = !seen.has(e); seen.add(e);
    if (first) { // size, once per element
      const fs = parseFloat(cs(e).fontSize); let k = 1;
      if (e instanceof SVGGraphicsElement) { const m = e.getScreenCTM(); if (m) k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); }
      else if (e instanceof HTMLElement) { const z = e.currentCSSZoom ?? 1; let t = e.offsetHeight ? er.height / (e.offsetHeight * z) : 1; if (Math.abs(t - 1) < 0.08) t = 1; k = z * t; } // zoom exactly; transforms roughly (offsetHeight is rounded)
      const px = Math.round(fs * k * 10) / 10; if (px < min - 0.05) add('small', e, txt, { px });
    }
    const sc = scroller(e), u = rs.reduce((a, r) => ({ l: Math.min(a.l, r.left), r: Math.max(a.r, r.right), t: Math.min(a.t, r.top), b: Math.max(a.b, r.bottom) }), { l: 1e9, r: -1e9, t: 1e9, b: -1e9 });
    // sideways out of the viewport (unless inside a sideways scroller)
    let hs = false; for (let n = e.parentElement; n; n = n.parentElement) if (/auto|scroll/.test(cs(n).overflowX) && n.scrollWidth > n.clientWidth + 1) { hs = true; break; }
    if (!hs && (u.l < -1 || u.r > W + 1)) add('clip', e, txt, { why: 'viewport-x', x: [Math.round(u.l), Math.round(u.r)] });
    // clipped by an ancestor with hidden overflow
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = cs(n); if (/auto|scroll/.test(s.overflowX + s.overflowY)) break; // inside a scroll box: the rest is reached by scrolling
      const cx = /hidden|clip/.test(s.overflowX), cy = /hidden|clip/.test(s.overflowY); if (!cx && !cy) continue;
      const a = n.getBoundingClientRect(), sl = n.clientLeft, st = n.clientTop, L = a.left + sl, T = a.top + st, R = L + n.clientWidth, B = T + n.clientHeight;
      if (cx && (u.l < L - 1.5 || u.r > R + 1.5) || cy && (u.t < T - 2 || u.b > B + 2)) { add('clip', e, txt, { why: lbl(n) }); break; }
    }
    // covered: sample the middle of each line box, and both ends of the first one
    const pts = rs.slice(0, 4).map((r) => [r.left + r.width / 2, r.top + r.height / 2]); pts.push([rs[0].left + 2, rs[0].top + rs[0].height / 2], [rs[0].right - 2, rs[0].top + rs[0].height / 2]);
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if (sc) { const a = sc.getBoundingClientRect(); if (y < a.top || y > a.bottom || x < a.left || x > a.right) continue; } // scrolled out of view: fine
      const st = document.elementsFromPoint(x, y); let hit = null;
      for (const o of st) { if (o === e || e.contains(o)) break; if (o.contains(e)) break; if (painted(o) || inks(o, x, y)) { hit = o; break; } }
      if (hit && modal(hit) && !modal(hit).contains(e)) continue; // a sheet, drawer or popup is open on top: what is under it is meant to be covered
      if (hit) { const hp = cs(hit).position; if (sc && !sc.contains(hit) && /fixed|sticky|absolute/.test(hp)) continue; add('cover', e, txt, { by: lbl(hit) }); break; }
    }
    // a button / chip label broken over two lines; a lone last character
    const bt = first && e.closest('button, .l4-b, [role=button], .chip, .l4-chip'); // a wide answer row may wrap a sentence; a short button label may not
    if (bt && (bt.getBoundingClientRect().width < W * 0.6 || txt.trim().length <= 12) && rs.length > 1 && new Set(rs.map((r) => Math.round(r.top))).size > 1 && txt.trim().length <= 24) add('wrap', e, txt, { why: 'button' });
    // orphan: judged per block (an inline term that ends a line mid-paragraph is normal flow)
    let B = e; while (B.parentElement && /^inline/.test(cs(B).display) && !(B instanceof SVGElement)) B = B.parentElement;
    if (!seenB.has(B) && /[\u4e00-\u9fff]/.test(B.textContent)) { seenB.add(B);
      const br = document.createRange(); br.selectNodeContents(B); const bs = [...br.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5 && r.height < 60);
      const tops = [...new Set(bs.map((r) => Math.round(r.top)))].sort((a, b) => a - b), lines = tops.filter((t, i) => i === 0 || t - tops[i - 1] > 4);
      if (lines.length > 1) { const lt = lines[lines.length - 1], last = bs.filter((r) => Math.round(r.top) >= lt - 4); const lw = Math.max(...last.map((r) => r.right)) - Math.min(...last.map((r) => r.left));
        const pt = lines[lines.length - 2], prev = bs.filter((r) => Math.round(r.top) >= pt - 4 && Math.round(r.top) < lt - 4), pw = prev.length ? Math.max(...prev.map((r) => r.right)) - Math.min(...prev.map((r) => r.left)) : 0;
        if (lw < parseFloat(cs(B).fontSize) * 1.3 && pw > parseFloat(cs(B).fontSize) * 4) add('wrap', B, B.textContent.slice(-36), { why: 'orphan' }); } }
  }
  // boxes that scroll sideways or cut their text
  for (const e of document.querySelectorAll('body *')) {
    if (!(e instanceof HTMLElement) || !e.offsetParent && cs(e).position !== 'fixed' || !e.textContent.trim()) continue;
    const s = cs(e);
    if (e.scrollWidth > e.clientWidth + 1 && s.overflowX !== 'visible' && !hidden(e)) add(/auto|scroll/.test(s.overflowX) ? 'hscroll' : 'cut', e, e.textContent, { sw: [e.scrollWidth, e.clientWidth] });
    else if (e.scrollHeight > e.clientHeight + 2 && /hidden|clip/.test(s.overflowY) && !hidden(e)) add('cut', e, e.textContent, { sh: [e.scrollHeight, e.clientHeight] });
  }
  pe.remove();
  return out;
}
