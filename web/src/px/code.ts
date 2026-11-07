/* A progress code is the learning record on this device, nothing else.
   Decode never writes. apply() replaces whitelisted keys. mergeMaps() keeps both devices' stations.
   A bad code returns false and leaves storage untouched. The trained model (si.l4.my) is not part of the code.
   The undo snapshot lives outside PROG_KEYS, so it is not copied into the next code. */
import { dvI } from '../dv/links';

export const CODE_VER = 2;
export const UNDO_KEY = 'si.bak.undo';
export const PROG_KEYS = [
  'si.l4.seen', 'si.l4.cards', 'si.px.log', 'si.px.days', 'si.px.q', 'si.l4.recent',
  'si.dv.seen', 'si.ml', 'si.vf', 'si.rv', 'si.rv.bell', 'si.so', 'si.goal',
  'si.ly.depth', 'si.ly.jv', 'si.ly.open', 'si.mst',
] as const;
const ALLOW = new Set<string>(PROG_KEYS);
const MAX = 400_000;

function b64e(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64d(s: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('b64');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
export function capture(): Record<string, string> {
  const o: Record<string, string> = {};
  for (const k of PROG_KEYS) {
    let v: string | null = null;
    try { v = localStorage.getItem(k); } catch { v = null; }
    if (v != null) o[k] = v;
  }
  return o;
}
function validMap(d: unknown): Record<string, string> | null {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o: Record<string, string> = {};
  for (const k of Object.keys(d)) {
    if (!ALLOW.has(k)) return null;
    const v = (d as Record<string, unknown>)[k];
    if (typeof v !== 'string') return null;
    o[k] = v;
  }
  return o;
}
export function encodeVersion(ver: 1 | 2, data: Record<string, string>): string {
  return `SI${ver}.${b64e(JSON.stringify({ v: ver, d: data }))}`;
}
export function encode(data = capture()): string {
  return encodeVersion(CODE_VER, data);
}
export function decode(code: string): { ok: true; data: Record<string, string>; ver: number } | { ok: false } {
  const raw = code.trim();
  const m = /^SI([12])\./.exec(raw);
  if (!m || raw.length > MAX) return { ok: false };
  const prefix = Number(m[1]);
  try {
    const j = JSON.parse(b64d(raw.slice(m[0].length))) as unknown;
    if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false };
    const ver = (j as { v?: unknown }).v;
    if (ver !== prefix || (ver !== 1 && ver !== 2)) return { ok: false };
    const data = validMap((j as { d?: unknown }).d);
    if (!data) return { ok: false };
    return { ok: true, data, ver };
  } catch { return { ok: false }; }
}
/** replace the whitelisted keys. Returns false without writing when `data` is not a valid map. */
export function apply(data: unknown): boolean {
  const map = validMap(data);
  if (!map) return false;
  try {
    for (const k of PROG_KEYS) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(map)) localStorage.setItem(k, v);
    return true;
  } catch { return false; }
}

