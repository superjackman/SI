/* R20 share mechanics: the pure parts (unit-tested) — what goes into a challenge link (?ch=) and a lab-setup link
   (?lab=), how it is read back, and how untrusted text (a nickname, a lab's text field, a certificate name) is cleaned.
   Everything a link carries is treated as hostile: fixed formats, length limits, numbers clamped to the real control's
   range and step, choices checked against the control's own options, text stripped of markup characters and capped. */
import { TABORDER } from '../legacy/kb';
import { QUIZ_KEY } from '../station/quiz';

/** text from a link or a form: no control / format / bidi characters, no markup characters, spaces collapsed, ≤ max
    characters (code points) */
export function cleanText(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  const t = s.normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}\u2028\u2029]/gu, '').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(t).slice(0, max).join('').trim();
}
export const NICK_MAX = 12, NAME_MAX = 16, TEXT_MAX = 40;

const b64u = (bytes: Uint8Array) => { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s: string): Uint8Array | null => {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); } catch { return null; }
};
const utf8 = (s: string) => new TextEncoder().encode(s);
const deutf8 = (b: Uint8Array) => { try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { return null; } };

/* ---- quiz challenge: ch=<stop index>-<correct>-<questions>[-<nickname, base64url UTF-8>] ---- */
export interface Challenge { S: string; c: number; n: number; nick: string }
export function encodeCh(ch: Challenge): string {
  const i = TABORDER.indexOf(ch.S), nick = cleanText(ch.nick, NICK_MAX);
  return i + '-' + ch.c + '-' + ch.n + (nick ? '-' + b64u(utf8(nick)) : '');
}
/** null unless the stop exists, has a quiz with exactly n questions, and 0 ≤ c ≤ n */
export function decodeCh(raw: unknown): Challenge | null {
  if (typeof raw !== 'string' || raw.length > 80) return null;
  const m = /^(\d{1,2})-(\d{1,2})-(\d{1,2})(?:-([A-Za-z0-9_-]{1,64}))?$/.exec(raw); if (!m) return null;
  const S = TABORDER[+(m[1] as string)], c = +(m[2] as string), n = +(m[3] as string);
  if (!S || !QUIZ_KEY[S] || QUIZ_KEY[S].length !== n || c > n) return null;
  let nick = '';
  if (m[4]) { const b = unb64u(m[4]); const t = b && deutf8(b); nick = t ? cleanText(t, NICK_MAX) : ''; }
  return { S, c, n, nick };
}

/* ---- lab setup: lab=<card id>.<base64url JSON {control id: value}> ---- */
export type LabVals = Record<string, string>;
const ID = /^[A-Za-z][\w-]{0,30}$/;
export const LAB_MAX = 900;
export function encodeLab(card: string, v: LabVals): string { return card + '.' + b64u(utf8(JSON.stringify(v))); }
/** null for anything but a well-formed id and ≤ 24 string / number values with well-formed control ids */
export function decodeLab(raw: unknown): { card: string; v: LabVals } | null {
  if (typeof raw !== 'string' || raw.length > LAB_MAX) return null;
  const k = raw.indexOf('.'); if (k < 1) return null;
  const card = raw.slice(0, k); if (!ID.test(card)) return null;
  const b = unb64u(raw.slice(k + 1)), t = b && deutf8(b); if (!t) return null;
  let o: unknown; try { o = JSON.parse(t); } catch { return null; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const v: LabVals = {}; let n = 0;
  for (const [id, x] of Object.entries(o as Record<string, unknown>)) {
    if (!ID.test(id) || (typeof x !== 'string' && typeof x !== 'number') || ++n > 24) return null;
    v[id] = String(x).slice(0, 120);
  }
  return n ? { card, v } : null;
}
/** a control as the lab draws it (the receiving page's own element decides what is allowed) */
export interface Ctl { type: string; min?: string; max?: string; step?: string; options?: string[]; maxLength?: number }
/** the value to set on a control, or null to leave it alone: numbers clamped to [min, max] and snapped to the step,
    checkboxes 0 / 1, choices only from the control's options, text cleaned and capped */
export function clampVal(c: Ctl, raw: string): string | null {
  if (c.type === 'checkbox' || c.type === 'radio') return raw === '1' || raw === '0' ? raw : null;
  if (c.options) return c.options.includes(raw) ? raw : null;
  if (c.type === 'range' || c.type === 'number') {
    if (!/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(raw)) return null;
    let x = Number(raw); if (!Number.isFinite(x)) return null;
    const lo = c.min !== undefined && c.min !== '' ? Number(c.min) : c.type === 'range' ? 0 : -Infinity;
    const hi = c.max !== undefined && c.max !== '' ? Number(c.max) : c.type === 'range' ? 100 : Infinity;
    x = Math.min(hi, Math.max(lo, x));
    const st = c.step && c.step !== 'any' ? Number(c.step) : c.type === 'range' ? 1 : NaN;
    if (st > 0 && Number.isFinite(lo)) { x = lo + Math.round((x - lo) / st) * st; if (x > hi + st * 1e-9) x -= st; }
    const dp = st > 0 ? Math.min(6, (String(st).split('.')[1] ?? '').length + (Number.isFinite(lo) ? (String(lo).split('.')[1] ?? '').length : 0)) : 6;
    return String(Number(x.toFixed(dp)));
  }
  if (c.type === 'text' || c.type === 'search' || c.type === 'textarea') return cleanText(raw, Math.min(TEXT_MAX, c.maxLength && c.maxLength > 0 ? c.maxLength : TEXT_MAX));
  return null;
}

/** url with k=v (replacing an earlier k=) in the query, right before the hash; v must already be URL-safe */
export function withParam(url: string, k: string, v: string): string {
  const i = url.indexOf('#'), h = i < 0 ? '' : url.slice(i), a = i < 0 ? url : url.slice(0, i), j = a.indexOf('?');
  const q = (j < 0 ? '' : a.slice(j + 1)).split('&').filter((p) => p && p.split('=')[0] !== k);
  q.push(k + '=' + v);
  return (j < 0 ? a : a.slice(0, j)) + '?' + q.join('&') + h;
}
