/* R33 pilot v4, page 3: "How Attention Works" as a real three.js scene, modelled in code: a rounded glass platform with a
   glowing rim, four rounded glass word blocks standing on it with their words in canvas text (I / love / eating / apples,
   or 我 / 爱 / 吃 / 苹果). Tap a block (or its word button): it turns violet and glows, and glowing 3D tubes arc from it
   to every other block, as thick and bright as its score, with light running along them; the % chips (real HTML) sit on
   the arcs. The sentence card, the lightbulb (why) and the magnifier (deeper: the dot product) float above as glass
   buttons. Drag to orbit a little, pinch to zoom; the camera stays on the whole sentence. */
import {
  AdditiveBlending, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, QuadraticBezierCurve3, TorusGeometry,
  TubeGeometry, Vector3, type CanvasTexture, type Sprite,
} from 'three';
import { scene, V, type P3, type SApi } from './base';
import { canvasTex, glassP, glow, rbox, shade, text, toy } from './look';
import { ATT, UI, t } from '../../pilot3d/text';
import { IC } from '../../pilot3d/icons';

/** block widths for the words (wider words get wider blocks) and their centres along x */
export function blocks(words: string[]): { x: number; w: number }[] {
  const ws = words.map((s) => Math.max(0.56, Math.min(1.0, 0.36 + [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 0.2 : 0.1), 0))));
  const gap = 0.14, all = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  let x = -all / 2;
  return ws.map((w) => { const c = x + w / 2; x += w + gap; return { x: c, w }; });
}
const H = 0.62, D = 0.42, Y = 0.18;
/** the arc from block a to block b: from the top of one to the top of the other, risen by the gap, bowed toward you */
export function arc(B: { x: number }[], a: number, b: number): QuadraticBezierCurve3 {
  const A = B[a]!.x, E = B[b]!.x, rise = 0.35 + 0.32 * Math.abs(E - A);
  return new QuadraticBezierCurve3(V(A, Y + H, 0.05), V((A + E) / 2, Y + H + rise * 2, 0.25 + 0.06 * Math.abs(E - A)), V(E, Y + H, 0.05));
}

