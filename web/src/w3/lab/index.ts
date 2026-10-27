/* R34: which file builds which experiment (each file is its own lazy chunk) */
import type { Mod } from '../sc/world';
import type { LabOpt } from './lab';
type M = Record<string, Mod<LabOpt>['make']>;
const A = () => import('./a') as unknown as Promise<M>, B = () => import('./b') as unknown as Promise<M>, Mm = () => import('./m') as unknown as Promise<M>;
export const LABS: Record<string, () => Promise<M>> = {
  layers: A, sort: A, loop: A, plug: A, meter: A,
  tokens: B, nn: B, moe: B, patch: B, attn: B, dot: B,
  valley: Mm, slope: Mm, grid: Mm, dice: Mm, steps: Mm,
};
export async function labMod(k: string): Promise<Mod<LabOpt>> { const f = LABS[k] ?? A; const m = await f(); return { make: m[k] ?? m.layers! }; }
