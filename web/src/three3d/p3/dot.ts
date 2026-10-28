/* R33 pilot v4, page 4: the dot product as a real three.js scene, modelled in code after the reference "Drag the dot"
   sheet: a lavender room with a glowing grid floor that runs off into the haze; two chunky glossy arrows with rounded
   tips stand up from one white ball on the floor, the lavender one leaning left, the pink one right with a glossy
   lavender ball on its tip that you drag. A translucent glass fan opens between them with the angle on it; the pink
   arrow's projection on the lavender one glows pink along it (a dotted drop line shows where it lands) and the pink
   arrow lays a soft pink streak on the floor. Projection × lavender length = the dot product, on a chip. The length
   slider under the picture (the shell's dial) makes the pink arrow longer or shorter.
   Drag plane: the arrows stand in the upright plane z = 0, so the handle is dragged on that wall plane (not the floor);
   a floor drag would need the arrows to lie flat, which the reference does not do. */
import {
  BufferGeometry, CapsuleGeometry, Color, DoubleSide, Float32BufferAttribute, LineBasicMaterial, LineSegments, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  PlaneGeometry, Quaternion, Shape, ExtrudeGeometry, RingGeometry, ShadowMaterial, SphereGeometry, TorusGeometry, Vector2, Vector3, type Sprite,
} from 'three';
import { scene, V, type P3, type SApi } from './base';
import { canvasTex, glow, shade, toy } from './look';
import { dotInfo, t, UI } from '../../pilot3d/text';

