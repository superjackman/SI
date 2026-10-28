/* R38: the knowledge-card bottom sheet. Page 1 = mini diagram + ① ② ③ ④, page 2 「（续）」 = ⑤.
   Footer: 看数学 (to the layer-5 card) / 返回 / （续） / 分享 (a 1080×1920 or 1080×1350 picture with a local QR code). */
import { cards, type Card } from './c/kc';
import { K_MATH, NODES, UI, tx, type L, type Nd } from './txt';
import { lxMini } from '../lx/mini';

const MINI: Record<Nd, [string, string]> = { in: ['输入', 'Input'], tok: ['分词', 'Tokenize'], emb: ['词向量+位置', 'Embed+pos'], att: ['多头注意力', 'Attention'], an1: ['加+归一化', 'Add+Norm'], ffn: ['前馈网络', 'Feed-forward'], an2: ['加+归一化', 'Add+Norm'], lin: ['线性层', 'Linear'], sm: ['Softmax', 'Softmax'], out: ['概率', 'Odds'] };
function mini(c: Card, l: L) {
  if (c.mk) return lxMini({ mk: c.mk, hl: c.hl, ar: c.ar ?? [], fr: c.fr }, l);
  const w = 104, bh = 17, g = 4, top = 6; let s = '', y = top; const pos = {} as Record<Nd, number>;
  for (const n of [...NODES].reverse()) { if (n === 'an2') y += 6; pos[n] = y; y += bh + g; if (n === 'att') y += 4; }
  const fy = pos.an2 - 5, fh = pos.att + bh + 5 - fy;
  s += `<rect x="2" y="${fy}" width="${w + 8}" height="${fh}" rx="6" fill="none" stroke="${c.fr ? '#9cc8ff' : '#4a66b8'}" ${c.fr ? 'stroke-width="2"' : 'stroke-dasharray="4 3"'}/>`;
  for (const n of NODES) {
    const on = c.hl.includes(n), bk = on && c.bk, f = bk ? '#3b1f0a' : on ? '#1c3f9e' : '#0c1a3d', st = bk ? '#ff9a3c' : on ? '#9cc8ff' : '#33508f';
    s += `<rect x="6" y="${pos[n]}" width="${w}" height="${bh}" rx="5" fill="${f}" stroke="${st}"${on ? ` style="filter:drop-shadow(0 0 3px ${st})"` : ''}/>`;
    s += `<text x="${6 + w / 2}" y="${pos[n] + 12.5}" text-anchor="middle" font-size="12" fill="${on ? '#fff' : '#b7c6ea'}">${tx(MINI[n], l)}</text>`;
  }
  return `<svg class="l4-mini" width="${w + 12}" height="${y}" viewBox="0 0 ${w + 12} ${y}" aria-hidden="true">${s}</svg>`;
}
type T2 = readonly [string, string];
/** the layer a card belongs to: header tag and the share picture's layer line and colour */
function lvOf(id: string): { tag: T2 | null; lv: T2; c: string } {
  if (id.startsWith('KM')) return { tag: ['第5层 · 数学', 'Layer 5 · maths'], lv: ['第5层 · 背后的数学', 'Layer 5 · The maths'], c: '#7c3aed' };
  if (id.startsWith('KA')) return { tag: ['第1层 · 知识卡', 'Layer 1 · card'], lv: ['第1层 · 用户怎么用 AI 助手', 'Layer 1 · Using an AI assistant'], c: '#0891b2' };
  if (id.startsWith('KB')) return { tag: ['第2层 · 知识卡', 'Layer 2 · card'], lv: ['第2层 · Agent 原理', 'Layer 2 · How an Agent works'], c: '#0d9488' };
  if (id.startsWith('KC')) return { tag: ['第3层 · 知识卡', 'Layer 3 · card'], lv: ['第3层 · 大模型原理', 'Layer 3 · How an LLM works'], c: '#4f46e5' };
  return { tag: null, lv: ['第4层 · Transformer 内部', 'Layer 4 · Inside a Transformer'], c: '#2563eb' };
}
const strip = (h: string) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
const sec = (n: string, cls: string, h: string, body: string) => `<section class="l4-ks"><h3 class="l4-kh ${cls}">${n}</h3><div class="l4-kbd">${body || h}</div></section>`;

