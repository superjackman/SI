/* R19 "finished this stop → make a share image" (lazy chunk; loaded on the first tap of 生成分享图 / Make share image).
   Draws a 1080×1350 portrait card on a local canvas — site name, 我搞懂了：<stop> / I just learned: <stop>, one plain
   takeaway line (takeaway.ts), a QR code of the stop's link (local encoder, qr.ts) and the link as text — no server, no
   external service. The sheet shows the image (long-press saves it on iPhone / in WeChat), a Save button (download) and,
   where the browser can share files (navigator.canShare({files})), a Share button that hands the PNG to the system
   share sheet; anything else falls back to saving. Links carry from=card. */
import './card.css';
import { useApp } from '../store/app';
import { tx } from '../i18n/L';
import { TABORDER, tabn } from '../legacy/kb';
import { toast } from '../nav';
import type { Bi, Lang } from '../i18n/types';
import { inWeChat, shareURL, withFrom } from './url';
import { qrMatrix } from './qr';
import { TAKEAWAY } from './takeaway';
import { IC } from '../shell/common';
import { IC2 } from '../ui/ic2';

const S = {
  head: { zh: '分享图', en: 'Share image' },
  got: { zh: '我搞懂了：', en: 'I just learned:' },
  scan: { zh: '扫码打开这一站', en: 'Scan to open this stop' },
  stop: { zh: '第 {n} 站 / 共 {t} 站', en: 'Stop {n} of {t}' },
  save: { zh: '保存图片', en: 'Save image' },
  share: { zh: '分享图片', en: 'Share image' },
  hint: { zh: '在 iPhone 或微信里：长按上面的图片，就能保存或发给朋友。', en: 'On iPhone or in WeChat: long-press the image above to save it or send it to a friend.' },
  wx: { zh: '在微信里请长按上面的图片保存或发送。', en: 'In WeChat, long-press the image above to save or send it.' },
  saved: { zh: '图片已开始下载；没有反应的话，请长按图片保存。', en: 'Download started. If nothing happens, long-press the image to save it.' },
  alt: { zh: '分享图：{s}', en: 'Share image: {s}' },
} satisfies Record<string, Bi>;

export const W = 1080, H = 1350;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC","Source Han Sans SC",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
/* English text: Latin faces first, so quotes and · get Latin widths (a CJK face draws them full-width) */
const FONT_EN = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,' + FONT;
const MONO = 'ui-monospace,Menlo,Consolas,"DejaVu Sans Mono",monospace';
type G = CanvasRenderingContext2D;

/* line breaking: CJK breaks between characters (a closing mark stays with the character before it, an opening mark
   with the one after it); other text breaks between words; a word wider than the line breaks between letters */
const CJK = '\\u2e80-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef\\u3000-\\u303f';
const TOK = new RegExp(`[“‘（「『《【]*[${CJK}][，。、：；！？）」』》】”’…·]*|[^\\s${CJK}]+\\s*|\\s+`, 'g');
export function tokens(s: string): string[] { return s.match(TOK) ?? []; }
export function wrap(g: Pick<G, 'measureText'>, s: string, max: number): string[] {
  const out: string[] = []; let line = '';
  const push = () => { if (line.trim()) out.push(line.trimEnd()); line = ''; };
  for (const t of tokens(s)) {
    if (g.measureText((line + t).trimEnd()).width <= max) { line += t; continue; }
    if (line.trim()) push();
    if (/^\s+$/.test(t)) continue;
    if (g.measureText(t.trimEnd()).width <= max) { line = t; continue; }
    for (const ch of Array.from(t)) { if (g.measureText(line + ch).width > max && line) push(); line += ch; }
  }
  push();
  return out;
}
/** URL text: break anywhere (after / ? & # = preferred when they are close to the end of the line) */
export function wrapURL(g: Pick<G, 'measureText'>, u: string, max: number): string[] {
  const out: string[] = []; let line = '';
  for (const ch of Array.from(u)) {
    if (g.measureText(line + ch).width > max && line) {
      const k = Math.max(line.lastIndexOf('/'), line.lastIndexOf('?'), line.lastIndexOf('&'), line.lastIndexOf('#'), line.lastIndexOf('='));
      if (k > line.length * 0.7) { out.push(line.slice(0, k + 1)); line = line.slice(k + 1); } else { out.push(line); line = ''; }
    }
    line += ch;
  }
  if (line) out.push(line);
  return out;
}
const fill = (t: string, n: number, tot: number) => t.replace('{n}', String(n)).replace('{t}', String(tot));
function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export interface CardData { station: string; lang: Lang; url: string; name: string; takeaway: string; site: string; n: number; total: number }
export function cardData(station: string, lang: Lang, loc: Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'> = location): CardData {
  return {
    station, lang, url: withFrom(shareURL(loc, lang, { station }), 'card'), name: tabn(station, lang),
    takeaway: TAKEAWAY[station]?.[lang] ?? '', site: tx('site.title', lang), n: TABORDER.indexOf(station) + 1, total: TABORDER.length,
  };
}
/** what was drawn where (for tests: everything inside the card, nothing cut) */
export interface Layout { name: string[]; nameSize: number; take: string[]; takeSize: number; url: string[]; textBottom: number; qrTop: number; qr: { x: number; y: number; size: number } }
/** R20: the frame every share image uses (gradient, AI badge + site name, a chip at the top right, the white card);
    returns the drawing context and the card box */
