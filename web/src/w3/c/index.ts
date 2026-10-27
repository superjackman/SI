/* R34: the station content, one lazy chunk per zone (only the zone being visited is downloaded) */
import { zoneOf } from '../reg';
import { cook, type StC } from './types';
import type { RawSt } from './types';
const LOAD: Record<string, () => Promise<{ Z: Record<string, RawSt> }>> = {
  z1: () => import('./z1'), z2: () => import('./z2'), z3: () => import('./z3'), z4: () => import('./z4'), z5: () => import('./z5'),
};
const cache = new Map<string, StC>();
export function peek(s: string): StC | undefined { return cache.get(s); }
export async function content(s: string): Promise<StC> {
  const hit = cache.get(s); if (hit) return hit;
  const m = await LOAD[zoneOf(s).id]!();
  for (const [k, r] of Object.entries(m.Z)) cache.set(k, cook(r));
  const c = cache.get(s); if (!c) throw new Error('no content ' + s); return c;
}
export const ZONE_FILES = LOAD;
