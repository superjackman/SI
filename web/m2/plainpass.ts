/* R15 plain-language pass (run by m2/build.ts on every station in PLAIN_STATIONS, after all other passes):
   1. every card in the station's PLAIN map opens with a kid-plain text; the card's existing body moves, untouched, into a
      <details class="deep"> section that is closed by default (with the "To be more exact…" note first when there is one).
      keep: cards stay as they are, the plain text goes on top; labs get the plain line under their title.
   2. every display formula (.kx) gets a "What the symbols mean" list right under it (reading + meaning in this context);
      symbols already listed earlier in the same card show as small chips. Inline formulas get one list per card.
   Idempotent: everything it adds sits between <!--m2p…--> / <!--m2s--> markers and is removed first. */
import { esc, type Bi, type Lang } from './lib';
import { needsCtx, symKeys, unesc } from './sym';
import { SYM } from './content/symbols';
import type { PStation } from './plain/types';
import { CODES } from '../src/i18n/codes';

const MARKS = [/<!--m2p-->[\s\S]*?<!--\/m2p-->/g, /<!--m2pm-->[\s\S]*?<!--\/m2pm-->/g, /<!--m2pi-->[\s\S]*?<!--\/m2pi-->/g, /<!--m2pe-->[\s\S]*?<!--\/m2pe-->/g, /<!--m2s-->[\s\S]*?<!--\/m2s-->/g];
export const undoPlain = (h: string) => MARKS.reduce((s, r) => s.replace(r, ''), h);

/** index just past the </div> that closes the <div at `at` */
export function divEnd(h: string, at: number): number {
  const re = /<div\b|<\/div>/g; re.lastIndex = at; let d = 0, m: RegExpExecArray | null;
  while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return m.index + 6; }
  throw new Error('plain: unbalanced <div> at ' + at);
}
const ANN = /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/;
const ANN_G = new RegExp(ANN.source, 'g');
const KX = /<div class="kx( kx-w)?">/g;

/** one resolved symbol: glossary key to open, what to show, how to read it, what it means here */
export type Res = { key: string; disp: string; read: string; mean: string };
type CtxV = Bi & { r?: Bi };
/** a context entry may be conditional: "key@a,b" applies only to a formula that also has symbols a and b, "key@!a" only
    to one without a; a card entry beats a station ('*') entry, and more conditions beat fewer */
function pick(k: string, st: PStation, card: string, have: ReadonlySet<string>): CtxV | string | undefined {
  let best: CtxV | string | undefined, score = -1;
  for (const [lvl, scope] of [[0, '*'], [100, card]] as const) {
    const ctx = st.ctx?.[scope]; if (!ctx) continue;
    for (const [ck, v] of Object.entries(ctx)) {
      const at = ck.indexOf('@'), base = at < 0 ? ck : ck.slice(0, at);
      if (base !== k) continue;
      const conds = at < 0 ? [] : ck.slice(at + 1).split(',');
      if (!conds.every((c) => (c.startsWith('!') ? !have.has(c.slice(1)) : have.has(c)))) continue;
      const sc = lvl + conds.length; if (sc > score) { score = sc; best = v as CtxV | string; }
    }
  }
  return best;
}
const q = (s: string, L: Lang) => (L === 'zh' ? `“${s}”` : `“${s}”`);
export function resolve(k: string, st: PStation, card: string, L: Lang, have: ReadonlySet<string> = new Set([k])): Res {
  const c = pick(k, st, card, have);
  if (typeof c === 'string') {
    const a = c.slice(1), g = SYM[a]; if (!c.startsWith('=') || !g) throw new Error(`plain: bad alias ${c} for ${k} (${card})`);
    return { key: a, disp: g.d ?? esc(g.s), read: (g.rn ?? g.r)[L], mean: (g.n ?? g.m)[L] };
  }
  const v = /^v:(.+)$/.exec(k), w = /^w:(.+)$/.exec(k);
  if (v || w) {
    if (!c) throw new Error(`plain: ${card}: "${k}" needs a context meaning (m2/plain/*.ts ctx)`);
    const name = (v ?? w)![1]!;
    return { key: v ? 'var' : 'word', disp: v ? `<i>${esc(name)}</i>` : esc(name), read: c.r ? c.r[L] : q(name, L), mean: c[L] };
  }
  const g = SYM[k]; if (!g) throw new Error(`plain: ${card}: symbol "${k}" is not in the glossary (m2/content/symbols.ts)`);
  if (!c && needsCtx(k)) throw new Error(`plain: ${card}: "${k}" needs a context meaning (m2/plain/*.ts ctx)`);
  return { key: k, disp: g.d ?? esc(g.s), read: c?.r ? c.r[L] : (g.rn ?? g.r)[L], mean: c ? c[L] : (g.n ?? g.m)[L] };
}

