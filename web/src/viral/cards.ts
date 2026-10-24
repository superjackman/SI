/* R20 share images (lazy; loaded on the first tap of 考考朋友 / 我的点亮图 / 领结业证书): the quiz-challenge card, the
   progress card (the 22 stops as a lit-up map) and the certificate. Drawn locally with R19's card frame and QR block
   (share/card.ts), shown in the same sheet with Save / Share. Names and nicknames are typed here, kept in this
   browser (localStorage) and only ever drawn on the canvas or set as text — never as markup. */
import { tx } from '../i18n/L';
import { TABORDER, tabn } from '../legacy/kb';
import { copyText as copy } from './copy';
import type { Bi, Lang } from '../i18n/types';
import { inWeChat, shareURL, withFrom } from '../share/url';
import { esc, frame, openSheet, qrBlock, refresh, rr, wrap, type Frame } from '../share/card';
import { cleanText, encodeCh, withParam, NAME_MAX, NICK_MAX } from './codec';
import { progress, doneDate, fmtDate, LS, LSset, type Prog } from './prog';
import { T, fill } from './strings';
import { IC } from '../shell/common';
import { IC2 } from '../ui/ic2';

const site = (L: Lang) => tx('site.title', L);
const nickNow = () => cleanText(LS('si.nick') ?? '', NICK_MAX);
const nameNow = () => cleanText(LS('si.name') ?? '', NAME_MAX);
/** challenge link: ?lang=..&ch=..&from=<tag>#<stop>/quiz<stop> */
export function challengeURL(S: string, c: number, n: number, nick: string, L: Lang, tag = 'challenge', loc: Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'> = location): string {
  return withFrom(withParam(shareURL(loc, L, { station: S }) /* the stop's top: the friend sees the banner first */, 'ch', encodeCh({ S, c, n, nick })), tag);
}
const centered = (g: CanvasRenderingContext2D, lines: string[], cx: number, y0: number, lh: number) => { g.textAlign = 'center'; lines.forEach((l, i) => g.fillText(l, cx, y0 + i * lh)); g.textAlign = 'left'; };

/* ---- quiz challenge card (1080 × 1350) ---- */
export interface ChLayout { text: string[]; textBottom: number; qrTop: number; qr: { x: number; y: number; size: number } }
export function drawChallenge(cv: HTMLCanvasElement, S: string, c: number, n: number, nick: string, L: Lang, url: string): ChLayout {
  const f = frame(cv, 1080, 1350, L, site(L), T.chChip[L], ['#ea580c', '#db2777']), { g, F, X, Y, CH, PAD, TW } = f;
  const QR = 300, qrTop = Y + CH - PAD - QR;
  let y = Y + PAD + 46;
  g.fillStyle = '#ea580c'; g.font = `800 46px ${F}`; g.fillText(T.chDare[L], X + PAD, y); y += 30;
  const line = nick ? fill(T.chImg[L], { who: nick, stop: tabn(S, L) }) : fill(T.chImgMe[L], { stop: tabn(S, L) });
  let sz = 60, text: string[] = [];
  for (; sz >= 44; sz -= 4) { g.font = `800 ${sz}px ${F}`; text = wrap(g, line, TW); if (text.length <= 3) break; }
  g.fillStyle = '#1e1b4b';
  for (const l of text) { y += sz * 1.3; g.fillText(l, X + PAD, y - sz * 0.25); }
  y += 30 + 150;
  g.fillStyle = '#db2777'; g.font = `900 170px ${F}`; g.fillText(`${c} / ${n}`, X + PAD, y - 20);
  y += 20;
  g.fillStyle = '#334155'; g.font = `600 40px ${F}`;
  const ask = wrap(g, T.chAsk[L], TW);
  for (const l of ask) { y += 58; g.fillText(l, X + PAD, y - 12); }
  const b = qrBlock(f, url, qrTop, T.chScan[L], QR);
  return { text: text.concat(ask), textBottom: y, qrTop, qr: b.qr };
}
/** the challenge sheet; back = answering a friend's challenge (button names / events differ) */
export function openChallenge(S: string, c: number, n: number, back = false) {
  if (!TABORDER.includes(S)) return;
  const top = (L: Lang) => `<label class="cp-f"><span>${esc(T.nick[L])}</span><input type="text" id="cpNick" maxlength="24" autocomplete="nickname" enterkeyhint="done" value="${esc(nickNow())}"></label><p class="cp-note">${esc(T.privacy[L])}</p>`;
  openSheet({
    top,
    make: (L) => {
      const inp = document.getElementById('cpNick') as HTMLInputElement | null;
      if (inp) LSset('si.nick', cleanText(inp.value, NICK_MAX));
      const nick = nickNow(), link = challengeURL(S, c, n, nick, L, back ? 'chback' : 'challenge'), img = challengeURL(S, c, n, nick, L, 'chcard');
      const sys = typeof navigator.share === 'function' && !inWeChat(navigator.userAgent);
      const k = back ? 'challenge-back' : 'challenge';
      return {
        kind: 'challenge', head: T.chHead[L], alt: fill(T.chAlt[L], { stop: tabn(S, L), c, n }), file: `SI-challenge-${S}-${L}.png`, w: 1080, h: 1350,
        paint: (cv) => { const lay = drawChallenge(cv, S, c, n, nick, L, img); return { fit: lay.textBottom <= lay.qrTop - 36, attrs: ` data-qr="${lay.qr.x},${lay.qr.y},${lay.qr.size}"` }; },
        share: { title: tabn(S, L) + ' · ' + site(L), text: fill(T.chShareText[L], { who: nick || T.me[L], stop: tabn(S, L), c, n }) + '\n' + link },
        links: (sys ? `<button type="button" class="cp-b pri" data-act="link" data-share-ch="${k}-link">${IC.share}<span>${esc(T.chLink[L])}</span></button>` : '')
          + `<button type="button" class="cp-b${sys ? '' : ' pri'}" data-act="copy" data-share-ch="${k}-copy">${IC2.copy}<span>${esc(T.chCopy[L])}</span></button>`
          + `<input class="cp-url" type="text" readonly value="${esc(link)}" aria-label="${esc(T.link[L])}">`,
      };
    },
    act: (a, el, L) => {
      const u = el.closest('#cardPanel')?.querySelector<HTMLInputElement>('.cp-url');
      const nick = nickNow(), text = fill(T.chShareText[L], { who: nick || T.me[L], stop: tabn(S, L), c, n });
      if (a === 'copy') void copyText(u, L);
      if (a === 'link' && u) navigator.share({ title: tabn(S, L) + ' · ' + site(L), text, url: u.value }).catch((e: unknown) => { if ((e as { name?: string })?.name !== 'AbortError') void copyText(u, L); });
    },
  });
  document.getElementById('cpNick')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); refresh(); } });
}
const copyText = (inp: HTMLInputElement | null | undefined, L: Lang) => copy(inp, tx('share.copied', L), tx('share.copyManual', L));