function parsed(raw: string | undefined): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}
function asArr(raw: string | undefined): string[] {
  const v = parsed(raw);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
function asObj(raw: string | undefined): Record<string, unknown> {
  const v = parsed(raw);
  return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
}
/** stations this record has actually learned: read, dated as mastered, or a small goal lit */
export function learnedStops(data: Record<string, string>): string[] {
  const s = new Set<string>();
  for (const k of asArr(data['si.dv.seen'])) if (dvI(k) >= 0) s.add(k);
  for (const k of Object.keys(asObj(data['si.mst']))) if (dvI(k) >= 0) s.add(k);
  for (const [k, v] of Object.entries(asObj(data['si.ml']))) {
    if (dvI(k) < 0 || !v || typeof v !== 'object') continue;
    const m = (v as { m?: unknown }).m;
    if (Array.isArray(m) && m.some((x) => x === 1)) s.add(k);
  }
  return [...s].sort((a, b) => dvI(a) - dvI(b));
}
export function reviewIds(data: Record<string, string>): string[] {
  return Object.keys(asObj(data['si.rv'])).sort();
}
export interface ImportPreview {
  ver: number; older: boolean;
  addStops: string[]; keepStops: string[];
  addRv: string[]; keepRv: string[];
  dropStops: string[];
}
/** what a merge would add and keep. `dropStops` is what an overwrite would remove. */
export function preview(local: Record<string, string>, incoming: Record<string, string>, ver: number): ImportPreview {
  const here = learnedStops(local), there = learnedStops(incoming);
  const hs = new Set(here), ts = new Set(there);
  const hr = reviewIds(local), tr = reviewIds(incoming);
  const hrs = new Set(hr);
  return {
    ver, older: ver < CODE_VER,
    addStops: there.filter((k) => !hs.has(k)),
    keepStops: here,
    addRv: tr.filter((k) => !hrs.has(k)),
    keepRv: hr,
    dropStops: here.filter((k) => !ts.has(k)),
  };
}
const KEEP_LOCAL = new Set(['si.goal', 'si.ly.depth', 'si.ly.jv', 'si.rv.bell', 'si.px.q']);
function mergeKey(k: string, a: string, b: string): string {
  if (KEEP_LOCAL.has(k)) return a;
  if (k === 'si.dv.seen' || k === 'si.l4.seen' || k === 'si.l4.cards' || k === 'si.vf') {
    const s = new Set([...asArr(a), ...asArr(b)]);
    const xs = [...s];
    if (k === 'si.dv.seen') xs.sort((x, y) => dvI(x) - dvI(y));
    return JSON.stringify(xs);
  }
  if (k === 'si.mst') {
    const A = asObj(a), B = asObj(b), o: Record<string, string> = {};
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      if (dvI(id) < 0) continue;
      const x = typeof A[id] === 'string' ? A[id] as string : '';
      const y = typeof B[id] === 'string' ? B[id] as string : '';
      const pick = x && y ? (x < y ? x : y) : (x || y);
      if (pick) o[id] = pick;
    }
    return JSON.stringify(o);
  }
  if (k === 'si.ml') {
    const A = asObj(a), B = asObj(b), o: Record<string, unknown> = { ...A };
    const lit = (v: unknown) => Array.isArray((v as { m?: unknown })?.m) ? ((v as { m: unknown[] }).m).filter((x) => x === 1).length : 0;
    for (const [id, v] of Object.entries(B)) {
      if (!(id in o) || lit(v) > lit(o[id])) o[id] = v;
    }
    return JSON.stringify(o);
  }
  if (k === 'si.rv' || k === 'si.so') {
    const A = asObj(a), B = asObj(b), o: Record<string, unknown> = { ...A };
    for (const [id, v] of Object.entries(B)) {
      if (!(id in o)) { o[id] = v; continue; }
      if (k === 'si.rv') {
        const at = (o[id] as { t?: unknown })?.t, bt = (v as { t?: unknown })?.t;
        if (typeof bt === 'number' && (typeof at !== 'number' || bt > at)) o[id] = v;
      }
    }
    return JSON.stringify(o);
  }
  if (k === 'si.px.log') {
    const xs = [...asObjList(a), ...asObjList(b)];
    const seen = new Set<string>(), out: unknown[] = [];
    for (const e of xs) { const s = JSON.stringify(e); if (seen.has(s)) continue; seen.add(s); out.push(e); }
    return JSON.stringify(out.slice(-400));
  }
  if (k === 'si.px.days') {
    const A = asObj(a), B = asObj(b), o: Record<string, number> = {};
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const x = typeof A[id] === 'number' ? A[id] as number : 0;
      const y = typeof B[id] === 'number' ? B[id] as number : 0;
      o[id] = Math.max(x, y);
    }
    return JSON.stringify(o);
  }
  if (k === 'si.ly.open') {
    const A = asObj(a), B = asObj(b), o: Record<string, number> = {};
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const x = typeof A[id] === 'number' ? A[id] as number : 0;
      const y = typeof B[id] === 'number' ? B[id] as number : 0;
      o[id] = Math.max(x, y);
    }
    return JSON.stringify(o);
  }
  if (k === 'si.l4.recent') {
    const xs = [...asObjList(a), ...asObjList(b)];
    const best = new Map<string, { id: string; t: number; k: string }>();
    for (const e of xs) {
      if (!e || typeof e !== 'object') continue;
      const r = e as { id?: unknown; t?: unknown; k?: unknown };
      if (typeof r.id !== 'string' || typeof r.t !== 'number' || typeof r.k !== 'string') continue;
      const key = `${r.k}:${r.id}`, cur = best.get(key);
      if (!cur || r.t > cur.t) best.set(key, { id: r.id, t: r.t, k: r.k });
    }
    return JSON.stringify([...best.values()]);
  }
  return a;
}
function asObjList(raw: string): unknown[] {
  const v = parsed(raw);
  return Array.isArray(v) ? v : [];
}
/** union of two valid records. Local preferences stay. Stations and reviews from both sides stay. */
export function mergeMaps(local: Record<string, string>, incoming: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of PROG_KEYS) {
    const a = local[k], b = incoming[k];
    if (a == null && b == null) continue;
    if (a == null) out[k] = b!;
    else if (b == null) out[k] = a;
    else out[k] = mergeKey(k, a, b);
  }
  return out;
}
export function saveUndo(data = capture()) {
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(data)); } catch { /* private mode */ }
}
export function hasUndo() {
  try { return !!localStorage.getItem(UNDO_KEY); } catch { return false; }
}
/** put back the snapshot taken before the last import. Returns false without writing when there is none. */
export function undo(): boolean {
  let raw: string | null = null;
  try { raw = localStorage.getItem(UNDO_KEY); } catch { return false; }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!apply(data)) return false;
    localStorage.removeItem(UNDO_KEY);
    return true;
  } catch { return false; }
}