/* ---- the "no leaks" guard: a note may only mention symbols that are in the formula it sits under ---- */
const GR: Record<string, string> = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', Δ: 'Delta', ε: 'epsilon', ϵ: 'epsilon', η: 'eta', θ: 'theta',
  λ: 'lambda', μ: 'mu', π: 'pi', σ: 'sigma', φ: 'phi', ϕ: 'phi', τ: 'tau', ω: 'omega', ℓ: 'ell', Σ: 'sum|Sigma', '∑': 'sum', Π: 'prod', '∏': 'prod',
  '∫': 'int', '∂': 'partial', '∇': 'nabla', '√': 'sqrt', '‖': 'norm', '′': 'prime', ᵀ: 'T', '𝔼': 'E', '∞': 'infty', ℝ: 'R' };
const SUBL: Record<string, string> = { ₐ: 'a', ₑ: 'e', ₕ: 'h', ᵢ: 'i', ⱼ: 'j', ₖ: 'k', ₗ: 'l', ₘ: 'm', ₙ: 'n', ₒ: 'o', ₚ: 'p', ᵣ: 'r', ₛ: 's', ₜ: 't', ᵤ: 'u', ᵥ: 'v', ₓ: 'x',
  ⁱ: 'i', ⁿ: 'n', ˣ: 'x', ʸ: 'y', ᵗ: 't', ᵏ: 'k', ᵈ: 'd', ᵐ: 'm', ʲ: 'j' };
/** the symbols a piece of note text mentions: Greek letters, a few math signs, and single Latin letters standing alone */
export function mentions(text: string, L: Lang): Set<string> {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').normalize('NFD').replace(/\b(e\.g|i\.e|etc)\./g, ' ');
  const out = new Set<string>();
  for (const ch of t) { const g = GR[ch]; if (g) out.add(g); const s = SUBL[ch]; if (s) out.add('v:' + s); }
  for (const m of t.matchAll(/(?<![A-Za-z'’])([A-Za-z])(?![A-Za-z'’])/g)) {
    const x = m[1]!; if (L === 'en' && (x === 'a' || x === 'A' || x === 'I')) continue;
    out.add('v:' + x);
  }
  return out;
}
/** what a formula's symbol keys allow a note to mention */
function allowed(have: ReadonlySet<string>): Set<string> {
  const a = new Set<string>();
  for (const k of have) {
    a.add(k);
    if (k === 'dd') a.add('v:d'); else if (k === 'exp' || k === 'ln' || k === 'euler') a.add('v:e'); else if (k === 'ell') a.add('v:l'); else if (k === 'T' || k === 'E' || k === 'R') a.add('v:' + k);
    else if (k === 'sum' || k === 'Sigma') a.add('sum|Sigma'); else if (k === 'prod') a.add('prod');
  }
  return a;
}
/** the glossary key an alias / letter key stands for (v:e → euler) also allows its own letter */
export type Issue = string;
function leak(r: Res, k: string, have: ReadonlySet<string>, L: Lang, where: string, out: Issue[]) {
  const ok = allowed(have); ok.add(k); if (r.key !== 'var' && r.key !== 'word') ok.add(r.key);
  if (r.key === 'euler') ok.add('v:e');
  const bad = [...mentions(r.disp + ' ' + r.read + ' ' + r.mean, L)].filter((m) => !ok.has(m) && !(m === 'sum|Sigma' && (ok.has('sum') || ok.has('Sigma'))));
  if (bad.length) out.push(`${where} [${L}] ${k}: mentions ${bad.join(' ')} not in the formula — “${(r.read + ' ' + r.mean).replace(/<[^>]+>/g, '')}”`);
}

const item = (r: Res, L: Lang) => `<li><button type="button" class="sn-s" data-sym="${r.key}">${r.disp}</button>` +
  `<span class="sn-r">${esc(CODES['sym.read'][L])}${esc(r.read)}</span><span class="sn-m">${esc(r.mean)}</span></li>`;
