/* The loss of the two-knob line, drawn as a lit bowl. The ball follows the knobs on this station. */
import { tx, type L } from '../l4/txt';
import { paint } from '../theme/paint';
import * as THREE from 'three';

const LINE: [number, number][] = [[1, 3], [2, 5], [3, 7]];
const lossAt = (w: number, b: number) => LINE.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / LINE.length;
const W0 = -1, W1 = 4, B0 = -1, B1 = 4, SPAN = 4.4, N = 40;

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  const say = z('罚分是一只碗。旋钮停在哪，球就在碗的哪一处。自动拧的时候，球顺着碗壁往下滚，留下一道痕迹。圈住的那一点是最低。拖动可以换个角度看。', 'The penalty is a bowl. Where the knobs sit, the ball sits. When they auto-turn, the ball rolls down and leaves a trail. The ring marks the lowest point. Drag to look from another side.');
  if (!gl) { host.innerHTML = `<div class="lab-say">${say}</div>`; return; }
  host.innerHTML = `<div class="lab-say">${say}</div><div class="bowl-stage"><canvas class="lab-gl"></canvas></div><div class="bowl-axes"><span>${z('旋钮 w', 'knob w')}</span><span>${z('旋钮 b', 'knob b')}</span><span>${z('罚分', 'penalty')}</span><span>${z('圈 = 最低', 'ring = lowest')}</span></div>`;
  const canvas = host.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paint('card'));
  scene.add(new THREE.AmbientLight(paint('white'), 0.72));
  const sun = new THREE.DirectionalLight(paint('white'), 1.25);
  sun.position.set(3.2, 7, 2.4);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(paint('mark-bg'), 0.55);
  fill.position.set(-4, 3.5, -2);
  scene.add(fill);
  const geo = new THREE.PlaneGeometry(SPAN, SPAN, N - 1, N - 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const Ls: number[] = [];
  let maxL = 1;
  for (let i = 0; i < pos.count; i++) {
    const w = W0 + ((pos.getX(i) + SPAN / 2) / SPAN) * (W1 - W0);
    const b = B0 + ((pos.getY(i) + SPAN / 2) / SPAN) * (B1 - B0);
    const L = lossAt(w, b);
    Ls.push(L);
    if (L > maxL) maxL = L;
  }
  const floor = new THREE.Color(paint('good-bg'));
  const wall = new THREE.Color(paint('mark-bg'));
  const colors = new Float32Array(pos.count * 3);
  const height = (L: number) => (L / maxL) ** 0.62 * 2.7;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), py = pos.getY(i), L = Ls[i] ?? 0;
    pos.setXYZ(i, x, height(L), -py);
    const c = floor.clone().lerp(wall, Math.min(1, (L / maxL) ** 0.55));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: THREE.DoubleSide })));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('link')), wireframe: true, transparent: true, opacity: 0.28 })));
  const toWorld = (w: number, b: number) => {
    const x = ((w - W0) / (W1 - W0) - 0.5) * SPAN;
    const z = -((b - B0) / (B1 - B0) - 0.5) * SPAN;
    return new THREE.Vector3(x, height(lossAt(w, b)), z);
  };
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 28, 20),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(paint('highlight')), emissive: new THREE.Color(paint('highlight')), emissiveIntensity: 0.65, roughness: 0.28 }),
  );
  scene.add(ball);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.04, 10, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('good')) }),
  );
  const low = toWorld(2, 1);
  ring.position.set(low.x, 0.05, low.z);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  const trail: THREE.Mesh[] = [];
  const dotGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('highlight')) });
  const place = (w: number, b: number) => {
    const p = toWorld(w, b);
    ball.position.set(p.x, p.y + 0.34, p.z);
    const last = trail[trail.length - 1]?.position;
    if (last && last.distanceTo(p) < 0.08) return;
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(p);
    scene.add(dot);
    trail.push(dot);
    if (trail.length > 22) scene.remove(trail.shift()!);
  };
  place(0, 0);
  const center = new THREE.Vector3(0, 0.7, 0);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  let yaw = 0.85, pitch = 0.72, drag = false, lx = 0, ly = 0;
  const look = () => {
    const r = 7.4;
    camera.position.set(center.x + r * Math.cos(pitch) * Math.sin(yaw), center.y + r * Math.sin(pitch), center.z + r * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(center);
  };
  look();
  const resize = () => {
    const w = canvas.clientWidth || 440, h = canvas.clientHeight || 220;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const draw = () => { resize(); renderer.render(scene, camera); };
  draw();
  const onMove = (ev: Event) => {
    const d = (ev as CustomEvent<{ v: number[] }>).detail;
    if (!d?.v || d.v.length < 2) return;
    place(d.v[0] ?? 0, d.v[1] ?? 0);
    draw();
  };
  (host.closest('.st-article') || host).addEventListener('knob-move', onMove);
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; });
  addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw += (e.clientX - lx) * 0.008;
    pitch = Math.min(1.15, Math.max(0.28, pitch + (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
    look(); draw();
  });
  new ResizeObserver(() => draw()).observe(canvas);
}
