/* R30: the shared three.js stage of the 3D scenes. Imported only from the scene modules, which the labs load with a
   dynamic import, so three.js lands in its own lazy chunk. Named imports keep the chunk to the parts we use.
   R30b: a soft, clean look (the reference sheets): a hemisphere light plus one key light on standard materials,
   fake soft shadows (a radial-gradient decal on the floor), see-through halo spheres for glow, and crisp HTML labels
   laid over the canvas (real CSS text, so they stay >= 14 px and never blur). */
import {
  CanvasTexture, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera,
  PlaneGeometry, Scene, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderer, type BufferGeometry, type Material, type Object3D, type Texture,
} from 'three';

/** R30c: every solid in the three scenes uses this one material recipe (soft satin), so they look like one set */
export const satin = (color: string, o: Partial<{ opacity: number; emissive: string; glow: number }> = {}) =>
  new MeshStandardMaterial({
    color, roughness: 0.35, metalness: 0.05, transparent: o.opacity !== undefined, // pass an opacity to be able to fade it later opacity: o.opacity ?? 1,
    emissive: o.emissive ?? '#000000', emissiveIntensity: o.glow ?? 0,
  });

/** at most 30 frames a second while something animates (a phone screen asks for 60-120) */
export const MIN_DT = 1000 / 30 - 2;

export interface StageOpt {
  raf: (f: FrameRequestCallback) => number; caf: (id: number) => void;
  cam: [number, number, number]; look?: [number, number, number]; fov?: number;
  /** keep the camera far enough (along its direction) that a ball of this radius around `look` fits the box both ways */
  fit?: number;
  /** keep drawing every frame while this says so (a rolling ball); otherwise draw only when something changed */
  busy?: () => boolean;
  /** called before each frame with the seconds since the last one */
  tick?: (dt: number) => void;
  /** a tap (not a drag) at canvas pixel x, y */
  tap?: (x: number, y: number) => void;
  /** start angle of the turntable */
  yaw?: number;
  /** R33 pilot: take every pointer gesture instead of the turntable (canvas pixels; tap = moved less than 8 px) */
  grab?: { down(x: number, y: number): void; move(x: number, y: number): void; up(x: number, y: number, tap: boolean): void };
  /** R35: called after each frame, once the labels are placed (the callouts lay themselves out here) */
  after?: () => void;
}
/** an HTML label pinned to a point of the pivot; cls picks the look (see .s3t in s3d.css) */
export interface Tag { el: HTMLElement; at: Vector3; show(on: boolean): void; set(html: string): void }
export interface Stage {
  scene: Scene; cam: PerspectiveCamera; pivot: Group; renderer: WebGLRenderer; canvas: HTMLCanvasElement;
  draw(): void; dispose(): { geo: number; mat: number; tex: number };
  /** where a point of the pivot lands on the canvas, in CSS pixels */
  toScreen(p: Vector3): [number, number];
  tag(html: string, cls?: string): Tag;
  drop(t: Tag): void;
  /** a soft round shadow lying flat (radius r, darkness a) */
  blob(r: number, a?: number): Mesh;
  /** a see-through glow ball around something */
  halo(r: number, color: string, a?: number): Mesh;
}