export interface Frame { g: G; F: string; X: number; Y: number; CW: number; CH: number; PAD: number; TW: number }
export function frame(c: HTMLCanvasElement, w: number, h: number, L: Lang, site: string, chipText: string, colors: [string, string] = ['#4f46e5', '#7c3aed']): Frame {
  c.width = w; c.height = h;
  const g = c.getContext('2d')!; const F = L === 'en' ? FONT_EN : FONT;
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, colors[0]); bg.addColorStop(1, colors[1]);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff'; rr(g, 60, 52, 76, 76, 20); g.fill();
  g.fillStyle = colors[0]; g.font = `800 34px ${F}`; g.textAlign = 'center'; g.fillText('AI', 98, 103);
  g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `800 42px ${F}`; g.fillText(site, 158, 106, 520);
  g.font = `700 28px ${F}`;
  const cw = g.measureText(chipText).width + 44; g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, w - 60 - cw, 64, cw, 54, 27); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(chipText, w - 60 - cw / 2, 101); g.textAlign = 'left';
  const X = 60, Y = 170, CW = w - 120, CH = h - Y - 60, PAD = 72;
  g.shadowColor = 'rgba(15,23,42,.25)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
  g.fillStyle = '#fff'; rr(g, X, Y, CW, CH, 44); g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  return { g, F, X, Y, CW, CH, PAD, TW: CW - PAD * 2 };
}
/** R20: the QR block (divider, QR code of url, "scan" line, the link as text) at qrTop; returns its layout */
export function qrBlock(f: Frame, url: string, qrTop: number, scan: string, QR = 300): { qr: Layout['qr']; url: string[] } {
  const { g, F, X, CW, PAD, TW } = f;
  g.fillStyle = '#e2e8f0'; g.fillRect(X + PAD, qrTop - 36, TW, 2);
  const m = qrMatrix(url), n = m.length, mod = Math.floor(QR / n), qs = mod * n, qx = X + PAD, qy = qrTop + (QR - qs) / 2;
  g.fillStyle = '#fff'; g.fillRect(qx, qy, qs, qs); g.fillStyle = '#0f172a';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (m[r]?.[k]) g.fillRect(qx + k * mod, qy + r * mod, mod, mod);
  const rx = qx + QR + 44, rw = X + CW - PAD - rx;
  g.fillStyle = '#1e1b4b'; g.font = `800 40px ${F}`;
  const sc = wrap(g, scan, rw); let ry = qrTop + 20;
  for (const l of sc) { ry += 52; g.fillText(l, rx, ry - 10); }
  g.fillStyle = '#4f46e5'; g.font = `600 26px ${MONO}`;
  const uw = wrapURL(g, url, rw); ry += 18;
  for (const l of uw.slice(0, 6)) { ry += 36; g.fillText(l, rx, ry - 8); }
  return { qr: { x: qx, y: qy, size: qs }, url: uw };
}
export { rr };
/** draw the stop card; returns the layout */
export function draw(c: HTMLCanvasElement, d: CardData): Layout {
  const L = d.lang, f = frame(c, W, H, L, d.site, fill(S.stop[L], d.n, d.total)), { g, F, X, Y, CH, PAD, TW } = f;
  /* the QR block sits at the bottom of the card; the text block gets the rest */
  const QR = 300, qrTop = Y + CH - PAD - QR, textTop = Y + PAD, room = qrTop - 56 - textTop;
  /* pick the largest sizes that fit: name 88 → 60 px (≤ 3 lines), takeaway 46 → 34 px (≤ 5 lines) */
  let nameSize = 88, takeSize = 46, name: string[] = [], take: string[] = [], hgt = 0;
  const gotH = 46 * 1.3 + 14;
  for (;;) {
    g.font = `800 ${nameSize}px ${F}`; name = wrap(g, d.name, TW);
    g.font = `500 ${takeSize}px ${F}`; take = wrap(g, d.takeaway, TW);
    hgt = gotH + name.length * nameSize * 1.2 + 40 + 8 + 40 + take.length * takeSize * 1.5;
    if ((hgt <= room && name.length <= 3 && take.length <= 5) || (nameSize <= 60 && takeSize <= 34)) break;
    if (name.length > 2 && nameSize > 60) nameSize -= 4; else if (takeSize > 34) takeSize -= 2; else nameSize -= 4;
  }
  let y = textTop;
  g.fillStyle = '#6366f1'; g.font = `800 46px ${F}`; y += 46; g.fillText(S.got[L], X + PAD, y); y += 14 + 46 * 0.3;
  g.fillStyle = '#1e1b4b'; g.font = `800 ${nameSize}px ${F}`;
  for (const l of name) { y += nameSize * 1.2; g.fillText(l, X + PAD, y - nameSize * 0.22); }
  y += 40; g.fillStyle = '#c7d2fe'; rr(g, X + PAD, y, 120, 8, 4); g.fill(); y += 8 + 40;
  g.fillStyle = '#334155'; g.font = `500 ${takeSize}px ${F}`;
  for (const l of take) { y += takeSize * 1.5; g.fillText(l, X + PAD, y - takeSize * 0.4); }
  const textBottom = y;
  const b = qrBlock(f, d.url, qrTop, S.scan[L], QR);
  return { name, nameSize, take, takeSize, url: b.url, textBottom, qrTop, qr: b.qr };
}

