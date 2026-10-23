/* R16 share panel (lazy chunk; loaded on the first tap of the share button, never on first load).
   System share sheet where the browser has one, one-tap links for the common networks, WeChat (hint inside WeChat,
   QR code elsewhere), copy link with a select-and-copy fallback, and a locally drawn QR code that can be saved.
   Every action carries data-share-ch, which main.tsx's capture listener turns into the GoatCounter event
   evt-share-<channel> (once per channel per load; only after load, never on localhost / the LAN). */
import './share.css';
import { useApp } from '../store/app';
import { tx } from '../i18n/L';
import { tabn } from '../legacy/kb';
import { toast } from '../nav';
import type { Bi, Lang } from '../i18n/types';
import { CHANNELS, channelURL, inWeChat, shareURL, type Ch } from './url';
import { qrPNG } from './qr';

/* panel-only strings (codes.ts holds the ones the shell shares: share.btn, share.copied …) */
const S = {
  sys: { zh: '用手机系统分享…', en: 'Share via your phone…' },
  to: { zh: '分享到', en: 'Share to' },
  wx: { zh: '微信', en: 'WeChat' },
  wxIn: { zh: '在微信里：点右上角「···」，就能发给朋友或分享到朋友圈。', en: 'In WeChat: tap ··· at the top right to send this page to a friend or to Moments.' },
  wxQr: { zh: '用微信「扫一扫」扫这个码打开本页，再点右上角「···」分享。', en: 'Scan this code with WeChat (Scan) to open the page there, then tap ··· at the top right to share.' },
  wxQrIn: { zh: '也可以长按二维码保存，发给别人扫码打开。', en: 'Or long-press the QR code to save it and send it on.' },
  save: { zh: '保存图片', en: 'Save image' },
  saveHint: { zh: '若没有开始下载，请长按二维码保存。', en: 'If nothing downloads, long-press the QR code to save it.' },
  copy: { zh: '复制链接', en: 'Copy link' },
  link: { zh: '本页链接', en: 'Link to this page' },
  qr: { zh: '本页二维码', en: 'QR code for this page' },
  desc: { zh: '大白话、可交互地拆解：一句话让 AI 干活的软件，从 Agent 应用到 Transformer 内部，再到训练与算力。', en: 'A plain-language, interactive look inside the software that gets work done from one sentence: from Agent apps to the inside of a Transformer, to training and compute.' },
} satisfies Record<string, Bi>;
const NAME: Record<Ch, Bi> = {
  weibo: { zh: '微博', en: 'Weibo' }, qq: { zh: 'QQ', en: 'QQ' }, qzone: { zh: 'QQ空间', en: 'Qzone' }, x: { zh: 'X', en: 'X' },
  facebook: { zh: 'Facebook', en: 'Facebook' }, telegram: { zh: 'Telegram', en: 'Telegram' }, linkedin: { zh: 'LinkedIn', en: 'LinkedIn' },
  whatsapp: { zh: 'WhatsApp', en: 'WhatsApp' }, email: { zh: '邮件', en: 'Email' },
};
/* glyph + brand colour of each round icon (plain text, no external images) */
const ICON: Record<Ch, [string, string]> = {
  weibo: ['微', '#e6162d'], qq: ['QQ', '#12b7f5'], qzone: ['Q', '#f5b400'], x: ['𝕏', '#111'], facebook: ['f', '#1877f2'],
  telegram: ['➤', '#229ed9'], linkedin: ['in', '#0a66c2'], whatsapp: ['✆', '#25d366'], email: ['✉', '#475569'],
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
/** the card the reader is looking at (null near the top of the stop, where the stop link is enough) */
export function currentCard(station: string): string | null {
  if (window.pageYOffset < 160) return null;
  const sec = document.getElementById(station); if (!sec) return null;
  const top = (document.getElementById('topbar')?.offsetHeight ?? 52) + 24;
  for (const c of Array.from(sec.querySelectorAll<HTMLElement>('.card[id]'))) {
    if (c.parentElement?.closest('.card')) continue;
    const r = c.getBoundingClientRect(); if (r.height && r.bottom > top) return /^[\w-]{1,80}$/.test(c.id) ? c.id : null;
  }
  return null;
}
export function current(): { url: string; title: string; desc: string; lang: Lang; station: string } {
  const s = useApp.getState(), L = s.lang;
  const node = s.popup?.id ?? currentCard(s.station);
  return {
    url: shareURL(location, L, { station: s.station, node }),
    title: tabn(s.station, L) + ' · ' + tx('site.title', L),
    desc: S.desc[L], lang: L, station: s.station,
  };
}

let root: HTMLElement | null = null, mask: HTMLElement | null = null, back: HTMLElement | null = null, unsub: (() => void) | null = null;
export const isOpen = () => !!root;
export function closeShare() {
  if (!root) return;
  root.remove(); mask?.remove(); root = mask = null; unsub?.(); unsub = null;
  document.removeEventListener('keydown', onKey, true);
  document.body.classList.remove('share-open');
  back?.focus?.(); back = null;
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeShare(); } }