const chip = (r: Res) => `<button type="button" class="sn-c" data-sym="${r.key}">${r.disp}</button>`;
/** the symbol-note list; a key already explained above with the same words becomes a chip (a different meaning here, e.g.
    a caveat that applies only to this formula, is written out again) */
function notes(keys: string[], seen: Map<string, string>, st: PStation, card: string, L: Lang, head: string, iss?: Issue[], where = card): string {
  if (!keys.length) return '';
  const have = new Set(keys);
  const res = (k: string): Res => {
    try { return resolve(k, st, card, L, have); } catch (e) { if (!iss) throw e; iss.push(`${where} [${L}] ${(e as Error).message}`); return { key: k, disp: k, read: '?', mean: '?', bad: true } as Res; }
  };
  const all = keys.map((k) => [k, res(k)] as const), sig = (r: Res) => r.read + '|' + r.mean;
  const fresh = all.filter(([k, r]) => seen.get(k) !== sig(r)), old = all.filter(([k, r]) => seen.get(k) === sig(r));
  for (const [k, r] of all) seen.set(k, sig(r));
  if (iss) for (const [k, r] of all) {
    if ((r as { bad?: true }).bad) continue;
    const full = fresh.some((f) => f[0] === k);
    leak(full ? r : { ...r, read: '', mean: '' }, k, have, L, where, iss);
    if (full && !r.read.trim()) iss.push(`${where} [${L}] ${k}: no reading`);
  }
  let o = `<!--m2s--><div class="sn"><p class="sn-h"><span>${head}</span><button type="button" class="sn-all" data-sym="*">${CODES['sym.all'][L]}</button></p>`;
  if (fresh.length) o += `<ul class="sn-l">${fresh.map(([, r]) => item(r, L)).join('')}</ul>`;
  if (old.length) o += `<p class="sn-seen"><span>${CODES['sym.seen'][L]}</span>${old.map(([, r]) => chip(r)).join('')}</p>`;
  return o + '</div><!--/m2s-->';
}