export function stage(box: HTMLElement, o: StageOpt): Stage {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  box.appendChild(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // phones report 3; 2 looks the same and costs far less
  renderer.setClearColor(0xffffff, 0);
  const scene = new Scene(), pivot = new Group();
  /* R30c: one sky/ground light (white above, lavender below) and one key light: the same soft studio light everywhere */
  const key = new DirectionalLight(0xffffff, 1.7); key.position.set(3, 8, 6);
  scene.add(pivot, new HemisphereLight(0xffffff, 0xcfc3ff, 2.1), key);
  const cam = new PerspectiveCamera(o.fov ?? 36, 4 / 3, 0.1, 100);
  const look = new Vector3(...(o.look ?? [0, 0, 0])), dir = new Vector3(...o.cam).sub(look), dist0 = dir.length();
  dir.normalize();
  const aim = (d: number) => { cam.position.copy(look).addScaledVector(dir, d); cam.lookAt(look); };
  aim(dist0);
  pivot.rotation.y = o.yaw ?? 0;
  const texs = new Set<Texture>(), tags = new Set<Tag>();

  let W = 0, H = 0;
  const size = () => {
    const w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight);
    if (w === W && h === H) return; W = w; H = h;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    if (o.fit) {
      const fv = (cam.fov * Math.PI) / 360, fh = Math.atan(Math.tan(fv) * cam.aspect);
      aim(Math.max(dist0, o.fit / Math.sin(Math.min(fv, fh))));
    }
    cam.updateProjectionMatrix();
  };
  const v = new Vector3();
  const toScreen = (p: Vector3): [number, number] => {
    pivot.updateMatrixWorld(); v.copy(p).applyMatrix4(pivot.matrixWorld).project(cam);
    return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H];
  };
  const place = () => {
    const took: [number, number, number, number][] = []; // R35: name labels side by side step up (or down) instead of overlapping
    for (const t of tags) {
      if (t.el.hidden) continue;
      let [x, y] = toScreen(t.at);
      if (t.el.dataset.clamp !== undefined) { // R33 v2: keep a bubble on the screen; its arrow still points at the thing
        const c = t.el.firstElementChild as HTMLElement, hw = c.offsetWidth / 2, nx = Math.max(hw + 8, Math.min(W - hw - 8, x));
        if (t.el.dataset.clamp === 'x') { // a label: nudge it in only while its thing is on screen
          if (x > -hw && x < W + hw) x = Math.max(hw + 4, Math.min(W - hw - 4, x));
          const h = c.offsetHeight, top = (Number(box.dataset.padt) || 0) + h, bump = (yy: number) => took.some((r) => Math.abs(r[0] - x) < r[2] + hw + 2 && Math.abs(r[1] - yy) < Math.max(r[3], h) + 2);
          if (hw > 0 && bump(y)) { for (const d of [-1, 1, -2, 2]) { const yy = y + d * (h + 4); if (yy > top && yy < H - 4 && !bump(yy)) { y = yy; break; } } }
          if (hw > 0) took.push([x, y, hw, h]);
        }
        else { t.el.style.setProperty('--ax', `${(x - nx).toFixed(1)}px`); x = nx; y = Math.max(c.offsetHeight + 18 + (Number(box.dataset.padt) || 0), y); } // v3: the stage runs under a top bar this tall
      }
      t.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }
  };
  /* render on demand: one frame when something changed (a tap, a drag step, a slider, a resize); a run of frames only
     while an animation is on, capped at 30 per second; when nothing moves, no frame is asked for at all */
  const S = (window as unknown as { __si3d?: { frames?: number } }).__si3d;
  let raf = 0, last = 0, drawn = 0, dead = false;
  const frame = (ts: number) => {
    raf = 0; if (dead) return;
    const run = drag || !!o.busy?.();
    if (run && drawn && ts - drawn < MIN_DT) { raf = o.raf(frame); return; } // too soon: wait for the next screen frame
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; drawn = ts;
    size(); o.tick?.(dt); renderer.render(scene, cam); place(); o.after?.(); if (S) S.frames = (S.frames ?? 0) + 1;
    if (drag || o.busy?.()) raf = o.raf(frame); else { last = 0; drawn = 0; }
  };
  const draw = () => { if (!raf && !dead) raf = o.raf(frame); };
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw); ro?.observe(box);

  /* drag left / right turns the turntable; up / down stays a page scroll (touch-action: pan-y) */
  let drag = false, x0 = 0, y0 = 0, moved = 0, yaw0 = 0;
  const at = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e: PointerEvent) => { drag = true; x0 = e.clientX; y0 = e.clientY; moved = 0; yaw0 = pivot.rotation.y; try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ } if (o.grab) { o.grab.down(...at(e)); draw(); } };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    moved = Math.max(moved, Math.hypot(e.clientX - x0, e.clientY - y0));
    if (o.grab) { o.grab.move(...at(e)); draw(); return; }
    pivot.rotation.y = yaw0 + (e.clientX - x0) * 0.012; draw();
  };
  const up = (e: PointerEvent) => {
    if (!drag) return; drag = false;
    if (o.grab) { o.grab.up(...at(e), moved < 8); draw(); return; }
    if (moved < 8 && o.tap) { const r = canvas.getBoundingClientRect(); o.tap(e.clientX - r.left, e.clientY - r.top); }
    draw();
  };
  const cancel = () => { drag = false; };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel);

  const tag = (html: string, cls = ''): Tag => {
    const el = document.createElement('span');
    el.className = 's3t' + (cls ? ' ' + cls : ''); el.setAttribute('aria-hidden', 'true'); el.innerHTML = `<span>${html}</span>`;
    box.appendChild(el);
    const t: Tag = { el, at: new Vector3(), show: (on) => { el.hidden = !on; draw(); }, set: (h) => { const s = el.firstElementChild!; if (s.innerHTML !== h) s.innerHTML = h; draw(); } };
    tags.add(t); draw(); return t;
  };
  const drop = (t: Tag) => { t.el.remove(); tags.delete(t); };
  let shadowTex: CanvasTexture | null = null;
  const blob = (r: number, a = 0.32) => {
    if (!shadowTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(67,56,202,1)'); gr.addColorStop(0.45, 'rgba(67,56,202,.45)'); gr.addColorStop(1, 'rgba(67,56,202,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      shadowTex = new CanvasTexture(c); shadowTex.colorSpace = SRGBColorSpace; texs.add(shadowTex);
    }
    const m = new Mesh(new PlaneGeometry(2 * r, 2 * r), new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: a, depthWrite: false, side: DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
  };
  const halo = (r: number, color: string, a = 0.18) => {
    const m = new Mesh(new SphereGeometry(r, 32, 20), new MeshBasicMaterial({ color, transparent: true, opacity: a, depthWrite: false }));
    m.renderOrder = 2; return m;
  };

  const dispose = () => {
    dead = true; if (raf) o.caf(raf); raf = 0; ro?.disconnect();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel);
    for (const t of [...tags]) drop(t);
    const geos = new Set<BufferGeometry>(), mats = new Set<Material>();
    scene.traverse((ob: Object3D) => {
      const m = ob as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      if (m.geometry) geos.add(m.geometry);
      if (m.material) for (const x of Array.isArray(m.material) ? m.material : [m.material]) {
        mats.add(x); const map = (x as Material & { map?: Texture | null }).map; if (map) texs.add(map);
      }
    });
    geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); texs.forEach((t) => t.dispose());
    scene.clear(); renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
    canvas.remove();
    return { geo: geos.size, mat: mats.size, tex: texs.size };
  };
  size(); draw();
  return { scene, cam, pivot, renderer, canvas, draw, dispose, toScreen, tag, drop, blob, halo };
}
