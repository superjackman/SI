import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import type { Lang } from '../i18n/types';
import { hydrate, type Hydrated } from './hydrate';
import { pendingFlash, pendingScroll, scrollToEl } from '../nav';
import { Boot } from '../shell/Boot';
import { tx } from '../i18n/L';
import { recover, newerBuild, userReload } from '../boot/stale';
import { applyZoomDom } from '../shell/zoom';
import { hasMath, loadMath } from './math';
/** stations whose labs have started since the page loaded (live starts each lab once per page load; see Tour) */
export const labsRan = new Set<string>();

interface Snap { cls: string; html: string }
const chunks = import.meta.glob<Snap>(['../legacy/gen/st/*.json', '!../legacy/gen/st/*.wide.json'], { import: 'default' });
const keyOf = (S: string, l: Lang) => `../legacy/gen/st/${S}.${l}.json`;
export const hasSnapshot = (S: string, l: Lang) => keyOf(S, l) in chunks;
export function preload(S: string, l: Lang) { const f = chunks[keyOf(S, l)]; if (f) void f(); }

/* the live page's language-switch capture/restore: open cards and details, form values, started labs, reading position */
interface Saved { cc: boolean[]; det: boolean[]; vals: [string, string | boolean, string][]; labs: number[]; anchor: [number, number] | null }
const tbH = () => document.getElementById('topbar')?.offsetHeight ?? 52;
function capture(sec: HTMLElement, h: Hydrated | null): Saved {
  const vals: Saved['vals'] = [];
  sec.querySelectorAll<HTMLInputElement>('input[id], select[id]').forEach((e) => {
    if (e.type === 'range' || e.type === 'checkbox' || e.type === 'radio' || e.tagName === 'SELECT' || e.type === 'number') vals.push([e.id, e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value, e.type]);
  });
  let anchor: Saved['anchor'] = null;
  const all = sec.querySelectorAll('.card,.pagehead,.m-stage,.m-pn');
  for (let i = 0; i < all.length; i++) { const r = (all[i] as Element).getBoundingClientRect(); if (r.bottom > tbH() + 4) { anchor = [i, r.top - tbH()]; break; } }
  return {
    cc: [...sec.querySelectorAll('.card[data-cc]')].map((c) => !c.classList.contains('cc-closed')),
    det: [...sec.querySelectorAll('details')].map((d) => (d as HTMLDetailsElement).open),
    vals, labs: h?.islands?.started() ?? [], anchor,
  };
}
function restore(sec: HTMLElement, S: Saved, h: Hydrated) {
  h.islands?.start(S.labs);
  const cs = sec.querySelectorAll<HTMLElement>('.card[data-cc]');
  S.cc.forEach((o, i) => { const c = cs[i]; if (c && o !== !c.classList.contains('cc-closed')) { c.classList.toggle('cc-closed', !o); c.querySelector(':scope>h2>.cc-h,:scope>h3>.cc-h')?.setAttribute('aria-expanded', String(o)); } });
  const ds = sec.querySelectorAll('details'); S.det.forEach((o, i) => { const d = ds[i]; if (d) d.open = o; });
  S.vals.forEach(([id, v, type]) => {
    const e = document.getElementById(id) as HTMLInputElement | null; if (!e || !sec.contains(e)) return;
    if (type === 'checkbox' || type === 'radio') { if (e.checked === v) return; e.checked = !!v; } else { if (e.value === v) return; e.value = String(v); }
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  if (S.anchor) { const el = sec.querySelectorAll('.card,.pagehead,.m-stage,.m-pn')[S.anchor[0]]; if (el) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - tbH() - S.anchor[1])); }
}
function applyScroll() {
  const v = pendingScroll.v; pendingScroll.v = null;
  if (v === 'top') window.scrollTo(0, 0);
  else if (v === 'main') { const m = document.querySelector('main'); if (m) window.scrollTo({ top: Math.max(0, m.getBoundingClientRect().top + window.pageYOffset - 70), behavior: 'smooth' }); }
  else if (typeof v === 'number') window.scrollTo(0, v);
  else if (typeof v === 'string') scrollToEl(v);
  const f = pendingFlash.v; pendingFlash.v = null;
  if (f) { const src = document.querySelector(`.level.active .m-stage .comp[data-id="${CSS.escape(f)}"]`); if (src) { src.classList.add('tapped'); setTimeout(() => src.classList.remove('tapped'), 700); } }
}

