/* R37: the three areas, side by side but kept apart.
   学 Learn — the knowledge tree: six levels from what you see down to the math; every station sits on one level.
   练 Practice — outside the tree: each station's experiment and quiz, and my learning record (seen / practised /
   mastered, right and wrong, mistakes, the streak).
   享 Share — on top of both: milestone cards and a card per station, each carrying a piece of knowledge + a QR code.
   The 3D tree is the scene above (sc/tree.ts); this module draws the panel under it (beside it in landscape) and the
   share dialog. Its own lazy chunk. */
import { LV, NODES, onLevel } from './c/tree';
import { content, peek } from './c';
import { STATIONS, ZONES, stIcon, stName, tx, type L, type Tx } from './reg';
import * as RC from './rec';
import type { Spec } from './share/card';

export type Area = 'learn' | 'practice' | 'share';
export const A = {
  learn: ['学 · 知识树', 'Learn · the idea tree'], practice: ['练 · 实验和测验', 'Practice · labs & quizzes'], share: ['享 · 分享卡片', 'Share · cards'],
  tl: ['学', 'Learn'], tp: ['练', 'Practice'], ts: ['享', 'Share'], sl: ['知识树', 'idea tree'], sp: ['实验 · 测验', 'labs · quizzes'], ss: ['分享卡片', 'cards'],
  learnI: ['从你看到的开始，一层层往下钻，直到数学。点一个站进去：它的部件、怎么配合、为什么。', 'Start from what you see and drill down level by level to the math. Open a station: its parts, how they work together, and why.'],
  practiceI: ['实验和测验在知识树之外：动手试一试，答几道题，记录会自己更新。', 'Experiments and quizzes sit outside the tree: try things, answer questions, and your record updates itself.'],
  shareI: ['把学到的知识点做成卡片发给朋友，卡片上带着网站二维码。', 'Turn what you learned into a card for a friend, with the site’s QR code on it.'],
  st0: ['没开始', 'Not started'], st1: ['看过', 'Seen'], st2: ['练过', 'Practised'], st3: ['掌握', 'Mastered'],
  right: ['首次答对', 'Right first time'], streak: ['连续天数', 'Days in a row'], mis: ['要再看看的题', 'Questions to look at again'], none: ['还没有错题，真棒！', 'No mistakes yet. Nice!'],
  lab: ['🔬 实验', '🔬 Lab'], quiz: ['❓ 测验', '❓ Quiz'], map: ['🗺️ 五个区的地图', '🗺️ The map of five zones'], go: ['进去', 'Open'],
  ms: ['里程碑卡片', 'Milestone cards'], nodes: ['知识点卡片', 'Knowledge cards'], make: ['做卡片', 'Make card'], locked: ['还没解锁', 'Locked'],
  nodesI: ['挑一个你看过的站（看过的排在前面）。', 'Pick a station you have seen (seen ones first).'],
  shareB: ['分享', 'Share'], save: ['保存图片', 'Save image'], copy: ['复制链接', 'Copy link'], copied: ['链接已复制', 'Link copied'], saved: ['图片已保存', 'Image saved'],
  story: ['9:16 竖版', '9:16 story'], post: ['4:5 帖子', '4:5 post'], close: ['关闭', 'Close'], card: ['分享卡片', 'Share card'],
  rot: ['竖着拿手机看更舒服', 'Turn your phone upright for the best view'],
} satisfies Record<string, Tx>;
type K = keyof typeof A;
export interface Ctx { lang: L; area: Area; rec: RC.Rec; done: Set<string>; now: number }
const tl = (c: Ctx, k: K) => tx(A[k], c.lang);
const SCOL = ['#cbd5e1', '', '#14b8a6', '#eab308'];
const dot = (c: Ctx, s: string) => { const v = RC.status(c.rec, s, c.done); return `<i class="w3-sd s${v}" style="--c:${v === 1 ? LV[NODES[s]!.lv]!.c : SCOL[v]}" aria-label="${tl(c, (['st0', 'st1', 'st2', 'st3'] as const)[v])}"></i>`; };
/** stations in tree order (level by level) */
export const treeOrder = () => LV.flatMap((_, k) => onLevel(k, STATIONS));
/** the three tabs that switch areas */
export const tabs = (c: Ctx) => `<nav class="w3-ax" role="tablist">${(['learn', 'practice', 'share'] as const).map((a, i) => `<button type="button" role="tab" class="w3-at a${i}${a === c.area ? ' on' : ''}" aria-selected="${a === c.area}" data-act="goto" data-h="#${a}"><b>${tl(c, (['tl', 'tp', 'ts'] as const)[i]!)}</b><span>${tl(c, (['sl', 'sp', 'ss'] as const)[i]!)}</span></button>`).join('')}</nav>`;
const levelHead = (c: Ctx, k: number) => `<h3 class="w3-lh" data-lv="${k}" style="--c:${LV[k]!.c}"><em>L${k}</em>${tx(LV[k]!.n, c.lang)}<small>${tx(LV[k]!.s, c.lang)}</small></h3>`;
function learn(c: Ctx) {
  return `<p class="w3-ai">${tl(c, 'learnI')}</p>` + LV.map((_, k) => `<section class="w3-lvl" data-lv="${k}">${levelHead(c, k)}<div class="w3-chips">${onLevel(k, STATIONS).map((s) => `<button type="button" class="w3-chip" data-act="goto" data-h="#${s}" data-s="${s}">${dot(c, s)}${stIcon(s)} ${stName(s, c.lang)}</button>`).join('')}</div></section>`).join('')
    + `<button type="button" class="p3-row w3-mapl" data-act="goto" data-h="#map">${tl(c, 'map')}</button>`;
}
function practice(c: Ctx) {
  const n = [0, 0, 0, 0]; for (const s of STATIONS) n[RC.status(c.rec, s, c.done)]!++;
  const a = RC.acc(c.rec), sk = RC.streak(c.rec, c.now);
  const tiles = `<div class="w3-tiles">${[[n[1]! + n[2]! + n[3]!, 'st1'], [n[2]! + n[3]!, 'st2'], [n[3]!, 'st3'], [`${a.ok}/${a.n}`, 'right'], [sk, 'streak']].map(([v, k]) => `<div class="w3-tile"><b>${v}</b><span>${tl(c, k as K)}</span></div>`).join('')}</div>`;
  const mis = c.rec.mis.slice(-6).reverse().map((m) => { const [s, q] = m.split('/') as [string, string]; const cc = peek(s), qq = cc?.quiz[+q]; const p = cc ? cc.ideas.length + 1 : 0; return `<button type="button" class="p3-row w3-mis" data-act="goto" data-h="#${s}${p ? '/' + p : ''}">${stIcon(s)} <b>${stName(s, c.lang)}</b><small>${qq ? tx(qq.q, c.lang) : '#' + (+q + 1)}</small></button>`; }).join('');
  const rows = LV.map((_, k) => `<section class="w3-lvl" data-lv="${k}">${levelHead(c, k)}${onLevel(k, STATIONS).map((s) => { const cc = peek(s), li = cc ? cc.ideas.length : 0; return `<div class="w3-pr" data-s="${s}">${dot(c, s)}<span class="w3-pn">${stIcon(s)} ${stName(s, c.lang)}</span><button type="button" class="w3-pb" data-act="goto" data-h="#${s}/${li}">${tl(c, 'lab')}</button><button type="button" class="w3-pb" data-act="goto" data-h="#${s}/${li + 1}">${tl(c, 'quiz')}</button></div>`; }).join('')}</section>`).join('');
  return `<p class="w3-ai">${tl(c, 'practiceI')}</p>${tiles}<h3 class="w3-sh">${tl(c, 'mis')}</h3>${mis || `<p class="w3-ai">${tl(c, 'none')}</p>`}${rows}`;
}
/** the milestones: each is a proud line + one knowledge point (a station) */
export function milestones(c: Ctx): { id: string; icon: string; head: string; ok: boolean; s: string }[] {
  const zh = c.lang === 'zh', seen = treeOrder().filter((s) => RC.status(c.rec, s, c.done) > 0), deepest = seen[seen.length - 1] ?? 'T1';
  const a = RC.acc(c.rec), sk = RC.streak(c.rec, c.now), best = Object.entries(c.rec.st).sort((p, q) => (q[1].r ?? 0) - (p[1].r ?? 0))[0]?.[0] ?? 'T3';
  const lvDone = LV.map((_, k) => onLevel(k, STATIONS).every((s) => c.done.has(s))).lastIndexOf(true), zDone = ZONES.findIndex((z) => z.st.every((s) => c.done.has(s)));
  const lvs = new Set(seen.map((s) => NODES[s]!.lv)), maxLv = seen.length ? Math.max(...lvs) : 0;
  return [
    { id: 'first', icon: '🚀', ok: seen.length > 0, s: seen[0] ?? 'T1', head: zh ? '我开始拆解 AI 啦' : 'I started taking AI apart' },
    { id: 'streak', icon: '🔥', ok: sk >= 2, s: deepest, head: zh ? `连续学习 ${Math.max(sk, 2)} 天` : `${Math.max(sk, 2)} days in a row` },
    { id: 'score', icon: '🎯', ok: a.n >= 3, s: best, head: zh ? `测验首次答对 ${a.ok}/${a.n} 题` : `${a.ok}/${a.n} right first time` },
    lvDone >= 0 ? { id: 'level', icon: '🏆', ok: true, s: onLevel(lvDone, STATIONS).at(-1)!, head: zh ? `学完一整层：${tx(LV[lvDone]!.n, c.lang)}` : `Finished a level: ${tx(LV[lvDone]!.n, c.lang)}` }
      : { id: 'level', icon: '🏆', ok: zDone >= 0, s: zDone >= 0 ? ZONES[zDone]!.st.at(-1)! : 'T4', head: zDone >= 0 ? (zh ? `学完一个区：${tx(ZONES[zDone]!.name, c.lang)}` : `Finished a zone: ${tx(ZONES[zDone]!.name, c.lang)}`) : (zh ? '学完一整层' : 'Finished a level') },
    { id: 'curious', icon: '🔭', ok: lvs.size >= 4 || seen.length >= 8, s: deepest, head: zh ? `好奇宝宝：一路钻到 L${maxLv}` : `Curious explorer: down to L${maxLv}` },
  ];
}
function share(c: Ctx) {
  const ms = milestones(c).map((m) => `<div class="w3-ms${m.ok ? '' : ' off'}"><span class="w3-mi">${m.icon}</span><span class="w3-mt"><b>${m.head}</b><small>${stIcon(m.s)} ${stName(m.s, c.lang)}</small></span><button type="button" class="w3-pb" data-act="card" data-k="${m.id}" data-s="${m.s}" data-head="${m.head}" data-badge="${m.icon}"${m.ok ? '' : ' disabled'}>${tl(c, m.ok ? 'make' : 'locked')}</button></div>`).join('');
  const ord = treeOrder(), st = [...ord.filter((s) => RC.status(c.rec, s, c.done) > 0), ...ord.filter((s) => !RC.status(c.rec, s, c.done))];
  return `<p class="w3-ai">${tl(c, 'shareI')}</p><h3 class="w3-sh">${tl(c, 'ms')}</h3>${ms}<h3 class="w3-sh">${tl(c, 'nodes')}</h3><p class="w3-ai">${tl(c, 'nodesI')}</p><div class="w3-chips">${st.map((s) => `<button type="button" class="w3-chip" data-act="card" data-k="node" data-s="${s}">${dot(c, s)}${stIcon(s)} ${stName(s, c.lang)}</button>`).join('')}</div>`;
}
/** draw the panel of an area */
export function panel(el: HTMLElement, c: Ctx) {
  el.innerHTML = `${tabs(c)}<div class="w3-ab" data-area="${c.area}">${c.area === 'learn' ? learn(c) : c.area === 'practice' ? practice(c) : share(c)}</div><p class="w3-rot">📱 ${tl(c, 'rot')}</p>`;
  el.dataset.area = c.area;
  if (c.area === 'practice' && STATIONS.some((s) => !peek(s))) void Promise.all(ZONES.map((z) => content(z.st[0]!))).then(() => { if (el.dataset.area === 'practice' && el.isConnected) panel(el, c); }).catch(() => { /* names only */ });
}
/** bring a level's section into view and light it */
export function level(el: HTMLElement, k: number | null) {
  el.querySelectorAll('.w3-lvl').forEach((s) => s.classList.toggle('on', k !== null && (s as HTMLElement).dataset.lv === String(k)));
  if (k !== null) el.querySelector<HTMLElement>(`.w3-lvl[data-lv="${k}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
/* ---------- the share dialog ---------- */
let busy = 0;
export async function card(host: HTMLElement, lang: L, sp: Spec, toast: (s: string) => void): Promise<HTMLElement> {
  const my = ++busy, C = await import('./share/card'), T = (k: K) => tx(A[k], lang);
  const d = await C.data(sp, lang); if (my !== busy) return host;
  host.querySelector('.w3-sc')?.remove();
  const el = host.ownerDocument.createElement('div'); el.className = 'w3-sc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', T('card'));
  el.innerHTML = `<div class="w3-sc-in"><button type="button" class="p3x w3-scx" aria-label="${T('close')}">✕</button><div class="w3-sc-f" role="tablist"><button type="button" class="on" data-f="story">${T('story')}</button><button type="button" data-f="post">${T('post')}</button></div>
<div class="w3-sc-p"><img alt=""></div><div class="w3-sc-a"><button type="button" class="p3-btn w3-go" data-x="share">${T('shareB')}</button><button type="button" class="p3-btn" data-x="save">${T('save')}</button><button type="button" class="p3-btn" data-x="copy">${T('copy')}</button></div></div>`;
  host.appendChild(el);
  const img = el.querySelector('img')!; let fmt: 'story' | 'post' = 'story', blob: Blob | null = null, url = '';
  el.dataset.url = d.url; el.dataset.text = C.words(d); el.dataset.kind = sp.kind; img.alt = `${d.name}: ${d.idea}`;
  const render = async () => {
    const cv = C.draw(d, fmt, host.ownerDocument); blob = await C.png(cv);
    if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); img.src = url;
    el.dataset.fmt = fmt; el.dataset.w = String(cv.width); el.dataset.h = String(cv.height); el.dataset.bytes = String(blob.size);
  };
  await render();
  const ev = (n: string) => { void import('../analytics').then((m) => m.event(n)).catch(() => { /* offline */ }); };
  ev(`share-card-${sp.kind}`);
  const file = () => new File([blob!], `ai-explained-${sp.s}-${fmt}.png`, { type: 'image/png' });
  const save = () => { const a = host.ownerDocument.createElement('a'); a.href = url; a.download = file().name; host.ownerDocument.body.appendChild(a); a.click(); a.remove(); };
  const copy = async () => { try { await navigator.clipboard.writeText(d.url); } catch { /* no clipboard */ } toast(T('copied')); };
  el.addEventListener('click', async (e) => {
    e.stopPropagation();
    const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) { if (e.target === el) close(); return; }
    if (b.classList.contains('w3-scx')) { close(); return; }
    if (b.dataset.f) { fmt = b.dataset.f as typeof fmt; el.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b)); await render(); return; }
    const x = b.dataset.x; ev(`share-${x}`);
    if (x === 'share') {
      const nav = navigator as Navigator & { canShare?: (d: object) => boolean; share?: (d: object) => Promise<void> }, f = file();
      try {
        if (nav.canShare?.({ files: [f] }) && nav.share) { await nav.share({ files: [f], title: d.site, text: `${d.name}: ${d.idea}`, url: d.url }); return; }
        if (nav.share) { await nav.share({ title: d.site, text: `${d.name}: ${d.idea}`, url: d.url }); return; }
      } catch { return; /* cancelled */ }
      save(); await copy(); toast(T('saved'));
    } else if (x === 'save') { save(); toast(T('saved')); } else if (x === 'copy') await copy();
  });
  const close = () => { el.remove(); if (url) URL.revokeObjectURL(url); host.dataset.sc = ''; };
  host.dataset.sc = '1';
  return el;
}
