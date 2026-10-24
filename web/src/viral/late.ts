/* R20 "worth passing on" (lazy chunk, loaded after a station is up — nothing here is in the first load):
   - the R18 dot-strip scrubber (moved here so the first load pays for one import, not two)
   - at the end of each stop: 生成分享图 (R19 card) + 我的点亮图 (progress card / certificate)
   - quiz challenge: a finished quiz offers 考考朋友; a challenge link (?ch=) shows who to beat, then the comparison and
     回敬一个挑战
   - lab setups: 分享这个设置 under each lab; a setup link (?lab=) puts the friend's values back (each one checked against
     the control on this page) and asks 你能调出更好的吗？
   - gentle prompts: inline, one per browser session at most, never a pop-up; × remembers "not this kind again".
   Everything that came from a link is checked by codec.ts and only ever set as text / control values. */
import { jumpTo, toast } from '../nav';
import { TABORDER, tabn } from '../legacy/kb';
import { tx } from '../i18n/L';
import type { Lang } from '../i18n/types';
import { inWeChat, shareURL, withFrom } from '../share/url';
import { mountScrub } from '../station/scrub';
import { decodeCh, decodeLab, encodeLab, clampVal, cleanText, withParam, LAB_MAX, TEXT_MAX, type Challenge, type Ctl, type LabVals } from './codec';
import { stopQuiz } from './prog';
import { copyText, ev } from './copy';
import { T, fill } from './strings';
import { IC } from '../shell/common';
import { IC2 } from '../ui/ic2';
import './viral.css';
import '../station/cf.css';

/* ---- session state ---- */
const SS = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const SSset = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } };
const LSget = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSset = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
/** the challenge this tab was opened with (kept for the session, so it survives moving between stops) */
export function challenge(): Challenge | null { try { return decodeCh(JSON.parse(SS('si.ch') ?? 'null')?.raw); } catch { return null; } }
let landed = false, pendingLab: { card: string; v: LabVals } | null = null, badLab = false;
/** once per page load: read ?ch= / ?lab=, then take them out of the address bar (from= stays for analytics) */
export function land(loc: Pick<Location, 'search' | 'href'> = location) {
  if (landed) return; landed = true;
  const p = new URLSearchParams(loc.search), ch = p.get('ch'), lab = p.get('lab');
  if (ch !== null) {
    const c = decodeCh(ch);
    if (c) { SSset('si.ch', JSON.stringify({ raw: ch })); try { sessionStorage.removeItem('si.ch.x'); } catch { /* */ } ev('challenge-open'); } else ev('challenge-bad');
  }
  if (lab !== null) { pendingLab = decodeLab(lab); badLab = !pendingLab; ev(pendingLab ? 'lab-open' : 'lab-bad'); }
  if (ch !== null || lab !== null) {
    try {
      const u = new URL(loc.href); u.searchParams.delete('ch'); u.searchParams.delete('lab');
      history.replaceState(history.state, '', u.pathname + (u.search === '?' ? '' : u.search) + u.hash);
    } catch { /* keep the address */ }
  }
}

/* ---- gentle prompts ---- */
type Kind = 'quiz' | 'lab' | 'stop';
const offKinds = (): string[] => { try { const a: unknown = JSON.parse(LSget('si.nudge.off') ?? '[]'); return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []; } catch { return []; } };
export const canNudge = (k: Kind) => !SS('si.nudged') && !offKinds().includes(k);
function nudge(host: HTMLElement, k: Kind, text: string, L: Lang): HTMLElement | null {
  if (!canNudge(k) || host.querySelector('.vr-nudge')) return null;
  SSset('si.nudged', k); ev('nudge-' + k);
  const n = document.createElement('div'); n.className = 'vr-nudge'; n.dataset.kind = k; n.setAttribute('role', 'status');
  const p = document.createElement('p'); p.textContent = text;
  const x = document.createElement('button'); x.type = 'button'; x.className = 'vr-x'; x.dataset.shareCh = 'nudge-x';
  x.setAttribute('aria-label', T.no[L]); x.title = T.no[L]; x.innerHTML = IC.x;
  x.onclick = () => { const o = offKinds(); if (!o.includes(k)) LSset('si.nudge.off', JSON.stringify(o.concat(k))); n.remove(); };
  n.append(p, x); host.prepend(n);
  return n;
}

