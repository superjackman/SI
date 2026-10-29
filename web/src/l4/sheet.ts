/* R38: the knowledge-card bottom sheet. Page 1 = mini diagram + ① ② ③ ④, page 2 「（续）」 = ⑤.
   Footer (R44): ⓘ 看数学 · the jump › · ⤴ 分享 (the share dialog), then ‹ 上页 · 第 p / 2 页 · 下页 ›; ✕ top right. */
import { cards, type Card } from './c/kc';
import { K_MATH, NODES, UI, tx, type L, type Nd } from './txt';
import { lxMini } from '../lx/mini';
import { lvOf } from './share/card';

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
const sec = (n: string, cls: string, h: string, body: string) => `<section class="l4-ks"><h3 class="l4-kh ${cls}">${n}</h3><div class="l4-kbd">${body || h}</div></section>`;

/** layer-jump buttons on the last card of a layer (reference KA06 / KB07) */
const K_GO: Record<string, [readonly [string, string], string]> = { KA06: [['进入第2层 ›', 'Go to layer 2 ›'], '#L2'], KB07: [['进入第3层 ›', 'Go to layer 3 ›'], '#L3'] };
/** KM card → the M page that uses it (reference footer 「看它在哪用 › … 对应 Mn」) */
const KM_USE: Record<string, string> = { KM01: 'M1a', KM02: 'M2a', KM03: 'M3a', KM04: 'M4a', KM05: 'M4b', KM06: 'M5a', KM07: 'M5a', KM08: 'M6a', KM09: 'M7a', KM10: 'M6c', KM11: 'M8', KM12: 'M2d' };
/** reference footer 「… · 对应第5层·交叉熵」: the M group by name, never its id (C5) */
const KM_NM: Record<string, readonly [string, string]> = { M1: ['向量', 'Vectors'], M2: ['点积', 'Dot product'], M3: ['矩阵乘法', 'Matrices'], M4: ['softmax', 'Softmax'], M5: ['交叉熵', 'Cross-entropy'], M6: ['梯度', 'Gradients'], M7: ['链式法则', 'Chain rule'], M8: ['归一化', 'Normalisation'] };
export interface SheetApi { close(): void }
/** open card `id` (page p) inside `host`; `go` changes the hash */
export async function openCard(host: HTMLElement, l: L, id: string, p: 1 | 2, go: (suffix: string | null) => void, _pageUrl: string, q?: { i: number; n: number; next: () => void }): Promise<void> {
  const all = await cards(l, id), c = all[id]; host.querySelector('.l4-sheet:not(.l4-set)')?.remove(); if (!c) return;
  const T = (k: keyof typeof UI) => tx(UI[k] as readonly [string, string], l), km = id.startsWith('KM'), math = km ? null : K_MATH[id] ?? null, LV = lvOf(id);
  const jg: [readonly [string, string], string] | undefined = K_GO[id] ?? (KM_USE[id] ? [['看它在哪用 ›', 'Where it is used ›'], '#L5/' + KM_USE[id]] : undefined);
  const el = document.createElement('div'); el.className = 'l4-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${T('kcT')} ${id} ${c.n}`); el.dataset.card = id; el.dataset.p = String(p); if (q) el.classList.add('q');
  const head = `<header class="l4-sh"><span class="l4-kid">${id}</span><b class="l4-kn">${c.n}</b><span class="l4-ktag">${LV.tag ? tx(LV.tag, l) : T('kcT')}${p === 2 ? ' ' + tx(['（续）', '(cont.)'], l) : ''}</span></header>`;
  const body = p === 1
    ? `<div class="l4-k1">${mini(c, l)}<div class="l4-k12">${sec(T('s1'), 'c1', c.s[0], '')}${sec(T('s2'), 'c2', c.s[1], '')}<p class="l4-knote">${c.no || T('litNote')}</p></div></div>${sec(T('s3'), 'c3', c.s[2], '')}${sec(T('s4'), 'c4', c.s[3], '')}`
    : sec(T('s5'), 'c5', c.s[4], '');
  const z = (a: string, b: string) => tx([a, b], l), jt = jg ? tx(jg[0], l).replace(/\s*›$/, '') : '';
  const foot = `<footer class="l4-sf g-sf"><div class="g-l">${math ? `<button type="button" class="l4-b g-info" data-s="math">${T('math')}</button>` : ''}${jg ? `<button type="button" class="l4-b g-jump" data-s="jump">${jt}</button>` : ''}<button type="button" class="l4-b g-act" data-s="share">⤴ ${T('shareB')}</button></div>
<div class="g-pg"><button type="button" class="g-prev" data-s="flip"${p === 1 ? ' disabled' : ''}>‹ ${z('上页', 'Prev page')}</button><span class="g-mid"><span class="g-dots" aria-hidden="true"><i class="${p === 1 ? 'on' : 'd'}"></i><i class="${p === 2 ? 'on' : ''}"></i></span><span>${z(`第 ${p} / 2 页`, `Page ${p} / 2`)}</span></span><button type="button" class="g-next" data-s="flip"${p === 2 ? ' disabled' : ''}>${z('下页', 'Next page')} ›</button></div>
<small class="l4-sfh">${q ? z(`下滑或点 ✕ 关闭（只是收起卡片，不换页）· 快速路径第 ${q.i}/${q.n} 站`, `Swipe down or ✕ to close (just hides the card) · quick path stop ${q.i}/${q.n}`) : KM_USE[id] ? z('下滑或点 ✕ 关闭（只是收起卡片，不换页）· 对应第5层·' + KM_NM[KM_USE[id]!.slice(0, 2)]![0], 'Swipe down or ✕ to close (just hides the card) · Layer 5 · ' + KM_NM[KM_USE[id]!.slice(0, 2)]![1]) : z('下滑或点 ✕ 关闭（只是收起卡片，不换页）', 'Swipe down or ✕ to close (just hides the card)')}</small></footer>`;
  el.innerHTML = `<div class="l4-sin">${head}<button type="button" class="g-x g-shx" data-s="close" aria-label="${T('close')}">✕</button><div class="l4-sbody">${body}</div>${foot}</div>`;
  host.appendChild(el);
  const sb = el.querySelector<HTMLElement>('.l4-sbody')!, more = () => sb.classList.toggle('more', sb.scrollTop + sb.clientHeight < sb.scrollHeight - 4);
  more(); sb.addEventListener('scroll', more, { passive: true });
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) { if (e.target === el) go(null); return; }
    e.stopPropagation(); const s = b.dataset.s;
    if (s === 'close') go(null); else if (s === 'flip') go(p === 1 ? `${id}.2` : id); else if (s === 'math' && math) go(math);
    else if (s === 'jump' && jg) { el.remove(); window.location.hash = jg[1]; }
    else if (s === 'share') void import('./share/modal').then((M) => M.cardShare(host, l, id, c));
  });
  // the reference's gestures: swipe down to close, left / right to turn the page
  let x0 = 0, y0 = 0, on = false;
  el.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (!t || e.touches.length > 1) { on = false; return; } x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0]; if (!on || !t) return; on = false; const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) go(p === 1 ? `${id}.2` : id);
    else if (dy > 80 && dy > 2 * Math.abs(dx) && sb.scrollTop <= 0) go(null);
  }, { passive: true });
  el.querySelector<HTMLElement>('.g-shx')?.focus({ preventScroll: true });
}