export function make(box: HTMLElement, api: SApi): P3 {
  const L = api.lang, words = ATT.words[L];
  return scene(box, api, (st, P) => {
    const B = blocks(words);
    /* the platform: a rounded glass slab, a glossy top, a glowing rim */
    const plat = new Group(); P.add(plat);
    const slab = new Mesh(new CylinderGeometry(2.25, 2.3, 0.2, 96), glassP('#e7defd', { thick: 0.6, rough: 0.08, att: '#c9b8fb', dist: 1.2 }));
    slab.scale.z = 0.5; slab.position.y = 0; plat.add(slab);
    const top = new Mesh(new CylinderGeometry(2.12, 2.12, 0.02, 96), toy('#f7f4ff', { rough: 0.1, coat: 1 })); top.scale.z = 0.5; top.position.y = 0.105; top.receiveShadow = true; plat.add(top);
    const rimM = new MeshBasicMaterial({ color: '#d9ccff', toneMapped: false, transparent: true, opacity: 0.9 });
    for (const [y, r, w] of [[0.1, 2.25, 0.02], [-0.1, 2.3, 0.012]] as const) { const ri = new Mesh(new TorusGeometry(r, w, 8, 128), rimM); ri.rotation.x = Math.PI / 2; ri.scale.y = 0.5; ri.position.y = y; plat.add(ri); }
    const under = glow('#c4b5fd', 4.6, 0.35); under.position.set(0, -0.15, 0); under.scale.y = 1.4; plat.add(under);
    /* the word blocks: glass, or violet and glowing when lit; the word in canvas text on the front */
    const glassM = glassP('#e6dcff', { thick: 0.6, rough: 0.08, att: '#c4b2fa', dist: 0.7 });
    const litM = toy('#8b5cf6', { rough: 0.22, coat: 1, emissive: '#7c3aed', glow: 0.45 });
    const FH = 0.3, tex = (s: string, c: string, fw: number): CanvasTexture => canvasTex(Math.round((160 * fw) / FH), 160, (g, w, h) => text(g, s, w / 2, h / 2 + 4, w - 16, 124, c, 700));
    const blk = B.map((b, k) => {
      const g = new Group(); g.position.set(b.x, Y, 0); P.add(g);
      const m = rbox(b.w, H, D, 0.1, glassM, 0, H / 2, 0, 5); g.add(m);
      const fw = b.w * 0.92, dark = tex(words[k]!, '#2e1065', fw), light = tex(words[k]!, '#ffffff', fw);
      const face = new Mesh(new PlaneGeometry(fw, FH), new MeshBasicMaterial({ map: dark, transparent: true, depthWrite: false, toneMapped: false }));
      face.position.set(0, H / 2, D / 2 + 0.006); face.renderOrder = 5; g.add(face);
      const aura = glow('#a78bfa', 1.5, 0); aura.position.set(0, H / 2, 0); g.add(aura);
      shade(g);
      return { g, m, face, dark, light, aura };
    });
    /* the arcs: a bright core tube and a soft wide glow tube, beads of light running along */
    const arcs = [0, 1, 2].map(() => {
      const core = new Mesh(undefined, new MeshBasicMaterial({ color: '#a78bfa', transparent: true, depthWrite: false, toneMapped: false }));
      const halo = new Mesh(undefined, new MeshBasicMaterial({ color: '#c4b5fd', transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }));
      core.renderOrder = halo.renderOrder = 6; P.add(halo, core);
      const beads: Sprite[] = [0, 1].map(() => { const s = glow('#ffffff', 0.18, 0.9); P.add(s); return s; });
      const chip = st.tag('', 'p3p'); chip.el.dataset.clamp = 'x';
      return { core, halo, beads, chip, curve: null as QuadraticBezierCurve3 | null, w: 0, n: 0, hn: 0 };
    });
    /* the HTML around it: word buttons over the blocks, the sentence card, the bulb and lens circles */
    const tagAt = (html: string, cls: string, at: Vector3) => { const g = st.tag(html, cls); g.at.copy(at); g.el.removeAttribute('aria-hidden'); g.el.dataset.clamp = 'x'; return g; };
    const chips = B.map((b, k) => {
      const g = tagAt(words[k]!, 'p3w g', V(b.x, Y + H / 2, D / 2)); g.el.setAttribute('role', 'button'); g.el.tabIndex = 0; g.el.dataset.pick = String(k); return g;
    });
    tagAt(`<em>${t(ATT.sentence, L)}</em><button type="button" class="p3x" data-act="back" aria-label="${t(UI.back, L)}">${IC.close}</button>`, 'p3s', V(0, 2.8, -0.2));
    tagAt(`<button type="button" class="p3c" data-act="why" aria-label="${t(UI.why, L)}">💡</button>`, 'p3cc', V(-1.5, 2.0, -0.2));
    tagAt(`<button type="button" class="p3c" data-act="deep" aria-label="${t(UI.deeper, L)}">🔍</button>`, 'p3cc', V(1.5, 2.0, -0.2));
    let grow = 1, cur = -1, tt = 0, idle = 0;
    const light = (k: number) => {
      if (k === cur) return; cur = k; grow = 0; idle = 0;
      blk.forEach((b, j) => { const on = j === k; b.m.material = on ? litM : glassM; (b.face.material as MeshBasicMaterial).map = on ? b.light : b.dark; b.aura.material.opacity = on ? 0.55 : 0; b.g.position.y = Y + (on ? 0.06 : 0); });
      chips.forEach((c, j) => c.el.classList.toggle('on', j === k));
      [0, 1, 2, 3].filter((j) => j !== k).forEach((j, n) => {
        const a = arcs[n]!, s = ATT.score[k]![j]!, w = s / 100;
        a.curve = arc(B, k, j); a.w = w;
        for (const [m, r] of [[a.core, 0.012 + 0.04 * w], [a.halo, 0.05 + 0.09 * w]] as const) { m.geometry.dispose(); m.geometry = new TubeGeometry(a.curve, 64, r, 12); }
        a.n = a.core.geometry.index!.count; a.hn = a.halo.geometry.index!.count;
        (a.core.material as MeshBasicMaterial).opacity = 0.35 + 0.65 * w; (a.halo.material as MeshBasicMaterial).opacity = 0.08 + 0.3 * w;
        (a.core.material as MeshBasicMaterial).color.set(w >= 0.75 ? '#8b5cf6' : '#a5b4fc');
        a.chip.set(`${s}%`); a.chip.el.dataset.w = String(j); a.chip.el.classList.toggle('hi', w >= 0.75);
        a.chip.at.copy(a.curve.getPoint(0.5)).add(V(0, 0.1, 0)); a.chip.el.style.removeProperty('--dy'); a.chip.show(false);
      });
      st.draw();
    };
    light(ATT.start);
    const cam = { look: V(0, 1.22, 0), dir: V(0, 0.4, 1), r: 2.0 };
    return {
      look: { sky: ['#ddd6f5', '#ece8fa', '#f8f6fe'], exposure: 0.95, shadow: 2.8, key: [2, 7, 5] },
      lim: { az: [-0.45, 0.45], el: [0.15, 0.9], z: [0.8, 1.25] },
      cam, view: () => cam,
      at: B.map((b) => V(b.x, Y + H / 2, 0)), top: B.map((b) => V(b.x, Y + H + 0.2, 0)), names: [], hits: blk.map((b) => b.g),
      onFocus(i) { if (i !== null) light(i); },
      busy: () => grow < 1 || idle < 20, sway: () => grow >= 1,
      tick(dt) {
        tt += dt; idle += dt;
        if (grow < 1) grow = Math.min(1, grow + dt / 0.6);
        const e = 1 - Math.pow(1 - grow, 3);
        for (const a of arcs) {
          if (!a.curve) continue;
          a.core.geometry.setDrawRange(0, Math.floor((a.n * e) / 3) * 3); a.halo.geometry.setDrawRange(0, Math.floor((a.hn * e) / 3) * 3);
          if (a.chip.el.hidden && grow >= 1) a.chip.show(true);
          a.beads.forEach((b, m) => { const q = (tt * (0.3 + a.w * 0.4) + m * 0.5) % 1; b.position.copy(a.curve!.getPoint(Math.min(q, e))); b.scale.setScalar(0.1 + a.w * 0.16); b.material.opacity = (0.4 + 0.6 * a.w) * Math.sin(q * Math.PI); });
        }
        /* keep the % chips apart on screen: lift the higher one until they no longer touch */
        if (grow >= 1) {
          const cs = arcs.filter((a) => !a.chip.el.hidden).map((a) => ({ el: a.chip.el, r: (a.chip.el.firstElementChild ?? a.chip.el).getBoundingClientRect(), dy: parseFloat(a.chip.el.style.getPropertyValue('--dy')) || 0 }));
          cs.sort((p, q) => p.r.top - q.r.top);
          for (let m = 1; m < cs.length; m++) for (let n = 0; n < m; n++) {
            const p = cs[n]!, q = cs[m]!, ox = Math.min(p.r.right, q.r.right) - Math.max(p.r.left, q.r.left), oy = Math.min(p.r.bottom, q.r.bottom) - Math.max(p.r.top, q.r.top);
            if (ox > -4 && oy > -4) { const up = oy + 4; p.dy -= up; p.el.style.setProperty('--dy', `${p.dy}px`); p.r = new DOMRect(p.r.x, p.r.y - up, p.r.width, p.r.height); }
          }
        }
        const lb = blk[cur]; if (lb) lb.aura.material.opacity = 0.45 + 0.15 * Math.sin(tt * 2.2);
      },
    };
  });
}
