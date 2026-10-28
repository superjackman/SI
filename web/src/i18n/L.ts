import { CODES, type Code } from './codes';
import type { Bi, Lang } from './types';

export const pick = (b: Bi, l: Lang): string => b[l];
/** shared text by code */
export const tx = (c: Code, l: Lang): string => CODES[c][l];