/* ---- lab setups ---- */
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const fields = (card: Element): Field[] => [...card.querySelectorAll<Field>('input[id],select[id],textarea[id]')]
  .filter((e) => !(e instanceof HTMLInputElement && /^(hidden|button|submit|reset|file|image|color|password)$/.test(e.type)));
const ctlOf = (e: Field): Ctl => e instanceof HTMLSelectElement ? { type: 'select', options: [...e.options].map((o) => o.value) }
  : e instanceof HTMLTextAreaElement ? { type: 'textarea', maxLength: e.maxLength }
  : { type: e.type, min: e.min, max: e.max, step: e.step, maxLength: e.maxLength };
export function labVals(card: Element): LabVals {
  const v: LabVals = {};
  for (const e of fields(card).slice(0, 24)) {
    if (e instanceof HTMLInputElement && (e.type === 'checkbox' || e.type === 'radio')) v[e.id] = e.checked ? '1' : '0';
    else if (e instanceof HTMLSelectElement || /^(range|number)$/.test(e.type)) v[e.id] = e.value;
    else v[e.id] = cleanText(e.value, TEXT_MAX);
  }
  return v;
}
/** put a shared setup into a lab on this page: each value is checked against the live control; returns how many were set */
export function applyLab(card: HTMLElement, v: LabVals): number {
  let n = 0;
  for (const [id, raw] of Object.entries(v)) {
    const e = fields(card).find((f) => f.id === id);
    if (!e || e.disabled) continue;
    const x = clampVal(ctlOf(e), raw); if (x === null) continue;
    if (e instanceof HTMLInputElement && (e.type === 'checkbox' || e.type === 'radio')) { if (e.checked === (x === '1')) continue; e.checked = x === '1'; }
    else { if (e.value === x) continue; e.value = x; }
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    n++;
  }
  return n;
}
function labRow(card: HTMLElement, S: string, L: Lang): HTMLElement {
  const row = document.createElement('div'); row.className = 'vr-lab'; row.dataset.for = card.id;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'vr-b'; b.dataset.shareCh = 'lab-share';
  b.innerHTML = IC.share + '<span></span>'; (b.lastChild as HTMLElement).textContent = T.lBtn[L];
  b.onclick = () => {
    const enc = encodeLab(card.id, labVals(card));
    if (enc.length > LAB_MAX || !decodeLab(enc)) { toast(tx('st.loadfail', L)); return; }
    const url = withFrom(withParam(shareURL(location, L, { station: S, node: card.id }), 'lab', enc), 'lab');
    const text = T.lText[L], title = tabn(S, L) + ' · ' + tx('site.title', L);
    const fallback = () => {
      let u = row.querySelector<HTMLInputElement>('.vr-url');
      if (!u) { u = document.createElement('input'); u.className = 'vr-url'; u.type = 'text'; u.readOnly = true; u.setAttribute('aria-label', T.link[L]); row.append(u); }
      u.value = url; void copyText(u, T.lCopied[L], T.lManual[L]);
    };
    if (typeof navigator.share === 'function' && !inWeChat(navigator.userAgent)) navigator.share({ title, text, url }).catch((e: unknown) => { if ((e as { name?: string })?.name !== 'AbortError') fallback(); });
    else fallback();
  };
  row.append(b);
  return row;
}
function banner(text: string, L: Lang, btn?: { label: string; ch: string; go: () => void }, cls = ''): HTMLElement {
  const d = document.createElement('div'); d.className = 'vr-ban' + (cls ? ' ' + cls : ''); d.setAttribute('role', 'status');
  const p = document.createElement('p'); p.textContent = text; d.append(p);
  if (btn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'vr-b pri'; b.dataset.shareCh = btn.ch; b.textContent = btn.label; b.onclick = btn.go; d.append(b); }
  const x = document.createElement('button'); x.type = 'button'; x.className = 'vr-x'; x.setAttribute('aria-label', T.close[L]); x.title = T.close[L]; x.innerHTML = IC.x;
  x.onclick = () => { d.remove(); if (cls === 'ch') SSset('si.ch.x', '1'); };
  d.append(x);
  return d;
}

