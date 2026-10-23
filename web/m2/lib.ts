/* M2 ("using agents") authoring helpers: build station snapshots and popup cards in the same markup as the
   live-page snapshots in src/legacy/gen, so the shell treats U…Ud exactly like the other stations.
   Text is written once per string as t(zh, en); names shared with the app come from src/i18n/codes.ts. */
import { CODES } from '../src/i18n/codes';

export type Lang = 'zh' | 'en';
export type Bi = { zh: string; en: string };
export type T = (zh: string, en: string) => string;
export type OutlineRow = [string, string, '' | 'lab' | 'quiz', number];

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
/** every KaTeX block (inline span.katex or display span.katex-display) in an HTML string, replaced by its TeX source: the
    plain-text form of a formula for places that cannot carry HTML (outline buttons, aria-labels, titles). Removing tags alone
    would leave the MathML and the HTML rendering side by side ("y=Wxy=Wx"). */
export function mathText(html: string): string {
  const open = /<span class="katex(?:-display)?">/g; let out = '', at = 0, mm: RegExpExecArray | null;
  while ((mm = open.exec(html))) {
    let depth = 0, i = mm.index; const tag = /<\/?span\b[^>]*>/g; tag.lastIndex = i; let t: RegExpExecArray | null;
    while ((t = tag.exec(html))) { depth += t[0][1] === '/' ? -1 : 1; if (!depth) break; }
    if (!t) throw new Error('mathText: unbalanced KaTeX markup');
    const block = html.slice(i, tag.lastIndex), tex = /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/.exec(block);
    if (!tex) throw new Error('mathText: KaTeX block without a TeX annotation');
    out += html.slice(at, i) + tex[1]; at = open.lastIndex = tag.lastIndex;
  }
  return out + html.slice(at);
}
export const strip = (s: string) => mathText(s).replace(/<[^>]*>/g, '').replace(/&(?:(amp|lt|gt|quot)|#x([0-9a-f]+)|#(\d+));/gi, (_m, k?: string, hx?: string, dc?: string) => (k ? ({ amp: '&', lt: '<', gt: '>', quot: '"' })[k.toLowerCase()] as string : String.fromCodePoint(hx ? parseInt(hx, 16) : Number(dc))));
export const code = (k: keyof typeof CODES, L: Lang): string => CODES[k][L];

/** a station or part name resolver handed in by the build (kb.json + the M2 parts) */
export interface World {
  order: string[]; path: Record<string, string[]>; tabn: Record<string, Bi>;
  part: (id: string) => { n: Bi; t: string } | undefined;
}

const ZL: Record<number, [string, Bi]> = {
  1: ['z2', { zh: '② 结构图', en: '② Diagram' }],
  2: ['zm', { zh: '③ 细节·为什么', en: '③ Details · why' }],
  3: ['z3', { zh: '③ 动手演示', en: '③ Hands-on demo' }],
};
export interface CardOpt { h2?: boolean; closed?: boolean; tag?: Bi; cls?: string; noMap?: boolean }

/** one station page under construction */
export class Page {
  rows: OutlineRow[] = [];
  out: string[] = [];
  readonly t: T;
  constructor(readonly S: string, readonly L: Lang, readonly W: World) { this.t = (zh, en) => (L === 'en' ? en : zh); }
  name(id: string) { const p = this.W.part(id); if (!p) throw new Error('unknown part ' + id); return p.n[this.L]; }
  st(s: string) { const n = this.W.tabn[s]; if (!n) throw new Error('unknown station ' + s); return n[this.L]; }
  /** inline link that opens a part's popup (works across stations) */
  open(id: string, label?: string) { return `<a data-open="${id}">${label ?? esc(this.name(id))}</a>`; }
  go(s: string, label?: string) { return `<a data-go="${s}">${label ?? esc(this.st(s))}</a>`; }
  tag(b?: Bi) { const x = b ?? { zh: code('use.demo', 'zh'), en: code('use.demo', 'en') }; return `<span class="tag demo tag-s" title="${esc(x[this.L])}">${esc(x[this.L])}</span>`; }
  card(id: string, z: 1 | 2 | 3, title: string, body: string, o: CardOpt = {}) {
    const [zc, zl] = ZL[z] as [string, Bi];
    const h = o.h2 ? 'h2' : 'h3';
    this.out.push(`<div class="card has-meta${o.cls ? ' ' + o.cls : ''}${o.closed ? ' cc-closed' : ''}" id="${id}" data-z="${z}" data-zl="${zl[this.L]}" data-nh="1" data-cc="1">
<div class="cc-meta"><span class="zl ${zc}">${zl[this.L]}</span>${o.tag ? this.tag(o.tag) : ''}</div><${h}><button type="button" class="cc-h" aria-expanded="${o.closed ? 'false' : 'true'}">${title}</button></${h}><div class="cc-body">
${body}
</div></div>`);
    if (!o.noMap) this.rows.push([id, strip(title), '', z]);
  }
  labDivider() { this.out.push(`<div class="lab-divider" data-z="3"><span>${this.t('🧪 动手实验室：', '🧪 Hands-on lab: ')}${esc(this.st(this.S))}</span></div>`); }
  lab(id: string, title: string, note: string, why: string[], body: string, obs: string[]) {
    const demo = { zh: code('use.demo', 'zh'), en: code('use.demo', 'en') };
    this.out.push(`<div class="card lab has-meta" id="${id}" data-z="3" data-zl="${this.t('🧪 动手实验', '🧪 Lab')}" data-nh="1">
<div class="cc-meta"><span class="zl z3">${this.t('🧪 动手实验', '🧪 Lab')}</span>${this.tag(demo)}</div><h3>🧪 ${title}</h3><p class="tag-note">ⓘ ${note}</p>
<div class="lab-why bz"><div class="bz-h"><b>${this.t('设计动机：', 'Why it’s built this way:')}</b></div><ul class="pts">${why.map((w) => `<li>${w}</li>`).join('')}</ul></div>
${body}
<div class="lab-obs bz"><div class="bz-h"><b>${this.t('👀 试试：', '👀 Try this:')}</b></div><ul class="pts">${obs.map((w) => `<li>${w}</li>`).join('')}</ul></div>
</div>`);
    this.rows.push([id, '🧪 ' + strip(title), 'lab', 3]);
  }
  quiz() {
    const zl = this.t('❓ 小测验', '❓ Quiz');
    this.out.push(`<div class="card quiz has-meta" id="quiz${this.S}" data-sec="${this.S}" data-z="3" data-zl="${zl}" data-nh="1"></div>`);
    this.rows.push(['quiz' + this.S, this.t('❓ 小测验：', '❓ Quiz: ') + this.st(this.S), 'quiz', 3]);
  }
  raw(html: string) { this.out.push(html); }
  /** the page head: title, one-liner, notes, stop n of N, breadcrumb, page map */
  head(sub: string, one: string, why: string) {
    const i = this.W.order.indexOf(this.S), N = this.W.order.length, L = this.L;
    const crumb = (this.W.path[this.S] ?? []).map((s) => this.st(s)).join(' › ');
    const cut = (s: string) => [...s].slice(0, L === 'en' ? 18 : 16).join('');
    const map = this.rows.filter((r) => r[2] !== 'quiz').map((r) => `<button class="${r[3] === 3 ? 'l3' : ''}" data-sj="${r[0]}" data-sp="${this.S}">${esc(cut(r[1]))}</button>`).join('');
    return `<div class="pagehead" id="ph${this.S}"><h1 class="pg-t"><span class="pg-n">${i + 1}</span>${esc(this.st(this.S))}</h1><p class="pg-s">${sub}</p><details class="pg-more"><summary aria-label="${this.t('展开本站说明', 'Expand notes for this stop')}" title="${this.t('本站说明', 'Notes for this stop')}"><span aria-hidden="true">ⓘ</span> ${this.t('说明', 'Notes')}</summary><div class="ph-one">${one}</div><p class="ph-why"><b>${this.t('为什么这样设计：', 'Why it’s designed this way: ')}</b>${why}</p></details><div class="ph-top"><span class="ph-lv">${L === 'en' ? `Stop ${i + 1} of ${N} ` : `第 ${i + 1} 站 / 共 ${N} 站`}</span><span>📍 ${esc(crumb)}</span></div><div class="ph-map" id="pm${this.S}"><span>${this.t('本页结构：', 'On this page: ')}</span>${map}</div><div class="zoomnote" id="zn${this.S}" style="display:none"></div></div>`;
  }
  /** the main diagram block with its viewer bar and legend */
  stage(svg: string, legend: [string, string, string][]) {
    const L = this.L;
    const bar = L === 'en'
      ? '<span class="m-vh">👆 Tap a box for details<br>🤏 Pinch or double-tap</span><button type="button" class="vz" data-vz="out" aria-label="Zoom out">−</button><span class="vp" aria-live="polite">100%</span><button type="button" class="vz" data-vz="in" aria-label="Zoom in">＋</button><button type="button" class="vz" data-vz="reset" aria-label="Reset" disabled="">⟲</button><button type="button" class="vz" data-vz="full" aria-label="View full screen">⛶</button>'
      : '<span class="m-vh">👆 点方块看详情<br>🤏 双指 / 双击放大</span><button type="button" class="vz" data-vz="out" aria-label="缩小">−</button><span class="vp" aria-live="polite">100%</span><button type="button" class="vz" data-vz="in" aria-label="放大">＋</button><button type="button" class="vz" data-vz="reset" aria-label="复位" disabled="">⟲</button><button type="button" class="vz" data-vz="full" aria-label="全屏查看">⛶</button>';
    const lg = legend.map(([c, f, n]) => `<span><i style="--c:${c};--f:${f}"></i>${n}</span>`).join('');
    return `<div class="m-stage"><div class="m-dg main"><div class="m-vbar">${bar}</div><div class="diagram m-vw">${svg}</div></div><details class="m-leg"><summary>${this.t('🎨 图例：颜色是什么意思', '🎨 Legend: what the colours mean')}</summary><div class="legend">${lg}</div></details></div>`;
  }
  foot() { return `<div class="ph-nav m-pn" data-sec="${this.S}"></div>`; }
  html(sub: string, one: string, why: string, stage: string) { return '\n' + this.head(sub, one, why) + stage + '\n' + this.out.join('\n') + '\n' + this.foot() + '\n'; }
}

/* ---------- diagrams ---------- */
export const CAT_COL: Record<string, [string, string]> = {
  use: ['#15803d', '#dcfce7'], agent: ['#a21caf', '#fae8ff'], io: ['var(--io)', 'var(--io-f)'], llm: ['#4338ca', '#e0e7ff'], safe: ['#dc2626', '#fee2e2'],
};
export interface Box { id: string; x: number; y: number; w: number; h: number; t: string; s?: string[]; fs?: number; zoom?: boolean; cat: string }
/** one tappable part box (g.comp). Chinese lines are pre-broken by the author; English is wrapped by the app's fitter */
export function comp(b: Box, L: Lang, label: string) {
  const cx = b.x + b.w / 2, sub = b.s ?? [];
  const tFs = b.fs ?? 15, lines = 1 + sub.length;
  const block = 18 + (lines - 1) * 16;
  let y = b.y + (b.h - block) / 2 + 14;
  let o = `<g class="comp cat-${b.cat}" data-id="${b.id}" data-train="no" tabindex="0" role="button" aria-label="${esc(label)}"><rect class="main" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12"></rect>`;
  o += `<text class="t" style="font-size:${tFs}px" x="${cx}" y="${y.toFixed(1)}">${esc(b.t)}</text>`;
  y += 18;
  for (const s of sub) { o += `<text class="s" x="${cx}" y="${y.toFixed(1)}">${esc(s)}</text>`; y += 16; }
  if (b.zoom) o += `<text x="${b.x + b.w - 14}" y="${b.y + b.h - 8}" font-size="12" text-anchor="middle" class="zm-h">🔍</text>`;
  void L;
  return o + '</g>';
}
export function svgOpen(id: string, h: number) {
  return `<svg id="${id}" viewBox="0 0 380 ${h}" xmlns="http://www.w3.org/2000/svg" data-m="1"><defs><marker id="ah${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"></path></marker></defs>`;
}
export const arrow = (id: string, d: string) => `<path class="arrow" d="${d}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ah${id})"></path>`;
export const zone = (x: number, y: number, w: number, h: number) => `<rect class="u-zone" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"></rect>`;
export const note = (x: number, y: number, s: string, anchor: 'middle' | 'start' = 'middle') => `<text class="u-note" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;

/* ---------- popup cards ---------- */
export interface PopSpec {
  role: string; status?: string;
  tryit?: [string, string, string]; // lab/card id, station, label
  does: string[]; how: string[]; why: string; eff: string; lim: string;
}
const TABS: Bi[] = [{ zh: '🎯 作用', en: '🎯 What it does' }, { zh: '▶ 怎么用', en: '▶ How to use' }, { zh: '🧠 为什么', en: '🧠 Why' }, { zh: '⚠️ 局限', en: '⚠️ Limits' }];
export function popBody(id: string, owner: string, sp: PopSpec, W: World, L: Lang) {
  const t: T = (zh, en) => (L === 'en' ? en : zh);
  const p = W.part(id); if (!p) throw new Error('unknown part ' + id);
  const crumb = (W.path[owner] ?? []).map((s) => `<a data-go="${s}">${esc((W.tabn[s] as Bi)[L])}</a>`).join(' › ');
  const status = sp.status ?? t('⚙️ 用法层：不改模型的参数，改的是你怎么用它', '⚙️ Usage layer: no model parameters change, only how you use it');
  let o = `<div class="m-meta"><p class="role">${sp.role}</p><div class="where">${t('📍 所在位置：', '📍 Location: ')}${crumb} › <b>${esc(p.n[L])}</b></div><span class="status no">${status}</span></div>`;
  if (sp.tryit) o += `<div class="tryit"><b>${t('🧪 动手试试：', '🧪 Try it: ')}</b><button class="btn primary" data-jump="${sp.tryit[0]}" data-lv="${sp.tryit[1]}">${sp.tryit[2]}</button></div>`;
  o += `<div class="m-tabs" role="tablist" aria-label="${t('卡片分栏', 'Card sections')}">` + TABS.map((b, i) => `<button type="button" role="tab" id="mt@t${i}" aria-controls="mt@p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${b[L]}</button>`).join('') + '</div>';
  const ul = (a: string[]) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const panels = [
    `<div class="sec"><h4>${t('🎯 作用', '🎯 Role')}</h4>${ul(sp.does)}</div>`,
    `<div class="sec" style="background:#f0f9ff"><h4>${t('▶ 怎么用', '▶ How to use it')}</h4>${ul(sp.how)}</div>`,
    `<div class="sec why"><h4>${t('🧠 为什么这么设计（底层逻辑）', '🧠 Why it’s designed this way (the logic underneath)')}</h4><p>${sp.why}</p></div><div class="sec eff"><h4>${t('✅ 为什么这样做就有效', '✅ Why this works')}</h4><p>${sp.eff}</p></div>`,
    `<p class="lim">${t('⚠️ 局限/说明：', '⚠️ Limits / notes: ')}${sp.lim}</p>`,
  ];
  o += panels.map((h, i) => `<div class="m-panel" id="mt@p${i}" role="tabpanel" aria-labelledby="mt@t${i}" tabindex="0"${i ? ' hidden=""' : ''}>${h}</div>`).join('');
  return o;
}

/** what each station content module returns */
export interface StationOut { sub: string; one: string; why: string; svg: string; legend: [string, string, string][] }
export const LEG = (t: T): Record<string, [string, string, string]> => ({
  use: ['#15803d', '#dcfce7', t('用法（怎么用）', 'Usage (how to use)')],
  agent: ['#a21caf', '#fae8ff', t('Agent 原理', 'Agent internals')],
  llm: ['#4338ca', '#e0e7ff', t('大模型原理', 'LLM internals')],
  safe: ['#dc2626', '#fee2e2', t('安全', 'Safety')],
});
