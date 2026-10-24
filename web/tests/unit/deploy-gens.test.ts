import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs build script without types
import { readGens, plan, entryOf, safeRel, KEEP, PUSHED } from '../../scripts/deploy-gens.mjs';

type G = { id: string; at: string | null; files: string[] };
const g = (id: string, ...f: string[]): G => ({ id, at: null, files: ['index.html', ...f] });

describe('deploy generations', () => {
  it('keeps exactly one previous generation by default', () => expect(KEEP).toBe(1));
  it('migrates the R0–R3 {files} manifest as one generation', () => {
    expect(readGens({ target: 'next', files: ['index.html', 'assets/a.js'] })).toEqual([{ id: 'pre-generations', at: null, files: ['index.html', 'assets/a.js'] }]);
    expect(readGens(null)).toEqual([]);
    expect(readGens({ generations: [{ id: 'x', files: ['a'] }, { id: 'bad' }] })).toEqual([{ id: 'x', at: null, files: ['a'] }]);
  });
  it('first deploy over an old manifest removes nothing', () => {
    const P = plan(readGens({ files: ['index.html', 'assets/a1.js'] }), ['index.html', 'assets/b2.js'], 'b2.js');
    expect(P.generations.map((x: G) => x.id)).toEqual(['b2.js', 'pre-generations']);
    expect(P.remove).toEqual([]);
    expect(P.orphans(['assets/a1.js', 'assets/b2.js', 'assets/stray.js'])).toEqual(['assets/stray.js']);
  });
  it('prunes generations older than one back, but never a file a kept generation still lists', () => {
    const prev = [g('c.js', 'assets/c.js', 'assets/shared.js'), g('b.js', 'assets/b.js', 'assets/shared.js', 'assets/bonly.js')];
    const P = plan(prev, ['index.html', 'assets/d.js', 'assets/shared.js'], 'd.js');
    expect(P.generations.map((x: G) => x.id)).toEqual(['d.js', 'c.js']);
    expect(P.remove).toEqual(['assets/b.js', 'assets/bonly.js']); // index.html + shared.js still listed
    expect(P.live.has('assets/c.js')).toBe(true);
  });
  it('re-deploying the same build does not push out the previous one', () => {
    const prev = [g('c.js', 'assets/c.js'), g('b.js', 'assets/b.js')];
    const P = plan(prev, ['index.html', 'assets/c.js'], 'c.js');
    expect(P.generations.map((x: G) => x.id)).toEqual(['c.js', 'b.js']);
    expect(P.remove).toEqual([]);
  });
  it('keep=2 keeps two back', () => {
    const prev = [g('c', 'assets/c.js'), g('b', 'assets/b.js'), g('a', 'assets/a.js')];
    expect(plan(prev, ['index.html', 'assets/d.js'], 'd', null, 2).remove).toEqual(['assets/a.js']);
  });
  it('R26: pushed generations (last committed manifest) survive local re-deploys until 3 newer pushed ones exist', () => {
    expect(PUSHED).toBe(3);
    const pushed = [g('p4', 'assets/p4.js'), g('p3', 'assets/p3.js'), g('p2', 'assets/p2.js'), g('p1', 'assets/p1.js')];
    /* two local deploys since the push: l1 then l2; the working manifest is [l1, p4, p3, p2, p1] */
    const prev = [g('l1', 'assets/l1.js'), ...pushed];
    const P = plan(prev, ['index.html', 'assets/l2.js'], 'l2', null, KEEP, pushed);
    expect(P.generations.map((x: G) => x.id)).toEqual(['l2', 'l1', 'p4', 'p3', 'p2']);
    expect(P.remove).toEqual(['assets/p1.js']);
    /* the working manifest lost a pushed generation: it comes back, its files are not orphans */
    const Q = plan([g('l1', 'assets/l1.js')], ['index.html', 'assets/l2.js'], 'l2', null, KEEP, pushed);
    expect(Q.generations.map((x: G) => x.id)).toEqual(['l2', 'l1', 'p4', 'p3', 'p2']);
    expect(Q.orphans(['assets/p4.js', 'assets/p2.js', 'assets/p1.js', 'assets/l1.js'])).toEqual(['assets/p1.js']);
    /* no committed manifest: the old behaviour */
    expect(plan(prev, ['index.html', 'assets/l2.js'], 'l2').generations.map((x: G) => x.id)).toEqual(['l2', 'l1']);
  });
  it('reads the build id from index.html and rejects unsafe paths', () => {
    expect(entryOf('<script type="module" crossorigin src="/SI/next/assets/index-Do0ajEEB.js"></script>')).toBe('index-Do0ajEEB.js');
    expect(entryOf('<script type="module" src="/src/main.tsx"></script>')).toBe('');
    for (const bad of ['../x', '/etc/passwd', 'assets/../../x', '', 'a//b']) expect(safeRel(bad)).toBe(false);
    expect(safeRel('assets/x.js')).toBe(true);
  });
});