/** the lavender arrow (fixed) and where the pink one starts: its angle (degrees) and length */
export const AV = { deg: 124, len: 2.5 }, B0 = { deg: 48, len: 2.7 }, LEN = { min: 1.4, max: 3.4 };
const UP = new Vector3(0, 1, 0), rad = (d: number) => (d * Math.PI) / 180;
const SR = 0.19, HL = 0.62, HR = 0.46; // shaft radius, head length, head radius
/** a chunky arrow head: a rounded triangle, extruded with a soft bevel (it faces you, like the reference's toy arrows) */
function headGeo(): ExtrudeGeometry {
  const r = 0.09, pts = [new Vector2(-HR, 0), new Vector2(HR, 0), new Vector2(0, HL)], sh = new Shape();
  /* round every corner: start part-way along an edge, then a quadratic curve through each corner */
  const mix = (a: Vector2, b: Vector2, f: number) => a.clone().lerp(b, f);
  pts.forEach((c, k) => {
    const pv = pts[(k + 2) % 3]!, nx = pts[(k + 1) % 3]!, f1 = r / c.distanceTo(pv), f2 = r / c.distanceTo(nx);
    const a = mix(c, pv, f1 * 1.6), b = mix(c, nx, f2 * 1.6);
    if (k === 0) sh.moveTo(a.x, a.y); else sh.lineTo(a.x, a.y);
    sh.quadraticCurveTo(c.x, c.y, b.x, b.y);
  });
  sh.closePath();
  const g = new ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 6, curveSegments: 10 });
  g.translate(0, 0.08, -0.07); g.computeVertexNormals(); return g;
}
export function make(box: HTMLElement, api: SApi): P3 {
  const a = V(Math.cos(rad(AV.deg)) * AV.len, Math.sin(rad(AV.deg)) * AV.len, 0), ah = a.clone().normalize();
  let th = rad(B0.deg), len = B0.len;
  const b = new Vector3(), O = V(0, 0.16, 0);
  return scene(box, api, (st, P) => {
    const L = api.lang;
    /* the floor: a glowing grid that fades into the haze, and a shadow catcher under the arrows */
    const grid = new Mesh(new PlaneGeometry(16, 12), new MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(1024, 768, (g, w, h) => {
      const bg = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.55); bg.addColorStop(0, 'rgba(246,240,255,.55)'); bg.addColorStop(0.6, 'rgba(226,214,252,.35)'); bg.addColorStop(1, 'rgba(214,200,250,0)');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in';
      const m = g.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w / 2); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h);
    }) }));
    grid.rotation.x = -Math.PI / 2; grid.position.set(0, 0, 1); grid.renderOrder = 0; P.add(grid);
    /* the grid itself as real lines (a texture's lines melt away at this low angle), brighter near the arrows */
    const gp: number[] = [], gc: number[] = [], gC = new Color('#ffffff'), fl = new Color('#d7cbf7'), cc = new Color();
    const seg = (x0: number, z0: number, x1: number, z1: number) => { for (const [x, z] of [[x0, z0], [x1, z1]] as const) { gp.push(x, 0.004, z); cc.copy(gC).lerp(fl, Math.min(1, Math.hypot(x / 6, (z - 1) / 4.5))); gc.push(cc.r, cc.g, cc.b); } };
    for (let x = -6; x <= 6.01; x += 0.5) for (let z = -3.5; z < 5.5; z += 0.5) seg(x, z, x, z + 0.5);
    for (let z = -3.5; z <= 5.51; z += 0.5) for (let x = -6; x < 6; x += 0.5) seg(x, z, x + 0.5, z);
    const lg = new BufferGeometry(); lg.setAttribute('position', new Float32BufferAttribute(gp, 3)); lg.setAttribute('color', new Float32BufferAttribute(gc, 3));
    const lines = new LineSegments(lg, new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, toneMapped: false })); lines.renderOrder = 1; P.add(lines);
    const catcher = new Mesh(new PlaneGeometry(12, 9), new ShadowMaterial({ color: '#6d4fc4', opacity: 0.16 }));
    catcher.rotation.x = -Math.PI / 2; catcher.position.y = 0.005; catcher.receiveShadow = true; P.add(catcher);
    const back = glow('#f5ecff', 7, 0.14); back.position.set(0, 2.2, -3); P.add(back);
    /* the arrows: a capsule shaft and a rounded lathe head in glossy toy plastic, a soft glow along each */
    const head = headGeo(), q = new Quaternion();
    const arrow = (c: string, e: string, gc: string, end: number) => {
      const m = toy(c, { rough: 0.16, coat: 1, emissive: e, glow: 0.16 }), g = new Group(); P.add(g);
      const s = new Mesh(undefined, m), h = new Mesh(head, m); g.add(s, h);
      const gl: Sprite[] = [0, 1, 2, 3].map(() => { const x = glow(gc, 0.7, 0.32); x.position.z = -0.6; P.add(x); return x; });
      let lastL = -1;
      return (to: Vector3) => {
        const l = to.length() - end, d = to.clone().normalize(), sl = Math.max(0.05, l - HL + 0.04);
        if (Math.abs(sl - lastL) > 1e-3) { s.geometry.dispose(); s.geometry = new CapsuleGeometry(SR, Math.max(0.01, sl - SR), 8, 24); lastL = sl; }
        q.setFromUnitVectors(UP, d); g.quaternion.copy(q); g.position.copy(O);
        s.position.set(0, sl / 2, 0); h.position.set(0, sl - 0.04, 0);
        gl.forEach((x, k) => { x.position.copy(O).addScaledVector(d, (l * (k + 0.5)) / 4); x.position.z = -0.45; });
        shade(g, true, false);
      };
    };
    arrow('#b89cff', '#8b5cf6', '#c4b5fd', 0)(a);
    const setB = arrow('#ff94bd', '#ec4899', '#fbcfe8', 0.3);
    const start = new Mesh(new SphereGeometry(0.22, 40, 28), toy('#ffffff', { rough: 0.12, coat: 1, emissive: '#f5d0fe', glow: 0.3 })); start.position.copy(O); P.add(start); shade(start, true, false);
    const startG = glow('#f0abfc', 0.9, 0.55); startG.position.copy(O); P.add(startG);
    /* the handle: a glossy lavender ball on the pink tip, a glow and a ring that says "drag me" */
    const tip = new Mesh(new SphereGeometry(0.34, 48, 32), toy('#b9a6f5', { rough: 0.12, coat: 1, emissive: '#7c3aed', glow: 0.18 })); P.add(tip); shade(tip, true, false);
    const tipG = glow('#ddd6fe', 1.3, 0.6); P.add(tipG);
    const hint = new Mesh(new TorusGeometry(0.5, 0.014, 8, 64), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, toneMapped: false })); P.add(hint);
    /* the translucent fan between the arrows: frosted glass, rings every so often and a bright rim */
    const R = 1.7;
    const fanM = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.25, transmission: 0.55, thickness: 0.05, transparent: true, opacity: 0.42, side: DoubleSide, depthWrite: false, emissive: '#efe7ff', emissiveIntensity: 0.25 });
    const lineM = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, side: DoubleSide, depthWrite: false, toneMapped: false });
    const rimM = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, side: DoubleSide, depthWrite: false, toneMapped: false });
    const fan = new Mesh(undefined, fanM), rim = new Mesh(undefined, rimM), rings = [0.55, 0.95, 1.33].map(() => new Mesh(undefined, lineM));
    const fanG = new Group(); fanG.position.set(O.x, O.y, -0.02); fanG.add(fan, rim, ...rings); fan.renderOrder = 3; rim.renderOrder = rings[0]!.renderOrder = 4; P.add(fanG);
    /* the projection: a pink glowing tube along the lavender arrow, a dotted drop line, a pink streak on the floor */
    const prM = toy('#ff9cc6', { rough: 0.2, coat: 1, emissive: '#ec4899', glow: 0.55 });
    const proj = new Mesh(undefined, prM), projG = new Group(); projG.add(proj); P.add(projG);
    const projGl: Sprite[] = [0, 1, 2].map(() => { const x = glow('#f9a8d4', 0.6, 0.45); P.add(x); return x; });
    const dotsM = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), dotG = new SphereGeometry(0.022, 10, 8);
    const dashes = Array.from({ length: 14 }, () => { const m = new Mesh(dotG, dotsM); P.add(m); return m; });
    const streak = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false, map: canvasTex(256, 64, (g, w, h) => {
      const r = g.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(255,170,210,0)'); r.addColorStop(0.15, 'rgba(255,170,210,.9)'); r.addColorStop(0.85, 'rgba(255,150,200,.8)'); r.addColorStop(1, 'rgba(255,150,200,0)');
      g.fillStyle = r; g.filter = 'blur(6px)'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 10, h / 2 - 14, 0, 0, Math.PI * 2); g.fill();
    }) }));
    streak.rotation.x = -Math.PI / 2; streak.position.y = 0.012; streak.renderOrder = 2; P.add(streak);
    const ang = st.tag('', 'p3n'), sh = st.tag('', 'p3n sh'), val = st.tag('', 'p3n v'); val.el.dataset.clamp = 'x';
    let pulse = 0, tt = 0;
    const pose = () => {
      b.set(Math.cos(th) * len, Math.sin(th) * len, 0);
      setB(b); const T = O.clone().add(b); tip.position.copy(T); tipG.position.set(T.x, T.y, T.z - 0.1); hint.position.copy(T);
      const d = dotInfo(a.x, a.y, b.x, b.y), s = b.dot(ah), F = ah.clone().multiplyScalar(s);
      /* the projection tube, on top of the lavender arrow (behind the start when negative) */
      const n = Math.abs(s); proj.visible = n > 0.08; projGl.forEach((x) => (x.visible = proj.visible));
      if (proj.visible) {
        proj.geometry.dispose(); proj.geometry = new CapsuleGeometry(0.075, Math.max(0.01, n - 0.15), 6, 16);
        projG.quaternion.setFromUnitVectors(UP, s >= 0 ? ah : ah.clone().negate()); projG.position.set(O.x, O.y, 0.12); proj.position.set(0, n / 2, 0);
        projGl.forEach((x, k) => { x.position.copy(O).addScaledVector(F, (k + 0.5) / 3); x.position.z = 0.14; });
      }
      prM.color.set(s >= 0 ? '#ff9cc6' : '#fdba74'); prM.emissive.set(s >= 0 ? '#ec4899' : '#f97316');
      const dl = b.clone().sub(F), dn = dl.length();
      dashes.forEach((m, k) => { const f = (k + 0.5) / dashes.length; m.visible = dn > 0.3 && f * dn > 0.32 && f * dn < dn - 0.32; m.position.copy(O).add(F).addScaledVector(dl, f); m.position.z = 0.06; });
      /* the floor streak: the pink arrow laid down toward the front right by a light from the back left */
      const fx = b.x * 0.8 + b.y * 0.4, fz = b.y * 0.42 + 0.1; streak.position.set(fx / 2 + 0.15, 0.012, fz / 2 + 0.12); streak.rotation.z = -Math.atan2(fz, fx); streak.scale.set(Math.hypot(fx, fz) * 0.6 + 0.3, 0.5, 1);
      /* the fan between the two directions */
      const ta = rad(AV.deg), lo = Math.min(th, ta), sw = Math.max(0.01, Math.abs(ta - th));
      fan.geometry.dispose(); fan.geometry = new RingGeometry(0.08, R, 64, 1, lo, sw);
      rim.geometry.dispose(); rim.geometry = new RingGeometry(R - 0.02, R + 0.02, 64, 1, lo, sw);
      rings.forEach((m, k) => { const r = [0.55, 0.95, 1.33][k]!; m.geometry.dispose(); m.geometry = new RingGeometry(r - 0.007, r + 0.007, 48, 1, lo, sw); });
      const mid = lo + sw / 2; ang.set(`${d.deg}°`); ang.at.set(O.x + Math.cos(mid) * (R * 0.62), O.y + Math.sin(mid) * (R * 0.62), 0.05);
      sh.set(`${t(UI.shadow, L)} ${(Math.round(s * 10) / 10).toFixed(1)}`); sh.at.copy(O).addScaledVector(F, 0.5); sh.at.x -= 0.75; sh.at.y -= 0.05;
      val.set(`a·b = ${d.dot.toFixed(1)}`); val.at.set(1.25, 0.02, 0.9);
      api.dot?.(a.x, a.y, b.x, b.y);
      pulse = 0; st.draw();
    };
    pose();
    /* drag the ball: the pointer's ray meets the upright plane z = 0 (the arrows' plane); it only turns the arrow */
    const ndc = new Vector3(), dir = new Vector3(), inv = new Vector3();
    const onWall = (x: number, y: number) => {
      const r = st.canvas.getBoundingClientRect();
      ndc.set((x / r.width) * 2 - 1, -(y / r.height) * 2 + 1, 0.5).unproject(st.cam);
      dir.copy(ndc).sub(st.cam.position).normalize();
      if (Math.abs(dir.z) < 1e-4) return;
      const k = -st.cam.position.z / dir.z, p = st.cam.position.clone().addScaledVector(dir, k);
      P.worldToLocal(inv.copy(p));
      th = Math.max(rad(4), Math.min(rad(176), Math.atan2(Math.max(0, inv.y - O.y), inv.x - O.x))); pose();
    };
    let grabbed = false;
    const CAM = { look: V(0, 0.98, 0), dir: V(0, 0.32, 1), r: 2.2 };
    return {
      cam: CAM, view: () => CAM,
      look: { sky: ['#c9bcf2', '#d9cef8', '#ebe4fd'], exposure: 0.88, fog: [2, 10], shadow: 3.2, key: [-3, 7, 4] },
      lim: { az: [-0.35, 0.35], el: [0.1, 0.7], z: [0.85, 1.2] },
      marks: { pa: O.clone().add(a), pb: tip.position, o: O },
      at: [tip.position], top: [V(0, 3.6, 0)], names: [],
      hold: (x, y) => { const [sx, sy] = st.toScreen(tip.position); grabbed = Math.hypot(sx - x, sy - y) < 60; if (grabbed) { tipG.scale.setScalar(1.8); hint.visible = false; } return grabbed; },
      drag: (x, y) => { if (grabbed) onWall(x, y); },
      drop: () => { grabbed = false; tipG.scale.setScalar(1.3); st.draw(); },
      input: (v) => { len = Math.max(LEN.min, Math.min(LEN.max, v)); pose(); },
      /** R34: a tap (no drag) turns the pink arrow one step; past the far side it starts again */
      turn: (deg: number) => { th += rad(deg); if (th > rad(176)) th = rad(4); pose(); },
      busy: () => pulse < 6, sway: () => true,
      tick(dt) { tt += dt; pulse += dt; if (hint.visible) { const k = 1 + 0.12 * Math.sin(tt * 3); hint.scale.setScalar(k); (hint.material as MeshBasicMaterial).opacity = 0.5 + 0.35 * Math.sin(tt * 3); } },
    };
  });
}
