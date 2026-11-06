/* R57: older specs open the layered body, which the micro-loop hides until 💡 推理.
   Preset every station to that step so those specs still see the layers. */
import { DV_KEY } from '../../src/dv/links';

const atReason = { m: [0, 0, 0], k: [0, 0, 0], v: [0, 0, 0], g: 0, s: 'r', p: [0, 0, 0] };
export const ML_AT_REASON = JSON.stringify(Object.fromEntries(DV_KEY.map((k) => [k, atReason])));
