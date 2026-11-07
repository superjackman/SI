/* Build-time search index: 23 stations, knowledge cards, news items, tools.
   Emitted as search.json by the Vite plugin. The page fetches it only when search opens. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (web, rel) => JSON.parse(readFileSync(join(web, rel), 'utf8'));
const plain = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\{#[a-zA-Z0-9]+\}/g, ' ').replace(/[~*`"{}]/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n = 160) => { const t = plain(s); return t.length > n ? t.slice(0, n) : t; };

function keysOf(links) {
  const m = links.match(/export const DV_KEY = \[([\s\S]*?)\] as const/);
  if (!m) throw new Error('search-index: DV_KEY missing');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}
function births(links) {
  const i = links.indexOf('export const CARD_SK');
  const j = links.indexOf('export const CARD_DV');
  if (i < 0 || j < i) throw new Error('search-index: CARD_SK missing');
  const block = links.slice(i, j);
  const out = {};
  for (const m of block.matchAll(/([A-Z][A-Z0-9]*):\s*\[([^\]]*)\]/g)) {
    const first = m[2].split(',')[0].trim().replace(/['"]/g, '');
    out[m[1]] = first;
  }
  return out;
}

export function buildSearch(web) {
  const links = readFileSync(join(web, 'src/dv/links.ts'), 'utf8');
  const keys = keysOf(links);
  const born = births(links);
  const zh = read(web, 'src/dv/zh-st.json').st;
  const en = read(web, 'src/dv/en-st.json').st;
  if (zh.length !== keys.length || en.length !== keys.length) throw new Error(`search-index: ${keys.length} stations, zh ${zh.length}, en ${en.length}`);
  const rows = [];
  keys.forEach((id, i) => {
    const a = zh[i], b = en[i];
    rows.push({
      kind: 'st', id, hash: `#D/${id}`,
      zh: `第 ${i + 1}/${keys.length} 站 · ${a.n}`, en: `${i + 1}/${keys.length} · ${b.n}`,
      z: clip(`${a.s || ''} ${a.ly?.hook || ''} ${a.e || ''}`),
      e: clip(`${b.s || ''} ${b.ly?.hook || ''} ${b.e || ''}`),
    });
  });
  const groups = [['src/l4/c/k-zh.json', 'src/l4/c/k-en.json'], ['src/l4/c/k1-zh.json', 'src/l4/c/k1-en.json'], ['src/l4/c/k3-zh.json', 'src/l4/c/k3-en.json']];
  for (const [zf, ef] of groups) {
    const Z = read(web, zf), E = read(web, ef);
    for (const id of Object.keys(Z)) {
      const c = Z[id], d = E[id];
      if (!d) throw new Error('search-index: missing en card ' + id);
      const st = born[id];
      rows.push({
        kind: 'card', id, hash: st ? `#D/${st}~${id}` : `#home~${id}`,
        zh: c.n, en: d.n,
        z: clip(c.s?.[1] || ''),
        e: clip(d.s?.[1] || ''),
      });
    }
  }
  const news = read(web, 'src/hub/news.json');
  for (const w of news.weeks || []) {
    for (const it of w.items || []) {
      rows.push({
        kind: 'news', id: it.id, hash: `#news/${it.id}`,
        zh: clip(it.zh, 80), en: clip(it.en, 120),
        z: clip(`${it.source} ${it.date} ${(it.more?.zh || []).join(' ')}`, 180),
        e: clip(`${it.source} ${it.date} ${(it.more?.en || []).join(' ')}`, 180),
      });
    }
  }
  const tools = read(web, 'src/hub/tools.json');
  let guide = { items: {} };
  try { guide = read(web, 'src/hub/guide.json'); } catch { /* guide is optional for older trees */ }
  for (const t of tools.items || []) {
    const g = guide.items?.[t.id];
    const extraZ = g ? `${g.fit?.[0] || ''} ${g.unfit?.[0] || ''}` : '';
    const extraE = g ? `${g.fit?.[1] || ''} ${g.unfit?.[1] || ''}` : '';
    rows.push({
      kind: 'tool', id: t.id, hash: `#tools/${t.id}`,
      zh: t.name, en: t.name,
      z: clip(`${t.zh} ${extraZ}`), e: clip(`${t.en} ${extraE}`),
    });
  }
  const works = read(web, 'src/work/works.json');
  for (const w of works.items || []) {
    rows.push({
      kind: 'work', id: w.id, hash: `#W/${w.id}`,
      zh: w.zh, en: w.en,
      z: clip(`${w.lead?.[0] || ''} ${w.input?.[0] || ''} ${w.expect?.[0] || ''} ${w.fail?.[0] || ''}`),
      e: clip(`${w.lead?.[1] || ''} ${w.input?.[1] || ''} ${w.expect?.[1] || ''} ${w.fail?.[1] || ''}`),
    });
  }
  return rows;
}
