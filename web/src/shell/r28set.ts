/* R28 pilot: which pages use the calm skeleton (no imports, so the e2e specs can read it too). Rollout = add stops here,
   or set ALL. */
const ALL = true;
export const R28 = new Set(['H', 'Job', 'T4a']);
export const isR28 = (S: string) => ALL || R28.has(S);