/** the text block ends above the QR block, within the line limits (name ≤ 3, takeaway ≤ 5, link ≤ 6 lines) */
export const fits = (l: Layout) => l.textBottom <= l.qrTop - 36 && l.name.length <= 3 && l.take.length <= 5 && l.url.length <= 6;
/* ---- the sheet (R20: one sheet for every share image — the stop card, the quiz challenge, the progress card and the
   certificate; R19's markup, buttons and data-share-ch="<kind>-share|save" names are unchanged for the stop card) ---- */
export interface Sheet {
  kind: string; head: string; alt: string; file: string; w: number; h: number;
  paint(c: HTMLCanvasElement): { fit: boolean; attrs?: string };
  share: { title: string; text: string };
  hint?: string;
  /** extra buttons (html) before Save / Share */
  links?: string;
}
export interface SheetOpts {
  /** html above the image that is not redrawn while typing (name / nickname fields) */
  top?: (L: Lang) => string;
  make: (L: Lang) => Sheet;
  /** a tap on [data-act] that is not share / save; true = handled */
  act?: (act: string, el: HTMLElement, L: Lang) => void;
}
let root: HTMLElement | null = null, mask: HTMLElement | null = null, back: HTMLElement | null = null, blobURL = '', unsub: (() => void) | null = null;
let file: File | null = null, cur: Sheet | null = null, opts: SheetOpts | null = null, seq = 0, tmr = 0;
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const isOpen = () => !!root;
export function closeCard() {
  if (!root) return;
  root.remove(); mask?.remove(); root = mask = null; unsub?.(); unsub = null;
  if (blobURL) URL.revokeObjectURL(blobURL); blobURL = ''; file = null; cur = null; opts = null; clearTimeout(tmr);
  document.removeEventListener('keydown', onKey, true);
  document.body.classList.remove('card-open');
  back?.focus?.(); back = null;
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCard(); } }
const canFiles = (f: File) => { try { return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [f] }); } catch { return false; } };

