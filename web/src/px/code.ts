/* A progress code is the learning record on this device, nothing else.
   Decode never writes. apply() writes only after the caller has confirmed, and only whitelisted keys.
   A bad code returns false and leaves storage untouched. The trained model (si.l4.my) is not part of the code. */
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
export function encode(data = capture()): string {
  return `SI1.${b64e(JSON.stringify({ v: 1, d: data }))}`;
}
export function decode(code: string): { ok: true; data: Record<string, string> } | { ok: false } {
  const raw = code.trim();
  if (!raw.startsWith('SI1.') || raw.length > MAX) return { ok: false };
  try {
    const j = JSON.parse(b64d(raw.slice(4))) as unknown;
    if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false };
    if ((j as { v?: unknown }).v !== 1) return { ok: false };
    const data = validMap((j as { d?: unknown }).d);
    if (!data) return { ok: false };
    return { ok: true, data };
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