/* ---- progress card (1080 × 1920): the stops as a snake of lit / opened / not-yet circles ---- */
export interface ProgLayout { names: string[][]; cut: boolean; textBottom: number; qrTop: number; qr: { x: number; y: number; size: number } }
const homeURL = (L: Lang, tag: string) => withFrom(shareURL(location, L, { station: 'T1' }), tag);
export function drawProgress(cv: HTMLCanvasElement, p: Prog, L: Lang, url: string): ProgLayout {
  const f: Frame = frame(cv, 1080, 1920, L, site(L), T.pChip[L]), { g, F, X, Y, CW, CH, PAD, TW } = f;
  const QR = 240, qrTop = Y + CH - PAD - QR;
  let y = Y + PAD + 70;
  g.fillStyle = '#1e1b4b'; g.font = `800 70px ${F}`;
  const title = wrap(g, fill(T.pTitle[L], { x: p.lit, t: p.total }), TW);
  for (const l of title) { g.fillText(l, X + PAD, y); y += 84; }
  g.fillStyle = '#64748b'; g.font = `500 32px ${F}`;
  for (const l of wrap(g, T.pRule[L], TW)) { g.fillText(l, X + PAD, y - 20); y += 44; }
  /* the map: 4 columns, rows run left → right, then right → left */
  const cols = 4, cw = TW / cols, R = 34, top = y + 10, rows = Math.ceil(p.stops.length / cols);
  g.font = `500 26px ${F}`;
  let legRows = 1, lw = 0;
  for (const t of [T.pLeg1, T.pLeg2, T.pLeg3]) { const w = g.measureText(t[L]).width + 40; if (lw && lw + w > TW) { legRows++; lw = 0; } lw += w + 30; }
  /* rows shrink (down to 128 px) so the legend + score always clear the divider above the QR */
  const rh = Math.max(128, Math.min(150, Math.floor((qrTop - 36 - 24 - top - 20 - 10 - 64 - 10 - (legRows - 1) * 44) / rows)));
  const pos = p.stops.map((_, i) => { const r = Math.floor(i / cols), k = i % cols, kk = r % 2 ? cols - 1 - k : k; return [X + PAD + cw * kk + cw / 2, top + r * rh + R + 4] as [number, number]; });
  g.lineWidth = 10; g.lineCap = 'round';
  for (let i = 1; i < pos.length; i++) {
    const a = pos[i - 1] as [number, number], b = pos[i] as [number, number];
    g.strokeStyle = p.stops[i - 1]?.lit && p.stops[i]?.lit ? '#a5b4fc' : '#e2e8f0';
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  const names: string[][] = []; let cut = false;
  p.stops.forEach((s, i) => {
    const [cx, cy] = pos[i] as [number, number];
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2);
    if (s.lit) { const gr = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); gr.addColorStop(0, '#6366f1'); gr.addColorStop(1, '#a855f7'); g.fillStyle = gr; g.fill(); }
    else { g.fillStyle = s.opened ? '#fff' : '#f1f5f9'; g.fill(); g.lineWidth = s.opened ? 6 : 3; g.strokeStyle = s.opened ? '#818cf8' : '#cbd5e1'; g.stroke(); }
    g.fillStyle = s.lit ? '#fff' : s.opened ? '#4f46e5' : '#94a3b8'; g.font = `800 30px ${F}`; g.textAlign = 'center';
    g.fillText(String(i + 1), cx, cy + 11);
    let fs = 24, nm: string[] = [];
    for (; fs >= 20; fs -= 2) { g.font = `600 ${fs}px ${F}`; nm = wrap(g, tabn(s.S, L), cw - 12); if (nm.length <= 2) break; }
    if (nm.length > 2) { cut = true; nm = [nm[0] as string, (nm[1] as string) + '…']; }
    names.push(nm);
    g.fillStyle = '#fff';
    nm.forEach((l, j) => { const w = g.measureText(l).width; g.fillRect(cx - w / 2 - 6, cy + R + 30 + j * (fs + 6) - fs, w + 12, fs + 8); });
    g.fillStyle = s.lit ? '#312e81' : s.opened ? '#475569' : '#94a3b8';
    nm.forEach((l, j) => g.fillText(l, cx, cy + R + 30 + j * (fs + 6)));
    g.textAlign = 'left';
  });
  y = top + rows * rh + 20;
  /* legend */
  g.font = `500 26px ${F}`; let lx = X + PAD; const ly = y + 10;
  const leg: [Bi, (x: number) => void][] = [
    [T.pLeg1, (x) => { g.beginPath(); g.arc(x, ly - 9, 13, 0, 7); g.fillStyle = '#7c3aed'; g.fill(); }],
    [T.pLeg2, (x) => { g.beginPath(); g.arc(x, ly - 9, 12, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#818cf8'; g.stroke(); }],
    [T.pLeg3, (x) => { g.beginPath(); g.arc(x, ly - 9, 12, 0, 7); g.fillStyle = '#f1f5f9'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#cbd5e1'; g.stroke(); }],
  ];
  let ry = ly;
  for (const [t, dot] of leg) {
    const w = g.measureText(t[L]).width + 13 * 2 + 14;
    if (lx + w > X + CW - PAD) { lx = X + PAD; ry += 44; }
    dot(lx + 13); g.fillStyle = '#475569'; g.fillText(t[L], lx + 34, ry); lx += w + 30;
  }
  y = ry + 64;
  g.fillStyle = '#1e1b4b'; g.font = `700 36px ${F}`; g.fillText(fill(T.pScore[L], { c: p.correct, q: p.questions }), X + PAD, y, TW);
  const b = qrBlock(f, url, qrTop, T.pScan[L], QR);
  return { names, cut, textBottom: y + 10, qrTop, qr: b.qr };
}

/* ---- certificate (1080 × 1350) ---- */
export interface CertLayout { name: string[]; did: string[]; textBottom: number; qrTop: number; qr: { x: number; y: number; size: number } }
export function drawCert(cv: HTMLCanvasElement, p: Prog, name: string, date: string, L: Lang, url: string): CertLayout {
  const f = frame(cv, 1080, 1350, L, site(L), T.cChip[L], ['#d97706', '#b45309']), { g, F, X, Y, CW, CH, PAD, TW } = f;
  g.strokeStyle = '#fbbf24'; g.lineWidth = 6; rr(g, X + 22, Y + 22, CW - 44, CH - 44, 30); g.stroke();
  g.strokeStyle = '#fde68a'; g.lineWidth = 2; rr(g, X + 34, Y + 34, CW - 68, CH - 68, 24); g.stroke();
  const cx = X + CW / 2, QR = 220, qrTop = Y + CH - PAD - QR;
  /* medal */
  let y = Y + PAD + 30;
  g.beginPath(); g.arc(cx, y + 40, 44, 0, 7); g.fillStyle = '#f59e0b'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#fcd34d'; g.stroke();
  g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 26, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(cx + r * Math.cos(a), y + 40 + r * Math.sin(a)); } g.closePath(); g.fillStyle = '#fff'; g.fill();
  y += 84 + 86;
  g.fillStyle = '#92400e'; g.font = `900 ${L === 'en' ? 64 : 84}px ${F}`; centered(g, [T.cTitle[L]], cx, y, 0);
  y += 72; g.fillStyle = '#78716c'; g.font = `500 34px ${F}`; centered(g, [T.cThis[L]], cx, y, 0);
  let ns = 76, nm: string[] = [];
  const who = name || T.cAnon[L];
  for (; ns >= 52; ns -= 6) { g.font = `800 ${ns}px ${F}`; nm = wrap(g, who, TW - 40); if (nm.length <= 2) break; }
  g.fillStyle = '#1c1917'; y += 30 + ns; centered(g, nm, cx, y, ns * 1.2); y += (nm.length - 1) * ns * 1.2;
  g.fillStyle = '#fbbf24'; g.fillRect(cx - 90, y + 26, 180, 6);
  g.fillStyle = '#44403c'; g.font = `500 36px ${F}`;
  const did = wrap(g, fill(T.cDid[L], { site: site(L), t: p.total, c: p.correct, q: p.questions }), TW - 40);
  y += 26 + 70; centered(g, did, cx, y, 52); y += (did.length - 1) * 52;
  g.fillStyle = '#92400e'; g.font = `700 34px ${F}`; y += 64; centered(g, [fmtDate(date, L)], cx, y, 0);
  const b = qrBlock(f, url, qrTop, T.cScan[L], QR);
  return { name: nm, did, textBottom: y + 10, qrTop, qr: b.qr };
}

/** the progress sheet; switches to the certificate when it is earned */
export function openProgress(cert = false) {
  const p0 = progress();
  if (cert && !p0.cert) cert = false;
  openSheet({
    top: (L) => !cert ? "" : `<label class="cp-f"><span>${esc(T.cName[L])}</span><input type="text" id="cpName" maxlength="32" autocomplete="name" enterkeyhint="done" value="${esc(nameNow())}"></label>`,
    make: (L) => {
      const p = progress();
      if (cert && p.cert) {
        const inp = document.getElementById('cpName') as HTMLInputElement | null;
        if (inp) LSset('si.name', cleanText(inp.value, NAME_MAX));
        const nm = nameNow(), date = doneDate(p) ?? '';
        return {
          kind: 'cert', head: T.cHead[L], alt: T.cAlt[L], file: `SI-certificate-${L}.png`, w: 1080, h: 1350,
          paint: (cv) => { const lay = drawCert(cv, p, nm, date, L, homeURL(L, 'cert')); return { fit: lay.textBottom <= lay.qrTop - 36 && lay.name.length <= 2 && lay.did.length <= 4, attrs: ` data-qr="${lay.qr.x},${lay.qr.y},${lay.qr.size}"` }; },
          share: { title: T.cTitle[L] + ' · ' + site(L), text: fill(T.cDid[L], { site: site(L), t: p.total, c: p.correct, q: p.questions }) + '\n' + homeURL(L, 'cert') },
          hint: T.cHint[L],
          links: `<button type="button" class="cp-b" data-act="map">${esc(T.pToMap[L])}</button>`,
        };
      }
      doneDate(p);
      return {
        kind: 'progress', head: T.pHead[L], alt: fill(T.pAlt[L], { x: p.lit, t: p.total }), file: `SI-progress-${L}.png`, w: 1080, h: 1920,
        paint: (cv) => { const lay = drawProgress(cv, p, L, homeURL(L, 'progress')); return { fit: !lay.cut && lay.textBottom <= lay.qrTop - 36, attrs: ` data-lit="${p.lit}" data-cert="${p.cert ? 1 : 0}" data-qr="${lay.qr.x},${lay.qr.y},${lay.qr.size}"` }; },
        share: { title: fill(T.pTitle[L], { x: p.lit, t: p.total }) + ' · ' + site(L), text: fill(T.pTitle[L], { x: p.lit, t: p.total }) + '\n' + homeURL(L, 'progress') },
        hint: T.pHint[L],
        links: p.cert ? `<button type="button" class="cp-b pri" data-act="cert" data-share-ch="cert">🎓 <span>${esc(T.pToCert[L])}</span></button>` : '',
      };
    },
    act: (a) => { if (a === 'cert') openProgress(true); else if (a === 'map') openProgress(false); },
  });
  document.getElementById('cpName')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); refresh(); } });
}
