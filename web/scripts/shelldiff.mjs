/* R4 behaviour diff: drive the live page and the React build through the same taps and diff what they show.
   Scenarios: full More sheet (with learning map open), phase toggle (use/train) + T4 training panel, detail levels 1/2/3,
   the 15-step tour (panel, highlights, station, zoom, body state per step), drawer (history entry, back), native quiz answer/reset.
   node scripts/shelldiff.mjs [--live URL] [--next URL] [--out DIR] */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LIVE = arg('live', 'http://127.0.0.1:8091/SI/index.html'), NEXT = arg('next', 'http://localhost:4173/SI/next/'), OUT = arg('out', '/workspace/si-r4-diff');
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });

/* in-page helpers, installed in both pages */
const HELP = () => {
  const IGN = /^(data-l10n|data-en.*|data-i18n.*|style|data-si.*|data-bz|data-nh|data-cc|data-mr|data-dd|data-ic|tabindex)$/;
  window.__dump = (sel) => {
    const out = [], root = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!root) return ['(missing ' + sel + ')'];
    /* adjacent text nodes are merged (React splits "{n}. {label}" into three; the page shows one string) */
    const walk = (n, d) => {
      if (n.nodeType === 3) { if (n.previousSibling && n.previousSibling.nodeType === 3) return; let t = '', m = n; while (m && m.nodeType === 3) { t += m.nodeValue; m = m.nextSibling; } t = t.replace(/\s+/g, ' ').trim(); if (t) out.push(' '.repeat(d) + '"' + t + '"'); return; }
      if (n.nodeType !== 1) return;
      const at = [...n.attributes].filter((a) => !IGN.test(a.name) && !(a.name === 'class' && !a.value.trim()))
        .map((a) => a.name + '=' + (a.name === 'class' ? a.value.trim().split(/\s+/).sort().join('.') : a.value)).sort().join(' ');
      out.push(' '.repeat(d) + n.tagName.toLowerCase() + (at ? '[' + at + ']' : ''));
      n.childNodes.forEach((c) => walk(c, d + 1));
    };
    walk(root, 0); return out;
  };
  window.__vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  /* what the reader sees lit: .tour-hl cards and .run diagram parts the tour lit (live leaves a stale data-tourrun on a part
     whose .run its own animation already removed; that part is not lit, so it is not counted) */
  window.__hl = (S) => [...document.getElementById(S).querySelectorAll('.tour-hl,.run[data-tourrun]')].map((e) => (e.namespaceURI === 'http://www.w3.org/2000/svg' ? 'svg:' : 'html:') + e.dataset.id + '@' + (e.closest('.m-stage') ? 'stage' : (e.closest('.card') || {}).id || '-'));
  window.__cur = () => (document.querySelector('section.level.active') || {}).id;
  window.__body = () => [...document.body.classList].filter((c) => /^(mode-|touring|in-T4)/.test(c)).sort().join(' ');
  window.__zvis = () => { const s = document.querySelector('section.level.active'); return [...s.querySelectorAll('[data-z]')].map((e) => (e.id || e.tagName.toLowerCase() + '.' + e.dataset.z) + ':' + (window.__vis(e) ? 1 : 0)).join(' '); };
};
async function page(url) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(url); await p.waitForSelector('section.level.active .m-stage'); await p.waitForTimeout(1500); await p.evaluate(HELP);
  return { p, ctx, errs };
}
const tap = async (p, sel) => { await p.locator(sel).first().click(); await p.waitForTimeout(250); };