/** layer-jump buttons on the last card of a layer (reference KA06 / KB07) */
const K_GO: Record<string, [readonly [string, string], string]> = { KA06: [['进入第2层 ›', 'Go to layer 2 ›'], '#L2'], KB07: [['进入第3层 ›', 'Go to layer 3 ›'], '#L3'] };
export interface SheetApi { close(): void }
/** open card `id` (page p) inside `host`; `go` changes the hash */
export async function openCard(host: HTMLElement, l: L, id: string, p: 1 | 2, go: (suffix: string | null) => void, pageUrl: string): Promise<void> {
  const all = await cards(l, id), c = all[id]; host.querySelector('.l4-sheet')?.remove(); if (!c) return;
  const T = (k: keyof typeof UI) => tx(UI[k] as readonly [string, string], l), km = id.startsWith('KM'), math = km ? null : K_MATH[id] ?? null, LV = lvOf(id);
  const el = document.createElement('div'); el.className = 'l4-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${T('kcT')} ${id} ${c.n}`); el.dataset.card = id; el.dataset.p = String(p);
  const head = `<header class="l4-sh"><span class="l4-kid">${id}</span><b class="l4-kn">${c.n}</b><span class="l4-ktag">${LV.tag ? tx(LV.tag, l) : T('kcT')}${p === 2 ? ' ' + tx(['（续）', '(cont.)'], l) : ''}</span></header>`;
  const body = p === 1
    ? `<div class="l4-k1">${mini(c, l)}<div class="l4-k12">${sec(T('s1'), 'c1', c.s[0], '')}${sec(T('s2'), 'c2', c.s[1], '')}<p class="l4-knote">${c.no || T('litNote')}</p></div></div>${sec(T('s3'), 'c3', c.s[2], '')}${sec(T('s4'), 'c4', c.s[3], '')}`
    : sec(T('s5'), 'c5', c.s[4], '');
  el.innerHTML = `<div class="l4-sin">${head}<div class="l4-sbody">${body}</div><footer class="l4-sf">${K_GO[id] ? `<button type="button" class="l4-b gold" data-s="jump">${tx(K_GO[id]![0], l)}</button>` : ''}${math ? `<button type="button" class="l4-b gold" data-s="math">${T('math')}</button>` : ''}<button type="button" class="l4-b" data-s="close">${T('back')}</button><button type="button" class="l4-b" data-s="flip">${p === 1 ? T('cont') : T('prev')}</button><button type="button" class="l4-b" data-s="share">${T('shareB')}</button></footer><div class="l4-shr" hidden></div></div>`;
  host.appendChild(el);
  const sb = el.querySelector<HTMLElement>('.l4-sbody')!, more = () => sb.classList.toggle('more', sb.scrollTop + sb.clientHeight < sb.scrollHeight - 4);
  more(); sb.addEventListener('scroll', more, { passive: true });
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) { if (e.target === el) go(null); return; }
    e.stopPropagation(); const s = b.dataset.s;
    if (s === 'close') go(null); else if (s === 'flip') go(p === 1 ? `${id}.2` : id); else if (s === 'math' && math) go(math);
    else if (s === 'jump' && K_GO[id]) { el.remove(); window.location.hash = K_GO[id]![1]; }
    else if (s === 'share') void share(el.querySelector<HTMLElement>('.l4-shr')!, l, id, c, pageUrl);
    else if (b.dataset.f) void share(el.querySelector<HTMLElement>('.l4-shr')!, l, id, c, pageUrl, b.dataset.f as 'story' | 'post');
  });
  el.querySelector<HTMLElement>('.l4-b')?.focus({ preventScroll: true });
}

async function share(box: HTMLElement, l: L, id: string, c: Card, url: string, fmt: 'story' | 'post' = 'story') {
  const D = await import('./share/draw'), tmp = document.createElement('div'); tmp.innerHTML = c.s[2];
  const parts = Array.from(tmp.querySelectorAll('li')).slice(0, 3).map((li) => { const k = li.querySelector('.k')?.textContent ?? ''; return { n: k, s: (li.textContent ?? '').replace(k, '').replace(/^[：:\s]+/, '') }; });
  const how = document.createElement('div'); how.innerHTML = c.s[3]; how.querySelectorAll('.ex,.sub').forEach((x) => x.remove());
  const why = document.createElement('div'); why.innerHTML = c.s[4]; const wl = Array.from(why.querySelectorAll('div')).map((x) => strip(x.innerHTML));
  const d = {
    site: tx(D.SITE_N, l), url, lv: tx(lvOf(id).lv, l), lvC: lvOf(id).c, path: `${id} · ${tx(UI.kcT, l)}`, icon: '🧩', name: c.n, idea: strip(c.s[1]), parts,
    co: strip(how.innerHTML).slice(0, 160), why: (wl.find((s) => /^(设计|为什么行得通|Design|Why it works)/.test(s)) ?? wl[wl.length - 1] ?? '').replace(/^(设计|为什么行得通|Design|Why it works)\s*/, '').slice(0, 160),
    head: '', badge: id, scan: tx(['扫码一层层看懂 AI', 'Scan to see AI layer by layer'], l), how: tx(['怎么配合', 'How it works'], l), whyT: tx(['为什么这么设计', 'Why so'], l),
  };
  const cv = D.draw(d, fmt), blob = await D.png(cv), src = URL.createObjectURL(blob);
  box.hidden = false; box.dataset.w = String(cv.width); box.dataset.h = String(cv.height); box.dataset.bytes = String(blob.size); box.dataset.text = D.words(d);
  box.innerHTML = `<div class="l4-shf"><button type="button" class="l4-b${fmt === 'story' ? ' on' : ''}" data-f="story">1080×1920</button><button type="button" class="l4-b${fmt === 'post' ? ' on' : ''}" data-f="post">1080×1350</button><button type="button" class="l4-b gold" data-x="go">${tx(UI.shareB, l)}</button></div><img alt="${c.n}" src="${src}">`;
  box.querySelector<HTMLElement>('[data-x="go"]')!.onclick = async (e) => {
    e.stopPropagation(); const f = new File([blob], `ai-explained-${id}-${fmt}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: object) => boolean; share?: (d: object) => Promise<void> };
    try { if (nav.canShare?.({ files: [f] }) && nav.share) { await nav.share({ files: [f], title: d.site, text: `${d.name}: ${d.idea}`, url }); return; } } catch { return; }
    const a = document.createElement('a'); a.href = src; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  };
}
