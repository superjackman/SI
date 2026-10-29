/* R38: the real three.js stage (lazy chunk). Everything is procedural: rounded glowing plates with a back plate for
   depth, arrow bars, residual lanes, a dashed decoder frame, the drill connector and travelling light. The camera is
   placed so that z = 0 maps 1:1 to CSS px, which lets DOM labels sit exactly on the plates. The scene tilts a little
   with the pointer (parallax) and boxes are picked with a raycaster. */
import * as THREE from 'three';
import { flowPath, STY, type Desc } from './layout';
import { NODES, PLUS, type Nd } from './txt';
import { animOn } from '../store/prefs';

export interface Stage { set(d: Desc): void; dispose(): void; el: HTMLCanvasElement }
export function webgl(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function rr(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function glowTex(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d')!;
  g.shadowColor = '#fff'; g.shadowBlur = 14; g.fillStyle = '#fff';
  g.beginPath(); (g as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect ? g.roundRect(18, 18, 92, 28, 8) : g.rect(18, 18, 92, 28); g.fill();
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
function dotTex(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

export function stage3d(host: HTMLElement, onPick: (n: Nd) => void): Stage {
  const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.setClearColor(0x000000, 0);
  const el = R.domElement; el.className = 'l4-gl'; host.prepend(el);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 1, 5000), root = new THREE.Group(); scene.add(root);
  const gTex = glowTex(), dTex = dotTex(), onA = () => { still = !animOn(); dirty = true; };
  let still = !animOn(), dirty = true; addEventListener('si-anim', onA);
  let D: Desc | null = null, W = 1, H = 1, plates: THREE.Mesh[] = [], halos: { m: THREE.MeshBasicMaterial; base: number; pulse: boolean }[] = [];
  let lights: { s: THREE.Sprite; path: [number, number][]; off: number }[] = [];
  let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0, last = 0, t0 = performance.now();
  const X = (x: number) => x - W / 2, Y = (y: number) => H / 2 - y;
  const disposeAll = () => {
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((q) => q.dispose()); });
    root.clear(); plates = []; halos = []; lights = [];
  };
  const bar = (x1: number, y1: number, x2: number, y2: number, w: number, col: string, op: number, z = 0) => {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 0.5) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
    m.position.set(X((x1 + x2) / 2), Y((y1 + y2) / 2), z); m.rotation.z = -Math.atan2(y2 - y1, x2 - x1); root.add(m);
  };
  const head = (x: number, y: number, dir: 'up' | 'down' | 'left', col: string, op: number, s = 5) => {
    const sh = new THREE.Shape();
    if (dir === 'up') { sh.moveTo(0, 0); sh.lineTo(-s, -s * 1.4); sh.lineTo(s, -s * 1.4); }
    else if (dir === 'down') { sh.moveTo(0, 0); sh.lineTo(-s, s * 1.4); sh.lineTo(s, s * 1.4); }
    else { sh.moveTo(0, 0); sh.lineTo(s * 1.4, s); sh.lineTo(s * 1.4, -s); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false }));
    m.position.set(X(x), Y(y), 0.5); root.add(m);
  };
  const build = () => {
    disposeAll(); if (!D) return; const L = D.lay, bh = L.bh;
    /* the decoder frame */
    const f = L.frame, fs = rr(f.w, f.h, 10), pts = fs.getPoints(12); pts.push(pts[0]!.clone());
    const fg = new THREE.BufferGeometry().setFromPoints(pts);
    const fl = new THREE.Line(fg, D.frameLit ? new THREE.LineBasicMaterial({ color: '#9cc8ff' }) : new THREE.LineDashedMaterial({ color: '#4a66b8', dashSize: 5, gapSize: 4 }));
    fl.computeLineDistances(); fl.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), -4); root.add(fl);
    const ff = new THREE.Mesh(new THREE.ShapeGeometry(fs), new THREE.MeshBasicMaterial({ color: D.frameLit ? '#10224e' : '#081230', transparent: true, opacity: D.frameLit ? 0.55 : 0.35, depthWrite: false }));
    ff.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), -6); root.add(ff);
    if (D.frameLit) { const hm = new THREE.MeshBasicMaterial({ map: gTex, color: '#5a9cff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
      const h = new THREE.Mesh(new THREE.PlaneGeometry(f.w * 1.28, f.h * 1.5), hm); h.position.set(X(f.x + f.w / 2), Y(f.y + f.h / 2), -7); root.add(h); halos.push({ m: hm, base: 0.3, pulse: true }); }
    /* arrows between boxes */
    const acol = D.back ? '#ff9a3c' : '#6f9cff';
    for (const a of L.arrows) {
      const s = D.st[a.lo], hi = D.st[a.hi], dim = s === 'dim' || hi === 'dim', op = dim ? 0.35 : 0.9;
      if (D.back) { bar(a.x, a.y1 - 7, a.x, a.y2 + 1, 2, acol, op); head(a.x, a.y1 - 1, 'down', acol, op, 4); }
      else { bar(a.x, a.y1 - 1, a.x, a.y2 + 7, 2, acol, op); head(a.x, a.y2 + 1, 'up', acol, op, 4); }
    }
    /* residual lanes */
    const rcol = D.resOn ? '#8fe3ff' : '#4f72c8', rop = D.resOn ? 1 : 0.7;
    for (const r of L.res) { for (let i = 0; i < r.length - 1; i++) { const [a1, b1] = r[i]!, [a2, b2] = r[i + 1]!; bar(a1, b1, i === r.length - 2 ? a2 + 6 : a2, b2, D.resOn ? 2 : 1.5, rcol, rop, -1); }
      const e = r[r.length - 1]!; head(e[0], e[1], 'left', rcol, rop, 4); }
    /* plates */
    for (const n of NODES) {
      const b = L.box[n], st = D.st[n], c = STY[st], cxp = X(b.x + b.w / 2), cyp = Y(b.y + b.h / 2), r = Math.min(9, bh / 2.6);
      const shape = rr(b.w, b.h, r);
      const back = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#02050f', transparent: true, opacity: 0.85 }));
      back.position.set(cxp + 2, cyp - 3, -3); root.add(back);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: c.fill }));
      m.position.set(cxp, cyp, 0); m.userData.nd = n; root.add(m); plates.push(m);
      const op = shape.getPoints(10); op.push(op[0]!.clone());
      const ol = new THREE.Line(new THREE.BufferGeometry().setFromPoints(op), new THREE.LineBasicMaterial({ color: c.stroke }));
      ol.position.set(cxp, cyp, 0.6); root.add(ol);
      if (c.glow > 0) {
        const hm = new THREE.MeshBasicMaterial({ map: gTex, color: c.stroke, transparent: true, opacity: c.glow, blending: THREE.AdditiveBlending, depthWrite: false });
        const h = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 1.36, b.h * 2.2), hm); h.position.set(cxp, cyp, -2); root.add(h);
        halos.push({ m: hm, base: c.glow, pulse: st === 'lit' || st === 'sel' || st === 'back' });
      }
      if (PLUS.has(n)) { /* the + disc (the "+" glyph itself is DOM text) */
        const dm = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: st === 'dim' ? '#1a2850' : '#2a56d6' }));
        dm.position.set(X(b.x + b.w - 11), cyp, 0.8); root.add(dm);
      }
    }
    /* drill connector */
    if (D.sel && L.panel) {
      const b = L.box[D.sel], y = b.y + b.h / 2, px = L.panel.x;
      bar(b.x + b.w, y, px, y, 3, '#8fe3ff', 1, 1);
      const hm = new THREE.MeshBasicMaterial({ map: dTex, color: '#8fe3ff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
      const h = new THREE.Mesh(new THREE.PlaneGeometry(px - b.x - b.w + 30, 26), hm); h.position.set(X((b.x + b.w + px) / 2), Y(y), 0.9); root.add(h); halos.push({ m: hm, base: 0.5, pulse: true });
      const dot = new THREE.Mesh(new THREE.CircleGeometry(4, 16), new THREE.MeshBasicMaterial({ color: '#d6f6ff' })); dot.position.set(X(px), Y(y), 1.2); root.add(dot);
    }
    /* travelling light */
    if (D.flow) {
      const p = flowPath(L, D.flow.a, D.flow.b), path = D.flow.back ? [p[1]!, p[0]!] : p, col = D.flow.back ? '#ffb060' : '#bfe6ff';
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dTex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        s.scale.set(18, 18, 1); s.position.z = 2; root.add(s); lights.push({ s, path, off: i / 3 });
      }
    }
  };
  const resize = (w: number, h: number) => {
    W = Math.max(1, w); H = Math.max(1, h); R.setSize(W, H, false); el.style.width = W + 'px'; el.style.height = H + 'px';
    cam.aspect = W / H; cam.position.set(0, 0, H / 2 / Math.tan((15 * Math.PI) / 180)); cam.near = 10; cam.far = cam.position.z * 3; cam.updateProjectionMatrix();
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame); if (document.hidden || now - last < 32) return; last = now; const t = (now - t0) / 1000;
    if (still) { if (!dirty) return; dirty = false; rx = 0; ry = 0; } // animation off: one still frame, no tilt / sway / pulse / moving lights
    const sway = still ? 0 : Math.sin(t * 0.6) * 0.012;
    rx += (ty * 0.035 - rx) * 0.08; ry += (tx * 0.035 + sway - ry) * 0.08; root.rotation.set(rx, ry, 0);
    for (const h of halos) h.m.opacity = h.pulse && !still ? h.base * (0.75 + 0.25 * Math.sin(t * 3)) : h.base;
    for (const l of lights) {
      const k = still ? l.off : (t * 0.45 + l.off) % 1, [a, b] = [l.path[0]!, l.path[l.path.length - 1]!];
      l.s.position.x = X(a[0] + (b[0] - a[0]) * k); l.s.position.y = Y(a[1] + (b[1] - a[1]) * k); (l.s.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI);
    }
    R.render(scene, cam);
  };
  const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  const click = (e: MouseEvent) => {
    const r = el.getBoundingClientRect(); v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, cam); const hit = ray.intersectObjects(plates, false)[0]; const n = hit?.object.userData.nd as Nd | undefined; if (n) onPick(n);
  };
  el.addEventListener('pointermove', move); el.addEventListener('click', click);
  raf = requestAnimationFrame(frame);
  return {
    el,
    set(d) { D = d; resize(d.lay.W, d.lay.H); build(); R.render(scene, cam); dirty = true; },
    dispose() { cancelAnimationFrame(raf); removeEventListener('si-anim', onA); disposeAll(); gTex.dispose(); dTex.dispose(); R.dispose(); el.remove(); },
  };
}
