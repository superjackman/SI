// R48 一体两视角: the one card ↔ stage table (src/dv/links.ts CARD_DV) and the consistency rules R1, R2, R5, R7 of the design
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zh from '../../src/dv/zh';
import en from '../../src/dv/en';
import { CARD_DV, CARD_SK, DV_ALSO, DV_BORN, DV_E, DV_K, DV_LV, DV_N, DV_NM, DV_OF, DV_SOLO, DV_USES, cardLv, dvI } from '../../src/dv/links';
import { cardLayer } from '../../src/l4/progress';

const C = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/l4/c');
const ids = (l: string) => ['k', 'k1', 'k3'].flatMap((g) => Object.keys(JSON.parse(fs.readFileSync(path.join(C, `${g}-${l}.json`), 'utf8')) as object)).sort();

describe('R48 the card ↔ stage table', () => {
  it('R1 every card on the site has exactly one entry (one birth stage), and only real cards are listed', () => {
    expect(Object.keys(CARD_DV).sort()).toEqual(ids('zh')); expect(ids('en')).toEqual(ids('zh'));
    for (const [k, st] of Object.entries(CARD_DV)) {
      expect(st.length, k).toBeGreaterThan(0);
      expect(st[0], `${k} is born before the recap`).toBeLessThan(DV_N - 1);
      for (const s of st) { expect(Number.isInteger(s) && s >= 0 && s < DV_N, `${k} ${s}`).toBe(true); }
      expect(new Set(st).size, `${k} lists a stage twice`).toBe(st.length);
    }
  });
  it('R2 each stage lists its born cards first, its own layer first; a stage without a same-layer card is marked 仅推导', () => {
    for (let i = 0; i < DV_N; i++) {
      const b = DV_BORN[i]!;
      expect(DV_K[i]!.slice(0, b.length)).toEqual(b);
      const same = b.filter((k) => cardLv(k) === DV_LV[i]); expect(b.slice(0, same.length)).toEqual(same);
      if (i === DV_N - 1) expect(b).toEqual([]);
      else if (DV_SOLO.includes(i)) expect(same, `stage ${i}`).toEqual([]);
      else expect(cardLv(b[0]!), `stage ${i} first card`).toBe(DV_LV[i]);
    }
  });
  it('the layer from the id matches the progress code', () => {
    for (const k of Object.keys(CARD_DV)) expect(cardLv(k), k).toBe(cardLayer(k));
  });
  it('R5 links are symmetric: card → birth stage ⇔ stage → born card, card → also-in ⇔ stage → also-uses', () => {
    for (const [k, b] of Object.entries(DV_OF)) { expect(DV_BORN[b], k).toContain(k); for (const s of DV_ALSO[k]!) expect(DV_USES[s], `${k} @${s}`).toContain(k); }
    DV_BORN.forEach((ks, i) => { for (const k of ks) expect(DV_OF[k]).toBe(i); });
    DV_USES.forEach((ks, i) => { for (const k of ks) { expect(DV_ALSO[k]).toContain(i); expect(DV_BORN[i]).not.toContain(k); } });
  });
  it('the 5 corrected birth stages and the 13 new back-links of the design', () => {
    expect([DV_OF.KM03, DV_OF.K07, DV_OF.KC08, DV_OF.KC11, DV_OF.KA02]).toEqual([3, '8a', 0, 12, 10].map(dvI));
    for (const [k, s] of [['K05', '8b'], ['K12', '8a'], ['K15', 12], ['KC01', 9], ['KC03', 9], ['KB02', 14], ['KB03', 14], ['KB04', 14], ['KB05', 14], ['KB07', 14], ['KB08', 14], ['KA01', 14], ['KA06', 14]] as const) expect(DV_OF[k], k).toBe(dvI(s));
    expect(DV_BORN[dvI(14)]![0]).toBe('KB01');
    expect([DV_OF.KM13, DV_OF.K16, DV_OF.KC13, DV_OF.KC14, DV_OF.KA07]).toEqual([5, 7, 11, 12, 15].map(dvI));
    expect(DV_SOLO, 'with the 5 new cards every stage has a card of its own layer').toEqual([]); expect(DV_K[dvI(16)]).toEqual(['K01', 'KC01', 'KA01']);
  });
  it('R7 the names and the 遗留 lines in the shared table equal the stage pages; stage 10 is 后训练', () => {
    expect(zh.st.map((s) => s.n)).toEqual(DV_NM.map((x) => x[0])); expect(en.st.map((s) => s.n)).toEqual(DV_NM.map((x) => x[1]));
    expect(zh.st.map((s) => s.e)).toEqual(DV_E.map((x) => x[0])); expect(en.st.map((s) => s.e)).toEqual(DV_E.map((x) => x[1]));
    expect(DV_NM[dvI(10)]![0]).toBe('后训练：SFT、对齐与推理');
  });
});

describe('R51 step 8 split into 8a / 8b', () => {
  it('CARD_DV is CARD_SK as station indices; attention parts are born in 8a, the block parts in 8b', () => {
    for (const [k, v] of Object.entries(CARD_SK)) expect(CARD_DV[k], k).toEqual(v.map(dvI));
    expect(['K07', 'K08', 'K12', 'KM12'].map((k) => DV_OF[k])).toEqual(Array(4).fill(dvI('8a')));
    expect(['K01', 'K04', 'K05', 'K06', 'K11'].map((k) => DV_OF[k])).toEqual(Array(5).fill(dvI('8b')));
    // each half introduces only a few new cards
    expect(DV_BORN[dvI('8a')]!.length).toBeLessThanOrEqual(5); expect(DV_BORN[dvI('8b')]!.length).toBeLessThanOrEqual(5);
  });
});