/* navigate like a reader: drawer → stop (both pages ignore a bare hash change after load) */
const go = async (p, S) => { await tap(p, '#mMenu'); await p.locator(`#dwList [data-go="${S}"], #dwList [data-dw="${S}"], #dwList a[href$="${S}"]`).first().click(); await p.waitForTimeout(1500); await p.evaluate(HELP); };
const SCEN = {
  async sheet(p) {
    const r = {};
    await tap(p, '#bnav [data-bn=more]'); await p.evaluate(() => { const d = document.getElementById('shMap'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(700);
    /* the scroll-spy highlight depends on scroll position, which differs by a few px between the pages: drop it from the tree dump */
    r.sheet = await p.evaluate(() => { const c = document.getElementById('moreSheet').cloneNode(true); c.querySelectorAll('.tn.sec.on').forEach((e) => e.classList.remove('on')); return window.__dump(c); });
    return r;
  },
  async mode(p) {
    const r = {};
    await tap(p, '#bnav [data-bn=more]');
    r.useBody = await p.evaluate(() => window.__body() + ' | use:' + window.__vis(document.getElementById('useBanner')) + ' train:' + window.__vis(document.getElementById('trainBanner')));
    await tap(p, '#slotMode [data-mode=train]');
    r.trainBody = await p.evaluate(() => window.__body() + ' | use:' + window.__vis(document.getElementById('useBanner')) + ' train:' + window.__vis(document.getElementById('trainBanner')));
    r.modeBtns = await p.evaluate(() => window.__dump('#slotMode'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await tap(p, '#bnav [data-bn=T4]'); await p.waitForTimeout(1200); await p.evaluate(HELP);
    r.T4train = await p.evaluate(() => { const t = document.querySelector('#trainPanel'); if (!t) return ['(none)']; const h = t.querySelector('.cc-h'); h && h.click();
      return ['in ' + (t.closest('section') || {}).id + ' after ' + (t.previousElementSibling || {}).id + ' visible ' + window.__vis(t) + ' svg ' + t.querySelectorAll('svg').length, ...window.__dump(t)]; });
    r.T4body = await p.evaluate(() => window.__body());
    await tap(p, '#mMenu'); r.drawerMode = await p.evaluate(() => [...document.querySelectorAll('#mDrawer [data-dwmode]')].map((e) => e.dataset.dwmode + ':' + e.className + ':' + e.getAttribute('aria-pressed')).join(' '));
    return r;
  },
  async zoom(p) {
    const r = {};
    for (const S of ['T1', 'T3', 'T6']) {
      await go(p, S);
      for (const z of ['1', '2', '3']) {
        await tap(p, '#bnav [data-bn=more]'); await tap(p, `#zoom [data-z="${z}"]`);
        r[S + '.z' + z] = await p.evaluate(() => window.__zvis() + ' | zoomBtns ' + [...document.querySelectorAll('#zoom [data-z]')].map((e) => e.dataset.z + (e.classList.contains('active') ? '*' : '')).join(','));
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
    }
    return r;
  },
  async tour(p) {
    const r = {};
    await tap(p, '#bnav [data-bn=more]'); await tap(p, '#zoom [data-z="1"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await tap(p, '#mMenu'); await tap(p, '#mTour'); await p.waitForTimeout(900); await p.evaluate(HELP);
    for (let i = 0; i < 15; i++) {
      if (i) { await tap(p, '#tourNext'); await p.waitForTimeout(900); await p.evaluate(HELP); }
      r['step' + (i + 1)] = await p.evaluate(() => {
        const S = window.__cur();
        return ['station ' + S, 'body ' + window.__body(), 'zoom ' + localStorage.getItem('aiexp.v2.zoom'), 'hl ' + window.__hl(S).join(' '), 'lit ' + [...document.getElementById(S).querySelectorAll('.m-stage .run')].map((e) => e.dataset.id).join(' '), ...window.__dump('#tour')];
      });
    }
    await tap(p, '#tourPrev'); await p.waitForTimeout(600); r.back14 = await p.evaluate(() => window.__cur() + ' ' + document.getElementById('tourN').textContent);
    await tap(p, '#tourNext'); await p.waitForTimeout(600); await tap(p, '#tourNext'); await p.waitForTimeout(600);
    r.done = await p.evaluate(() => 'open:' + !!(document.getElementById('tour') && document.getElementById('tour').classList.contains('open')) + ' body:' + window.__body() + ' tourDone:' + localStorage.getItem('aiexp.v2.tourDone') + ' toast:' + (document.querySelector('.toast,#toast') || {}).textContent);
    await tap(p, '#mMenu'); r.drawerTour = await p.evaluate(() => window.__dump('#mTour'));
    return r;
  },
  async drawer(p) {
    const r = {};
    const h0 = await p.evaluate(() => history.length);
    await tap(p, '#mMenu');
    r.open = await p.evaluate((h0) => 'histΔ ' + (history.length - h0) + ' state ' + JSON.stringify(history.state && history.state.mDrawer) + ' vis ' + window.__vis(document.getElementById('mDrawer')), h0);
    r.dump = await p.evaluate(() => window.__dump('#mDrawer'));
    await p.goBack(); await p.waitForTimeout(600);
    r.back = await p.evaluate(() => 'drawerOpen ' + document.getElementById('mDrawer').classList.contains('open') + ' station ' + window.__cur() + ' hash ' + location.hash);
    await tap(p, '#mMenu'); await p.locator('#dwList [data-go="T5"], #dwList [data-dw="T5"], #dwList a[href$="T5"]').first().click(); await p.waitForTimeout(1500);
    r.item = await p.evaluate(() => 'drawerOpen ' + document.getElementById('mDrawer').classList.contains('open') + ' station ' + window.__cur() + ' state ' + JSON.stringify(history.state && history.state.mDrawer));
    return r;
  },
  async quiz(p) {
    const r = {};
    for (const S of ['T1', 'T3', 'T4b', 'N']) {
      await go(p, S);
      const q = '#quiz' + S;
      r[S + '.fresh'] = await p.evaluate((q) => window.__dump(q), q);
      await p.evaluate((q) => { const o = document.querySelectorAll(q + ' .opt[data-q]'); o[0] && o[0].click(); const o2 = document.querySelectorAll(q + ' .opt[data-q]'); o2[o2.length - 1] && o2[o2.length - 1].click(); }, q); await p.waitForTimeout(300);
      r[S + '.answered'] = await p.evaluate((q) => [localStorage.getItem('aiexp.v2.quiz'), ...window.__dump(q)], q);
    }
    await p.evaluate(() => { const b = document.querySelector('#quizN [data-qreset]'); b && b.click(); }); await p.waitForTimeout(300);
    r['N.reset'] = await p.evaluate(() => [localStorage.getItem('aiexp.v2.quiz'), ...window.__dump('#quizN')]);
    return r;
  },
};

const only = arg('scen', Object.keys(SCEN).join(',')).split(',');
let total = 0; const summary = [];
for (const lang of ['zh', 'en']) for (const name of only) {
  const res = {};
  for (const [k, base] of [['live', LIVE], ['next', NEXT]]) {
    const { p, ctx, errs } = await page(`${base}?lang=${lang}#T1`);
    try { res[k] = await SCEN[name](p); } catch (e) { res[k] = { error: [String(e.message).split('\n')[0]] }; console.error(k, name, lang, e.stack); }
    res[k].errors = errs; await ctx.close();
  }
  writeFileSync(`${OUT}/${name}.${lang}.json`, JSON.stringify(res, null, 1));
  const keys = [...new Set([...Object.keys(res.live), ...Object.keys(res.next)])];
  let diffs = 0; const lines = [];
  for (const key of keys) {
    const a = [].concat(res.live[key] ?? '(absent)'), c = [].concat(res.next[key] ?? '(absent)');
    if (JSON.stringify(a) === JSON.stringify(c)) continue;
    diffs++;
    const ca = new Map(), cc = new Map(); a.forEach((x) => ca.set(x, (ca.get(x) || 0) + 1)); c.forEach((x) => cc.set(x, (cc.get(x) || 0) + 1));
    const oL = [...ca].filter(([k2, v]) => v > (cc.get(k2) || 0)).map(([k2]) => k2), oN = [...cc].filter(([k2, v]) => v > (ca.get(k2) || 0)).map(([k2]) => k2);
    lines.push(`  [${key}] ${oL.length || oN.length ? '' : '(same lines, different order)'}`);
    oL.slice(0, 8).forEach((x) => lines.push('    - live: ' + x.trim().slice(0, 200)));
    oN.slice(0, 8).forEach((x) => lines.push('    + next: ' + x.trim().slice(0, 200)));
  }
  total += diffs;
  summary.push(`== ${name} ${lang}: ${keys.length} checks, ${diffs} differ`, ...lines);
}
console.log(summary.join('\n')); writeFileSync(`${OUT}/summary.txt`, summary.join('\n') + '\n');
console.log(`TOTAL differing checks: ${total}`);
await b.close();
