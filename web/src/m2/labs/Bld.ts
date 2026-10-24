/* Station Bld lab: labBld — the one-tap picker (panels are in the page; this switches them). */
import type { Env } from '../../legacy/runtime';
import { picker } from '../pick';

export const LABS = [{ ids: ['labBld', 'pkBld', 'pkBldOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  return { labs: [() => picker(env, 'pkBld', 'pkBldOut')], eager: () => {} };
}