export function openShare(ua = navigator.userAgent) {
  if (root) { render(ua); return; }
  back = document.activeElement as HTMLElement | null;
  mask = document.createElement('div'); mask.id = 'shareMask'; mask.onclick = closeShare;
  root = document.createElement('div'); root.id = 'sharePanel'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
  root.addEventListener('click', onClick);
  document.body.append(mask, root);
  document.body.classList.add('share-open');
  document.addEventListener('keydown', onKey, true);
  unsub = useApp.subscribe((s, p) => { if (s.lang !== p.lang) render(ua); else if (s.station !== p.station) closeShare(); });
  render(ua);
  root.querySelector<HTMLElement>('.sp-x')?.focus();
}

function render(ua: string) {
  if (!root) return;
  const c = current(), L = c.lang, t = (b: Bi) => esc(b[L]), wx = inWeChat(ua);
  const sys = typeof navigator.share === 'function';
  root.setAttribute('aria-label', tx('share.title', L));
  root.dataset.wx = wx ? '1' : '0';
  const png = qrPNG(c.url, c.title, location.host + location.pathname);
  const qr = png ? `<img class="sp-qr" src="${png}" alt="${t(S.qr)}" width="240" height="240">` : '';
  const file = 'SI-' + c.station + '-qr.png';
  root.innerHTML =
    `<div class="sp-head"><b>${esc(tx('share.title', L))}</b><button type="button" class="sp-x" aria-label="${esc(tx('ui.close', L))}">×</button></div>`
    + `<div class="sp-what"><b>${esc(c.title)}</b></div>`
    + (sys ? `<button type="button" class="sp-sys" data-share-ch="system" data-act="sys">📤 ${t(S.sys)}</button>` : '')
    + `<div class="sp-lbl">${t(S.to)}</div><div class="sp-grid">`
    + `<button type="button" class="sp-ch" data-act="wx"><i style="background:#07c160">微</i><span>${t(S.wx)}</span></button>`
    + CHANNELS.map((ch) => {
      const [g, col] = ICON[ch], u = channelURL(ch, c.url, c.title, c.desc);
      return `<a class="sp-ch" data-share-ch="${ch}" href="${esc(u)}"${ch === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"'}><i style="background:${col}">${g}</i><span>${t(NAME[ch])}</span></a>`;
    }).join('')
    + `</div><div class="sp-wx" id="spWx">`
    + (wx ? `<p class="sp-hint" id="spWxHint">👆 ${t(S.wxIn)}</p>` : '')
    + qr + `<p class="sp-cap">${wx ? t(S.wxQrIn) : t(S.wxQr)}</p>`
    + (png ? `<a class="sp-save" data-share-ch="qr-save" data-act="save" href="${png}" download="${file}">⬇ ${t(S.save)}</a>` : '')
    + `</div><div class="sp-lbl">${t(S.link)}</div>`
    + `<div class="sp-copy"><input type="text" readonly value="${esc(c.url)}" aria-label="${t(S.link)}"><button type="button" class="sp-cp" data-share-ch="copy" data-act="copy">${t(S.copy)}</button></div>`;
}

function onClick(e: MouseEvent) {
  const el = (e.target as Element).closest<HTMLElement>('.sp-x,[data-act]'); if (!el || !root) return;
  if (el.classList.contains('sp-x')) { closeShare(); return; }
  const L = useApp.getState().lang, act = el.dataset.act;
  if (act === 'sys') { const c = current(); navigator.share({ title: c.title, text: c.desc, url: c.url }).then(closeShare, () => { /* cancelled */ }); return; }
  if (act === 'copy') { e.preventDefault(); void copy(root.querySelector('input'), L); return; }
  if (act === 'wx') { const w = root.querySelector('#spWx'); w?.scrollIntoView({ block: 'center', behavior: 'smooth' }); w?.classList.remove('flash'); void (w as HTMLElement | null)?.offsetWidth; w?.classList.add('flash'); return; }
  if (act === 'save') { if (inWeChat(navigator.userAgent)) { e.preventDefault(); } toast(S.saveHint[L]); }
}

/** clipboard API where allowed (https / localhost); else select the text and execCommand('copy'); else leave it selected */
export async function copy(inp: HTMLInputElement | null, L: Lang): Promise<boolean> {
  const v = inp?.value ?? '';
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(v); toast(tx('share.copied', L)); return true; } } catch { /* fall through */ }
  let ok = false;
  if (inp) { inp.focus(); inp.select(); inp.setSelectionRange(0, v.length); try { ok = document.execCommand('copy'); } catch { ok = false; } }
  toast(tx(ok ? 'share.copied' : 'share.copyManual', L));
  return ok;
}
