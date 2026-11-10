/* A round bowl. The real knobs still move the ball; the picture is a circular cup so the shape is obvious. */
import { tx, type L } from '../l4/txt';
import { bindOrbit } from '../ui/dial';
import { paint } from '../theme/paint';
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const WSTAR = 2, BSTAR = 1, RPARAM = 2.55, R = 1.7, H = 1.55;

function cup(w: number, b: number) {
  let dw = w - WSTAR, db = b - BSTAR;
  const rad = Math.hypot(dw, db);
  const clipped = Math.min(rad, RPARAM);
  const s = rad > 1e-6 ? clipped / rad : 0;
  dw *= s; db *= s;
  const t = clipped / RPARAM;
  return new THREE.Vector3((dw / RPARAM) * R, t * t * H, (db / RPARAM) * R);
}

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  const say = z('罚分是一只圆碗。球从碗边滚向圈住的最低点，路上留下一串点。拖动可以换个角度看。', 'The penalty is a round bowl. The ball rolls from the rim to the ring at the bottom and leaves a trail of dots. Drag to look from another side.');
  if (!gl) { host.innerHTML = `<div class="lab-say">${say}</div>`; return; }
  host.innerHTML = `<div class="lab-say">${say}</div><div class="bowl-stage"><canvas class="lab-gl"></canvas></div>`;
  const stage = host.querySelector('.bowl-stage')!;
  const canvas = host.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'bowl-overlay';
  stage.appendChild(labels.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paint('card'));
  scene.add(new THREE.AmbientLight(paint('white'), 0.7));
  const sun = new THREE.DirectionalLight(paint('white'), 1.15);
  sun.position.set(2.4, 6.5, 3.2);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(paint('mark-bg'), 0.45);
  fill.position.set(-3.2, 2.4, -2);
  scene.add(fill);
  const NR = 22, NA = 56;
  const positions: number[] = [0, 0, 0];
  const colors: number[] = [];
  const floor = new THREE.Color(paint('good-bg'));
  const wall = new THREE.Color(paint('mark-bg'));
  const pushColor = (t: number) => {
    const c = floor.clone().lerp(wall, t * 0.85);
    colors.push(c.r, c.g, c.b);
  };
  pushColor(0);
  for (let ir = 1; ir <= NR; ir++) {
    const t = ir / NR;
    for (let ia = 0; ia < NA; ia++) {
      const th = (ia / NA) * Math.PI * 2;
      positions.push(Math.cos(th) * t * R, t * t * H, Math.sin(th) * t * R);
      pushColor(t);
    }
  }
  const indices: number[] = [];
  for (let ia = 0; ia < NA; ia++) indices.push(0, 1 + (ia + 1) % NA, 1 + ia);
  for (let ir = 0; ir < NR - 1; ir++) {
    for (let ia = 0; ia < NA; ia++) {
      const a = 1 + ir * NA + ia, b = 1 + ir * NA + (ia + 1) % NA;
      const c = a + NA, d = b + NA;
      indices.push(a, b, d, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, side: THREE.DoubleSide })));
  const link = new THREE.Color(paint('link'));
  for (const t of [0.33, 0.55, 0.77, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= NA; i++) {
      const th = (i / NA) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(th) * t * R, t * t * H + 0.012, Math.sin(th) * t * R));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: link, transparent: true, opacity: t === 1 ? 0.9 : 0.45 })));
  }
  const seam = (along: 'w' | 'b') => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = -1 + (i / 40) * 2;
      const x = along === 'w' ? u * R : 0;
      const zz = along === 'b' ? u * R : 0;
      pts.push(new THREE.Vector3(x, u * u * H + 0.02, zz));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(paint('ink')) })));
  };
  seam('w'); seam('b');
  const rimX = R * 0.92, rimZ = -R * 0.28;
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(rimX, 0.02, rimZ), new THREE.Vector3(rimX, H, rimZ)]), new THREE.LineBasicMaterial({ color: new THREE.Color(paint('ink')) })));
  const tag = (text: string, x: number, y: number, zz: number, extra = '') => {
    const el = document.createElement('span');
    el.className = `bowl-tag ${extra}`;
    el.textContent = text;
    const o = new CSS2DObject(el);
    o.position.set(x, y, zz);
    scene.add(o);
  };
  tag(z('旋钮 w', 'knob w'), R * 0.78, 0.16, 0.02);
  tag(z('旋钮 b', 'knob b'), 0.02, 0.16, R * 0.78);
  tag(z('罚分', 'penalty'), rimX * 0.92, H * 0.62, rimZ, 'up');
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 28, 20),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(paint('highlight')), emissive: new THREE.Color(paint('highlight')), emissiveIntensity: 0.7, roughness: 0.25 }),
  );
  scene.add(ball);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 10, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('good')) }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, (0.46 / R) ** 2 * H + 0.06, 0);
  scene.add(ring);
  const trail: THREE.Object3D[] = [];
  let lastPoint: THREE.Vector3 | null = null;
  const dotGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('highlight')) });
  const place = (w: number, b: number) => {
    const p = cup(w, b);
    ball.position.set(p.x, p.y + 0.2, p.z);
    if (lastPoint && lastPoint.distanceTo(p) < 0.03) return;
    if (lastPoint) {
      const dir = new THREE.Vector3().subVectors(p, lastPoint);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, Math.max(0.02, dir.length()), 6), dotMat);
      rod.position.copy(lastPoint).add(p).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      scene.add(rod);
      trail.push(rod);
    }
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(p);
    scene.add(dot);
    trail.push(dot);
    lastPoint = p.clone();
    while (trail.length > 48) scene.remove(trail.shift()!);
  };
  place(0, 0);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  const lookAt = new THREE.Vector3(0, 0.42, 0);
  let yaw = 0.78, pitch = 0.58;
  const look = () => {
    const dist = 6.15;
    camera.position.set(lookAt.x + dist * Math.cos(pitch) * Math.sin(yaw), lookAt.y + dist * Math.sin(pitch), lookAt.z + dist * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(lookAt);
  };
  look();
  const resize = () => {
    const w = stage.clientWidth || 440, h = stage.clientHeight || 270;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const draw = () => { resize(); renderer.render(scene, camera); labels.render(scene, camera); };
  draw();
  const onMove = (ev: Event) => {
    const d = (ev as CustomEvent<{ v: number[] }>).detail;
    if (!d?.v || d.v.length < 2) return;
    place(d.v[0] ?? 0, d.v[1] ?? 0);
    draw();
  };
  (host.closest('.st-article') || host).addEventListener('knob-move', onMove);
  let y0 = yaw, p0 = pitch;
  bindOrbit(canvas, {
    value: () => yaw,
    begin: () => { y0 = yaw; p0 = pitch; },
    move: (dx, dy) => {
      yaw = y0 + dx * 0.008;
      pitch = Math.min(1.05, Math.max(0.34, p0 + dy * 0.005));
      look(); draw();
    },
  });
  new ResizeObserver(() => draw()).observe(stage);
}
