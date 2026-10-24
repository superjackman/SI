/* R15 plain-language layer: which stations have it (extend this list to roll it out; the guard test reads the same list) */
import type { PStation } from './types';
import T1 from './T1';
import K1 from './K1';
import K2 from './K2';
import K3 from './K3';
import K4 from './K4';
import K5 from './K5';
import T2 from './T2';
import T3 from './T3';
import N from './N';
import T4 from './T4';
import T4a from './T4a';
import T4b from './T4b';
import T5 from './T5';
import T6 from './T6';
import T7 from './T7';
import T8 from './T8';
import U from './U';
import Ua from './Ua';
import Ub from './Ub';
import Uc from './Uc';
import Ud from './Ud';
import Up from './Up';
import { CF_PLAIN } from './m11';

export const PLAIN: Record<string, PStation> = { T1, T2, T3, N, T4, T4a, T4b, T5, T6, T7, T8, U, Ua, Ub, Uc, Ud, Up, K1, K2, K3, K4, K5 };
/* R23: the ⚠️ mix-up cards' plain openings join their stations */
for (const [S, c] of Object.entries(CF_PLAIN)) PLAIN[S] = { ...PLAIN[S]!, cards: { ...PLAIN[S]!.cards, ...c } };
/** stations whose cards get plain openings + closed "Go deeper", and whose formulas all get symbol notes */
export const PLAIN_STATIONS = Object.keys(PLAIN);