export function StationView() {
  const S = useApp((s) => s.station), lang = useApp((s) => s.lang), navSeq = useApp((s) => s.navSeq);
  const [snap, setSnap] = useState<{ S: string; lang: Lang; d: Snap } | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [labFail, setLabFail] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const cur = useRef<{ S: string; lang: Lang; h: Hydrated | null; seq: number; el: HTMLElement } | null>(null);
  useEffect(() => {
    let ok = true;
    setFail(null);
    const f = chunks[keyOf(S, lang)];
    if (!f) { setFail(S); return; }
    f().then(async (d) => { if (hasMath(d.html)) await loadMath(); if (ok) setSnap({ S, lang, d }); }, (e: unknown) => {
      console.error(`[station ${S}]`, e);
      /* stale deploy → one cache-busting reload (keep the skeleton); otherwise ⟳. A ⟳ that fails again reloads the page
         when the server is reachable (some browsers keep a failed module import cached until reload). */
      void recover(e).then(async (r) => {
        if (r || !ok) return;
        if (retry > 0 && (await newerBuild()) !== null) { userReload(); return; }
        setFail(S);
      });
    });
    return () => { ok = false; };
  }, [S, lang, retry]);

  useLayoutEffect(() => {
    const sec = ref.current;
    if (!sec || !snap || snap.S !== S || snap.lang !== lang) return;
    const prev = cur.current;
    if (prev && prev.el === sec && prev.S === S && prev.lang === lang) return;
    const saved = prev && prev.el === sec && prev.S === S && prev.lang !== lang ? capture(sec, prev.h) : null;
    prev?.h?.dispose();
    sec.className = snap.d.cls + ' active';
    sec.innerHTML = snap.d.html;
    const me = { S, lang, h: null as Hydrated | null, seq: navSeq, el: sec };
    cur.current = me;
    setLabFail(null);
    void hydrate(sec, S, lang, () => cur.current === me).then((h) => {
      if (cur.current !== me) return;
      me.h = h;
      if (saved) restore(sec, saved, h);
      document.documentElement.dataset.siReady = `${S}.${lang}`;
      document.dispatchEvent(new CustomEvent('si-station-ready', { detail: { S, again: labsRan.has(S) } }));
      labsRan.add(S);
    }, (e: unknown) => {
      /* the text is shown; its lab chunk failed: same recovery, then a ⟳ notice above the content */
      console.error(`[labs ${S}]`, e);
      void recover(e).then((r) => { if (!r && cur.current === me) setLabFail(`${S}.${lang}`); });
    });
    /* hydrate's synchronous part has run (diagrams marked, viewers set up): apply the detail level, tell the shell */
    applyZoomDom(sec, S, useApp.getState().zoom, lang);
    document.documentElement.dataset.siShown = `${S}.${lang}`;
    document.dispatchEvent(new Event('si-station-shown'));
    if (!saved) applyScroll();
  }, [snap, S, lang, navSeq]);

  /* same station again (bottom tab, crumb): only scroll */
  useEffect(() => { if (cur.current && cur.current.S === S && cur.current.seq !== navSeq) { cur.current.seq = navSeq; applyScroll(); } }, [navSeq, S]);
  useEffect(() => () => { cur.current?.h?.dispose(); cur.current = null; }, []);

  const ready = snap && snap.S === S && snap.lang === lang;
  return (
    <>
      {!ready && fail === S ? (
        <div className="card st-fail" role="alert">
          <p>{tx('st.loadfail', lang)}</p>
          <button type="button" className="btn primary" aria-label={tx('st.retry', lang)} title={tx('st.retry', lang)} onClick={() => setRetry((n) => n + 1)}>⟳</button>
        </div>
      ) : !ready && !cur.current ? <Boot /> : null}
      {ready && labFail === `${S}.${lang}` ? (
        <div className="card st-fail lab-fail" role="alert">
          <p>{tx('st.labfail', lang)}</p>
          <button type="button" className="btn primary" aria-label={tx('st.retry', lang)} title={tx('st.retry', lang)} onClick={() => {
            void newerBuild().then((n) => { if (n !== null) userReload(); else { cur.current = null; setLabFail(null); setSnap((v) => (v ? { ...v } : v)); } });
          }}>⟳</button>
        </div>
      ) : null}
      <section ref={ref} id={S} className="level active" aria-busy={ready ? undefined : true} />
    </>
  );
}