export type Stat = { cards: number; kx: number; inline: number };
/** apply the pass to one station page (zh or en); returns the new html */
export function plainPage(html: string, S: string, L: Lang, st: PStation, stat?: Stat, iss?: Issue[]): string {
  let h = undoPlain(html);
  const ids = Object.keys(st.cards), done = new Set<string>();
  const cardRe = /<div class="card(?: [^"]*)?" id="([^"]+)"[^>]*>/g;
  const spans: [number, number, string][] = [];
  for (let m: RegExpExecArray | null; (m = cardRe.exec(h));) { const e = divEnd(h, m.index); spans.push([m.index, e, m[1]!]); cardRe.lastIndex = e; }
  for (let n = spans.length - 1; n >= 0; n--) {
    const [a, b, id] = spans[n]!; let c = h.slice(a, b);
    const seen = new Map<string, string>(), o = { d: !!st.d };
    // 1. notes under each display formula, and the inline formulas outside them
    const kxR: [number, number][] = [];
    KX.lastIndex = 0;
    for (let m: RegExpExecArray | null; (m = KX.exec(c));) { const e = divEnd(c, m.index); kxR.push([m.index, e]); KX.lastIndex = e; }
    const add: [number, string][] = [];
    for (const [x, y] of kxR) {
      const tex = ANN.exec(c.slice(x, y)); if (!tex) throw new Error(`plain: ${S}#${id}: formula without TeX annotation`);
      add.push([y, notes(symKeys(unesc(tex[1]!), o), seen, st, id, L, CODES['sym.notes'][L], iss, `${S}#${id} formula ${add.length + 1}`)]);
      if (stat) stat.kx++;
    }
    let out = c; for (let i = add.length - 1; i >= 0; i--) out = out.slice(0, add[i]![0]) + add[i]![1] + out.slice(add[i]![0]);
    const inl: string[] = [];
    let rest = c; for (let i = kxR.length - 1; i >= 0; i--) rest = rest.slice(0, kxR[i]![0]) + rest.slice(kxR[i]![1]);
    for (const m of rest.matchAll(ANN_G)) { if (stat) stat.inline++; for (const k of symKeys(unesc(m[1]!), o)) if (!inl.includes(k)) inl.push(k); }
    const inList = inl.length ? `<!--m2pi-->${notes(inl, new Map(seen), st, id, L, CODES['sym.inline'][L], iss, `${S}#${id} text`).replace(/^<!--m2s-->|<!--\/m2s-->$/g, '')}<!--/m2pi-->` : '';
    c = out;
    // 2. plain opening + closed deep section
    const P = st.cards[id];
    const body = c.indexOf('<div class="cc-body">');
    if (P) {
      done.add(id); if (stat) stat.cards++;
      const plain = `<div class="plain"><p class="pl-tag">${CODES['plain.tag'][L]}</p>${P[L]}</div>`;
      if (/^<div class="card lab\b/.test(c)) {
        const t = c.indexOf('</h3>'); if (t < 0) throw new Error(`plain: lab ${S}#${id} has no title`);
        c = c.slice(0, t + 5) + `<!--m2p-->${plain.replace('class="plain"', 'class="plain pl-lab"')}<!--/m2p-->` + c.slice(t + 5);
        if (inList) throw new Error(`plain: lab ${S}#${id} has inline formulas (not handled)`);
      } else {
        if (body < 0) throw new Error(`plain: ${S}#${id} has no .cc-body`);
        const bi = body + '<div class="cc-body">'.length, be = divEnd(c, body) - 6;
        let inner = c.slice(bi, be), lead = '';
        // a drill-down row that opens the body stays first (r10: "drill-downs at the top"), above the plain intro
        const ws = inner.length - inner.trimStart().length;
        if (inner.startsWith('<div class="m-ddrow"', ws)) { const e = divEnd(inner, ws); lead = inner.slice(0, e); inner = inner.slice(e); }
        if (P.keep) c = c.slice(0, bi) + lead + `<!--m2p-->${plain}<!--/m2p-->` + inner + inList + c.slice(be);
        else {
          const more = P.more ? `<!--m2pm--><p class="pl-more"><b>${CODES['plain.more'][L]}</b>${esc(P.more[L])}</p><!--/m2pm-->` : '';
          c = c.slice(0, bi) + lead + `<!--m2p-->${plain}<details class="deep"><summary>${CODES['plain.deep'][L]}</summary><!--/m2p-->` + more + inner + inList + '<!--m2pe--></details><!--/m2pe-->' + c.slice(be);
        }
      }
    } else if (inList) {
      if (body < 0) throw new Error(`plain: ${S}#${id} has inline formulas but no .cc-body`);
      const be = divEnd(c, body) - 6; c = c.slice(0, be) + inList + c.slice(be);
    }
    h = h.slice(0, a) + c + h.slice(b);
  }
  for (const id of ids) if (!done.has(id)) throw new Error(`plain: ${S}: no card #${id}`);
  return h;
}

/** popups (gen/nodes/{S}.{L}.json): one "symbols here" list at the end of every popup body that has formulas.
    Context entries for a popup sit under its part id in the station's ctx map. */
export function plainNodes(nodes: Record<string, { body: string }>, S: string, L: Lang, st: PStation, stat?: Stat, iss?: Issue[]) {
  const out: Record<string, { body: string }> = {};
  for (const [id, n] of Object.entries(nodes)) {
    const b = undoPlain(n.body), keys: string[] = [];
    for (const m of b.matchAll(ANN_G)) { if (stat) stat.inline++; for (const k of symKeys(unesc(m[1]!), { d: !!st.d })) if (!keys.includes(k)) keys.push(k); }
    out[id] = keys.length ? { ...n, body: b + `<!--m2pi-->${notes(keys, new Map(), st, id, L, CODES['sym.here'][L], iss, `${S} popup ${id}`).replace(/^<!--m2s-->|<!--\/m2s-->$/g, '')}<!--/m2pi-->` } : { ...n, body: b };
  }
  return out;
}

/** the glossary for the runtime sheet (src/sym/sheet.ts loads gen/symbols.json lazily) */
export function glossaryJson() {
  const G = ['write', 'cmp', 'calc', 'lin', 'fn', 'logic', 'greek'] as const;
  const lab = (k: string) => CODES[k as 'sym.title'];
  return {
    title: lab('sym.title'), intro: lab('sym.intro'), read: lab('sym.read'), close: CODES['ui.close'],
    groups: G.map((g) => ({ g, n: lab('sym.g.' + g), k: Object.keys(SYM).filter((k) => SYM[k]!.g === g) })),
    sym: SYM,
  };
}