/** the R19 stop card as a sheet */
function stopSheet(station: string, L: Lang): Sheet {
  const d = cardData(station, L);
  return {
    kind: 'card', head: S.head[L], alt: S.alt[L].replace('{s}', d.name), file: `SI-${station}-${L}.png`, w: W, h: H,
    paint: (c) => { const lay = draw(c, d); return { fit: fits(lay), attrs: ` data-lines="${lay.name.length},${lay.take.length},${lay.url.length}" data-qr="${lay.qr.x},${lay.qr.y},${lay.qr.size}"` }; },
    share: { title: d.name + ' · ' + d.site, text: S.got[L] + d.name + '\n' + d.url },
  };
}
export function openCard(station = useApp.getState().station) {
  if (!TABORDER.includes(station)) return;
  openSheet({ make: (L) => stopSheet(station, L) });
}
export function openSheet(o: SheetOpts) {
  opts = o;
  if (!root) {
    back = document.activeElement as HTMLElement | null;
    mask = document.createElement('div'); mask.id = 'cardMask'; mask.onclick = closeCard;
    root = document.createElement('div'); root.id = 'cardPanel'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.addEventListener('click', onClick);
    root.addEventListener('input', () => { clearTimeout(tmr); tmr = window.setTimeout(() => void render(false), 250); });
    document.body.append(mask, root);
    document.body.classList.add('card-open');
    document.addEventListener('keydown', onKey, true);
    unsub = useApp.subscribe((s, p) => { if (s.lang !== p.lang && cur) void render(true); else if (s.station !== p.station) closeCard(); });
  }
  void render(true);
}
/** redraw the image and the buttons (after a name / nickname change) */
export const refresh = () => { if (root) void render(false); };

async function render(full: boolean) {
  if (!root || !opts) return;
  const L = useApp.getState().lang, o = opts, d = o.make(L), my = ++seq;
  cur = d;
  const c = document.createElement('canvas');
  const r = d.paint(c);
  const png = c.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!root || my !== seq) return;
  if (blobURL) URL.revokeObjectURL(blobURL);
  file = blob ? new File([blob], d.file, { type: 'image/png' }) : null;
  blobURL = blob ? URL.createObjectURL(blob) : '';
  const wx = inWeChat(navigator.userAgent), sh = !!file && !wx && canFiles(file), k = d.kind;
  const body = `<img class="cp-img" src="${png}" width="${d.w}" height="${d.h}" data-kind="${k}" data-fit="${r.fit ? 1 : 0}"${r.attrs ?? ''} alt="${esc(d.alt)}">`
    + `<p class="cp-hint">${esc(d.hint ?? (wx ? S.wx[L] : S.hint[L]))}</p>`
    + `<div class="cp-acts">${d.links ?? ''}`
    + (sh ? `<button type="button" class="cp-b pri" data-act="share" data-share-ch="${k}-share">${IC.share}<span>${esc(S.share[L])}</span></button>` : '')
    + `<a class="cp-b${sh || d.links ? '' : ' pri'}" data-act="save" data-share-ch="${k}-save" href="${blobURL || png}" download="${esc(d.file)}">${IC2.dl}<span>${esc(S.save[L])}</span></a>`
    + `</div>`;
  root.setAttribute('aria-label', d.head);
  const bd = root.querySelector<HTMLElement>('.cp-body');
  if (!full && bd) { bd.innerHTML = body; return; }
  root.innerHTML =
    `<div class="cp-head"><b>${esc(d.head)}</b><button type="button" class="cp-x" aria-label="${esc(tx('ui.close', L))}" title="${esc(tx('ui.close', L))}">${IC.x}</button></div>`
    + (o.top?.(L) ?? '') + `<div class="cp-body">${body}</div>`;
  root.querySelector<HTMLElement>('.cp-x')?.focus();
}

function onClick(e: MouseEvent) {
  const el = (e.target as Element).closest<HTMLElement>('.cp-x,[data-act]'); if (!el || !root) return;
  if (el.classList.contains('cp-x')) { closeCard(); return; }
  const L = useApp.getState().lang, a = el.dataset.act ?? '';
  if (a === 'share') {
    const f = file, d = cur; if (!f || !d) return;
    navigator.share({ files: [f], title: d.share.title, text: d.share.text })
      .catch((err: unknown) => { if ((err as { name?: string })?.name !== 'AbortError') save(); });
    return;
  }
  if (a === 'save') { if (inWeChat(navigator.userAgent)) { e.preventDefault(); toast(S.wx[L]); } else toast(S.saved[L]); return; }
  opts?.act?.(a, el, L);
}
/** fallback when the share sheet fails: start the download */
function save() { root?.querySelector<HTMLAnchorElement>('[data-act="save"]')?.click(); }