/* ---- mount on a hydrated station ---- */
export function mountLate(sec: HTMLElement, S: string, L: Lang): () => void {
  const offs: Array<() => void> = [], added: Element[] = [], t0 = Date.now();
  const add = <E extends Element>(e: E) => { added.push(e); return e; };
  offs.push(mountScrub(sec));
  sec.dataset.late = '1';
  land();
  const load = <M>(f: () => Promise<M>, run: (m: M) => void) => { void f().then(run, () => toast(tx('st.loadfail', L))); };

  /* end of the stop: share image + progress card */
  const acts: HTMLElement[] = [];
  sec.querySelectorAll<HTMLElement>('.m-pn').forEach((nav) => {
    const a = add(document.createElement('div')); a.className = 'pn-acts';
    const c = document.createElement('button'); c.type = 'button'; c.className = 'pn-card'; c.dataset.card = S; c.dataset.shareCh = 'card';
    c.innerHTML = IC2.img + '<span></span>'; (c.lastChild as HTMLElement).textContent = tx('share.card', L);
    c.onclick = () => load(() => import('../share/card'), (m) => m.openCard(S));
    const p = document.createElement('button'); p.type = 'button'; p.className = 'pn-pc'; p.dataset.prog = '1'; p.dataset.shareCh = 'progress';
    p.innerHTML = '<b aria-hidden="true">🏅</b><span></span>'; (p.lastChild as HTMLElement).textContent = T.pBtn[L];
    p.onclick = () => load(() => import('./cards'), (m) => m.openProgress());
    a.append(c, p); nav.insertBefore(a, nav.querySelector('.pn-cap')); acts.push(a);
  });
  /* the T8 progress card gets the same entry */
  const pc = sec.querySelector<HTMLElement>('#progCard');
  if (pc) {
    const r = add(document.createElement('div')); r.className = 'vr-row';
    const p = document.createElement('button'); p.type = 'button'; p.className = 'vr-b pri'; p.dataset.shareCh = 'progress'; p.textContent = '🏅 ' + T.pBtn[L];
    p.onclick = () => load(() => import('./cards'), (m) => m.openProgress());
    r.append(p); pc.after(r);
  }

  /* challenge banner */
  const ch = challenge();
  if (ch && !SS('si.ch.x')) {
    const who = ch.nick || T.friend[L], i = TABORDER.indexOf(ch.S) + 1;
    const text = fill(T.chBan[L], { who, stop: tabn(ch.S, L), c: ch.c, n: ch.n }) + (ch.S === S ? '' : ' ' + fill(T.chBanOther[L], { i, stop: tabn(ch.S, L) }));
    const b = add(banner(text, L, { label: T.chGo[L], ch: 'challenge-go', go: () => jumpTo('quiz' + ch.S, ch.S) }, 'ch'));
    const ph = sec.querySelector('.pagehead'); if (ph) ph.after(b); else sec.prepend(b);
  }

  /* quiz: 考考朋友 / the comparison */
  const qc = sec.querySelector<HTMLElement>('#quiz' + CSS.escape(S));
  let qrow: HTMLElement | null = null, wasAll = (() => { const [c, d, n] = stopQuiz(S); return n > 0 && d === n && c === n; })();
  const drawQ = (fresh: boolean) => {
    if (!qc || !qrow) return;
    const [c, d, n] = stopQuiz(S), mine = ch && ch.S === S ? ch : null;
    const all = n > 0 && d === n && c === n, keepNudge = qrow.querySelector('.vr-nudge');
    qrow.replaceChildren(); qrow.hidden = true;
    if (!n) return;
    const line = (t: string, cls = '') => { const p = document.createElement('p'); p.textContent = t; if (cls) p.className = cls; qrow!.append(p); };
    const btn = (label: string, k: string, back: boolean) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'vr-b pri'; b.dataset.shareCh = k; b.textContent = label;
      b.onclick = () => { const [c2, , n2] = stopQuiz(S); load(() => import('./cards'), (m) => m.openChallenge(S, c2, n2, back)); };
      qrow!.append(b);
    };
    if (d < n) { if (mine) { line(fill(T.chWait[L], { who: mine.nick || T.friend[L], c: mine.c, n: mine.n })); qrow.hidden = false; } return; }
    qrow.hidden = false;
    if (mine) {
      const who = mine.nick || T.friend[L];
      line(fill(T.chCmp[L], { m: c, n, who, c: mine.c }));
      line(c > mine.c ? T.chWin[L] : c === mine.c ? T.chTie[L] : T.chLose[L], 'vr-verdict');
      btn(T.chBack[L], 'challenge-back', true);
      if (!SS('si.chd.' + S)) { SSset('si.chd.' + S, '1'); ev('challenge-done'); }
    } else { line(T.chRow[L]); btn(T.chBtn[L], 'challenge', false); }
    if (keepNudge) qrow.prepend(keepNudge);
    else if (fresh && all && !wasAll) nudge(qrow, 'quiz', T.nQuiz[L], L);
    wasAll = all;
  };
  if (qc) {
    qrow = add(document.createElement('div')); qrow.className = 'vr-q'; qc.after(qrow);
    drawQ(false);
    const onP = () => drawQ(true);
    document.addEventListener('si-progress', onP); offs.push(() => document.removeEventListener('si-progress', onP));
  }

  /* lab setups */
  const labs = [...sec.querySelectorAll<HTMLElement>('.card.lab[id]')].filter((c) => fields(c).length > 0);
  const rows = new Map<HTMLElement, HTMLElement>();
  for (const c of labs) { const r = add(labRow(c, S, L)); c.after(r); rows.set(c, r); }
  if (pendingLab) {
    const card = labs.find((c) => c.id === pendingLab?.card);
    if (card) {
      const v = pendingLab.v; pendingLab = null;
      fields(card)[0]?.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); /* starts the lab (runtime.ts) */
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!card.isConnected) return;
        applyLab(card, v);
        card.before(add(banner(T.lIn[L], L, undefined, 'lab')));
      }));
    }
  } else if (badLab) { badLab = false; const ph = sec.querySelector('.pagehead'); const b = add(banner(T.lBad[L], L, undefined, 'lab')); if (ph) ph.after(b); else sec.prepend(b); }
  /* lab prompt: after a few real changes over a few seconds in one lab (we cannot tell a "good" result, so this asks
     after playing, not after winning) */
  const use = new Map<HTMLElement, { n: number; t: number }>();
  const onUse = (e: Event) => {
    if (!e.isTrusted) return;
    const c = (e.target as Element | null)?.closest?.<HTMLElement>('.card.lab[id]'); if (!c || !rows.has(c)) return;
    const u = use.get(c) ?? { n: 0, t: Date.now() }; u.n++; use.set(c, u);
    if (u.n >= 4 && Date.now() - u.t >= 6000) { const r = rows.get(c); if (r) nudge(r, 'lab', T.nLab[L], L); }
  };
  sec.addEventListener('change', onUse, true); sec.addEventListener('input', onUse, true);
  offs.push(() => { sec.removeEventListener('change', onUse, true); sec.removeEventListener('input', onUse, true); });

  /* stop prompt: the end of the stop is on screen after ≥ 20 s here */
  const last = acts[acts.length - 1];
  if (last && typeof IntersectionObserver !== 'undefined') {
    let tm = 0;
    const io = new IntersectionObserver((es) => {
      const vis = es.some((x) => x.isIntersecting);
      clearTimeout(tm);
      if (vis) tm = window.setTimeout(() => { if (nudge(last, 'stop', T.nStop[L], L)) io.disconnect(); }, Math.max(0, 20000 - (Date.now() - t0)));
    });
    io.observe(last); offs.push(() => { clearTimeout(tm); io.disconnect(); });
  }
  /* R21 onboarding: welcome card, route, next steps, coach marks (its own lazy chunk, after the rows above exist) */
  let gone = false, ob: (() => void) | null = null;
  void import('../onboard').then((m) => { if (!gone) ob = m.mountOnboard(sec, S, L); }, () => undefined);
  offs.push(() => { gone = true; ob?.(); });
  /* R22 bottom bar badges: ✨ lit X/22 (k/6 on the kids' route), ✅ done, 🧪 how many labs */
  let bd: (() => void) | null = null;
  void import('../shell/dock').then((m) => { if (!gone) bd = m.badges(sec, S, L); }, () => undefined);
  offs.push(() => bd?.());
  return () => { offs.forEach((f) => f()); added.forEach((e) => e.remove()); delete sec.dataset.late; };
}
