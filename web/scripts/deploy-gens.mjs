// Deploy generations (pure; unit-tested in tests/unit/deploy-gens.test.ts).
//
// GitHub Pages serves index.html with max-age=600, so for up to ~10 minutes after a deploy a browser may still run the
// previous index.html. Its hashed assets must therefore survive the next deploy: the manifest keeps the file lists of
// the last KEEP+1 deploys (newest first), and a deploy only deletes files that no kept generation lists any more.
// Files at fixed paths (index.html, icons…) are simply overwritten by the newest build.
export const KEEP = 1; // previous generations kept besides the current one

/** generations from a manifest; the R0–R3 format {files} becomes one generation */
export function readGens(man) {
  if (!man || typeof man !== 'object') return [];
  if (Array.isArray(man.generations)) return man.generations.filter((g) => g && Array.isArray(g.files)).map((g) => ({ id: String(g.id ?? ''), at: g.at ?? null, files: [...g.files] }));
  if (Array.isArray(man.files)) return [{ id: 'pre-generations', at: null, files: [...man.files] }];
  return [];
}

/** plan a deploy: the new generation first, KEEP previous ones (a re-deploy of the same build id replaces it),
 *  `remove` = files only older generations listed, `orphans(list)` = asset files no kept generation lists */
export function plan(prev, files, id, at = null, keep = KEEP) {
  const cur = { id, at, files: [...files].sort() };
  const older = prev.filter((g) => g.id !== id);
  const kept = [cur, ...older.slice(0, keep)];
  const live = new Set(kept.flatMap((g) => g.files));
  const remove = [...new Set(older.slice(keep).flatMap((g) => g.files))].filter((f) => !live.has(f)).sort();
  return { generations: kept, remove, live, orphans: (present) => present.filter((f) => /^assets\//.test(f) && !live.has(f)).sort() };
}

/** the entry script name a built index.html references (the build id) */
export function entryOf(html) {
  const m = /<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"/]+\.js)"/.exec(html) ?? /<script[^>]+src="[^"]*\/assets\/([^"/]+\.js)"[^>]+type="module"/.exec(html);
  return m ? m[1] : '';
}

/** a relative manifest path that stays inside the target dir */
export function safeRel(rel) {
  return typeof rel === 'string' && rel !== '' && !rel.startsWith('/') && !rel.split(/[\\/]/).some((p) => p === '..' || p === '') ;
}
