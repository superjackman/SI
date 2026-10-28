/* R39: the three.js stage for layers 1, 2, 3 and 5 (lazy; three.js is shared with the layer-4 chunk). Same look as
   layer 4: rounded glowing plates with a back plate for depth, arrow bars with heads, dashed frames, the glowing
   connector into an opened box's panel and a travelling light. z = 0 maps 1:1 to CSS px so DOM labels sit on top. */
import * as THREE from 'three';
import { ACOL, STY, type G } from './geo';

export interface LxStage { set(g: G): void; dispose(): void; el: HTMLElement }
export function webgl(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function rr(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.max(0.5, Math.min(r, w / 2, h / 2));
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function tex(kind: 'glow' | 'dot'): THREE.Texture {
  const c = document.createElement('canvas'); c.width = kind === 'glow' ? 128 : 64; c.height = 64; const g = c.getContext('2d')!;
  if (kind === 'glow') { g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.fillRect(18, 18, 92, 28); }
  else { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

export function lxStage3d(host: HTMLElement, onPick: (id: string) => void): LxStage {
  const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.setClearColor(0x000000, 0);
  const el = R.domElement; el.className = 'l4-gl lx-gl'; host.prepend(el);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 1, 5000), root = new THREE.Group(); scene.add(root);
  const gTex = tex('glow'), dTex = tex('dot'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let D: G | null = null, W = 1, H = 1, plates: THREE.Mesh[] = [], halos: { m: THREE.MeshBasicMaterial; base: number }[] = [], lights: { s: THREE.Sprite; p: [number, number][]; len: number[]; off: number }[] = [];
  let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0, last = 0; const t0 = performance.now();
  const X = (x: number) => x - W / 2, Y = (y: number) => H / 2 - y;
  const mat = (col: string, op = 1, add = false) => new THREE.MeshBasicMaterial({ color: col, transparent: op < 1 || add, opacity: op, depthWrite: false, ...(add ? { blending: THREE.AdditiveBlending } : {}) });
  const clear = () => {
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((q) => q.dispose()); });
    root.clear(); plates = []; halos = []; lights = [];
  };
  const bar = (x1: number, y1: number, x2: number, y2: number, w: number, col: string, op: number, z = 0) => {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 0.3) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len + w * 0.3, w), mat(col, op)); m.position.set(X((x1 + x2) / 2), Y((y1 + y2) / 2), z); m.rotation.z = -Math.atan2(y2 - y1, x2 - x1); root.add(m);
  };
  const head = (x: number, y: number, ang: number, col: string, op: number, s = 4.5) => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-s * 1.5, s); sh.lineTo(-s * 1.5, -s);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(col, op)); m.position.set(X(x), Y(y), 0.5); m.rotation.z = -ang; root.add(m);
  };
  const glow = (cx: number, cy: number, w: number, h: number, col: string, op: number, z = -2) => {
    const hm = mat(col, op, true); hm.map = gTex; const h2 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), hm); h2.position.set(X(cx), Y(cy), z); root.add(h2); halos.push({ m: hm, base: op });
  };
  const build = () => {
    clear(); if (!D) return;
    for (const f of D.frames) {
      const on = f.st === 'lit' || f.st === 'sel', col = on ? '#9cc8ff' : f.st === 'dim' ? '#24345c' : '#3a5cc0', sh = rr(f.w, f.h, 10), pts = sh.getPoints(12); pts.push(pts[0]!.clone());
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), on ? new THREE.LineBasicMaterial({ color: col }) : new THREE.LineDashedMaterial({ color: col, dashSize: 5, gapSize: 3 }));
      ln.computeLineDistances(); ln.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), -4); root.add(ln);
      const fm = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(on ? '#10224e' : '#0a1736', 0.5)); fm.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), -6); root.add(fm);
      if (on) glow(f.x + f.w / 2, f.y + f.h / 2, f.w * 1.2, f.h * 1.25, '#5a9cff', 0.22, -7);
    }
    for (const e of D.edges) {
      const col = e.gold ? (e.st === 'lit' ? '#ffd27a' : '#8a7440') : ACOL[e.st], on = e.st === 'lit' || e.st === 'or', op = e.st === 'dim' ? 0.7 : 0.95, w = on ? 2.4 : 1.4, p = e.pts;
      const end = p.length - 1; let acc = 0;
      for (let i = 0; i < end; i++) {
        let [a1, b1] = p[i]!; let [a2, b2] = p[i + 1]!;
        if (i === end - 1 && e.head) { const L = Math.hypot(a2 - a1, b2 - b1), k = L > 6 ? (L - 5) / L : 0.2; a2 = a1 + (a2 - a1) * k; b2 = b1 + (b2 - b1) * k; }
        if (e.dash) { const L = Math.hypot(a2 - a1, b2 - b1); for (let t = 0; t < L; t += 1) { const ph = (acc + t) % 6; if (ph < 3) { const t2 = Math.min(L, t + 3 - ph); bar(a1 + ((a2 - a1) * t) / L, b1 + ((b2 - b1) * t) / L, a1 + ((a2 - a1) * t2) / L, b1 + ((b2 - b1) * t2) / L, w, col, op); t = t2 - 1; } } acc += L; }
        else bar(a1, b1, a2, b2, w, col, op);
        if (on) bar(a1, b1, a2, b2, 6, col, 0.25, -0.5);
      }
      if (e.head && end > 0) { const [a1, b1] = p[end - 1]!, [a2, b2] = p[end]!; head(a2, b2, Math.atan2(b2 - b1, a2 - a1), col, op); }
    }
    for (const n of D.nodes) {
      const c = n.tag ? { fill: '#0d1f4a', stroke: n.tag, glow: 0.15 } : STY[n.st], cx = n.x + n.w / 2, cy = n.y + n.h / 2, sh = rr(n.w, n.h, n.r);
      const bk = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat('#02050f', 0.85)); bk.position.set(X(cx) + 2, Y(cy) - 3, -3); root.add(bk);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: c.fill })); m.position.set(X(cx), Y(cy), 0); m.userData.id = n.id; root.add(m); plates.push(m);
      const op = sh.getPoints(10); op.push(op[0]!.clone());
      const ol = new THREE.Line(new THREE.BufferGeometry().setFromPoints(op), new THREE.LineBasicMaterial({ color: c.stroke })); ol.position.set(X(cx), Y(cy), 0.6); root.add(ol);
      if (c.glow > 0) glow(cx, cy, n.w * 1.3, n.h * 2, c.stroke, c.glow);
      if (n.plus) { const dm = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: n.st === 'dim' ? '#1a2850' : '#2a56d6' })); dm.position.set(X(n.x + n.w - 11), Y(n.y + n.h / 2), 0.8); root.add(dm); }
    }
    if (D.conn) {
      const { x1, x2, y } = D.conn; bar(x1, y, x2, y, 3, '#8fe3ff', 1, 1);
      const hm = mat('#8fe3ff', 0.55, true); hm.map = dTex; const h = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1 + 30, 26), hm); h.position.set(X((x1 + x2) / 2), Y(y), 0.9); root.add(h); halos.push({ m: hm, base: 0.5 });
      const dot = new THREE.Mesh(new THREE.CircleGeometry(4, 16), new THREE.MeshBasicMaterial({ color: '#d6f6ff' })); dot.position.set(X(x2), Y(y), 1.2); root.add(dot);
    }
    for (const p of D.flow) {
      const len = [0]; for (let i = 1; i < p.length; i++) len.push(len[i - 1]! + Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]));
      for (let i = 0; i < 2; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dTex, color: '#bfe6ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(16, 16, 1); s.position.z = 2; root.add(s); lights.push({ s, p, len, off: i / 2 }); }
    }
  };
  const resize = (w: number, h: number) => {
    W = Math.max(1, w); H = Math.max(1, h); R.setSize(W, H, false); el.style.width = W + 'px'; el.style.height = H + 'px';
    cam.aspect = W / H; cam.position.set(0, 0, H / 2 / Math.tan((15 * Math.PI) / 180)); cam.near = 10; cam.far = cam.position.z * 3; cam.updateProjectionMatrix();
  };
  const at = (l: (typeof lights)[number], k: number): [number, number] => {
    const L = l.len[l.len.length - 1]! * k; let i = 1; while (i < l.len.length - 1 && l.len[i]! < L) i++;
    const a = l.p[i - 1]!, b = l.p[i]!, seg = l.len[i]! - l.len[i - 1]! || 1, t = (L - l.len[i - 1]!) / seg; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame); if (document.hidden || now - last < 32) return; last = now; const t = (now - t0) / 1000;
    const sway = reduce ? 0 : Math.sin(t * 0.6) * 0.012;
    rx += (ty * 0.035 - rx) * 0.08; ry += (tx * 0.035 + sway - ry) * 0.08; root.rotation.set(rx, ry, 0);
    for (const h of halos) h.m.opacity = reduce ? h.base : h.base * (0.75 + 0.25 * Math.sin(t * 3));
    for (const l of lights) { const k = reduce ? 0.5 : (t * 0.45 + l.off) % 1, [x, y] = at(l, k); l.s.position.x = X(x); l.s.position.y = Y(y); (l.s.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI); }
    R.render(scene, cam);
  };
  const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  const click = (e: MouseEvent) => {
    const r = el.getBoundingClientRect(); v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, cam); const hit = ray.intersectObjects(plates, false)[0]; const id = hit?.object.userData.id as string | undefined; if (id) onPick(id);
  };
  el.addEventListener('pointermove', move); el.addEventListener('click', click);
  raf = requestAnimationFrame(frame);
  return {
    el,
    set(g) { D = g; resize(g.W, g.H); build(); R.render(scene, cam); },
    dispose() { cancelAnimationFrame(raf); clear(); gTex.dispose(); dTex.dispose(); R.dispose(); el.remove(); },
  };
}
