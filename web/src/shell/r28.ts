/* R28 pilot: one calm page skeleton (header = where am I + ☰ 🔍 ↗; a one-line "‹ up" link; title + one sentence; the
   content; ONE next step in a 3-item bottom bar 目录 · 进度 · 下一站; secondary things behind ☰ / 目录).
   The pages listed here use it (body.r28); rolling it out = adding the other stops (or setting ALL). */
import { PATH } from '../legacy/kb';
export { R28, isR28 } from './r28set';
/** level 2 = a zone (首页 → 专区); level 3 = a detail stop */
export const isZone = (S: string) => (PATH[S]?.length ?? 0) === 2;
/** one level up: the parent in PATH (the home page for zones) */
export const upOf = (S: string) => { const p = PATH[S] ?? []; return p.length > 1 ? p[p.length - 2]! : null; };
