/* Station Skl lab: labSkl — the one-tap picker (panels are in the page; this switches them). */
import type { Env } from '../../legacy/runtime';
import { picker } from '../pick';

export const LABS = [{ ids: ['labSkl', 'pkSkl', 'pkSklOut'], hooks: [] as string[] }];

export function mount(env: Env) {
  return { labs: [() => picker(env, 'pkSkl', 'pkSklOut')], eager: () => {} };
}
