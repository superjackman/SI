/* The loss of the two-knob line, drawn as a bowl. The ball follows the knobs on this station. */
import { tx, type L } from '../l4/txt';
import { paint } from '../theme/paint';
import * as THREE from 'three';

const LINE: [number, number][] = [[1, 3], [2, 5], [3, 7]];
const lossAt = (w: number, b: number) => LINE.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / LINE.length;

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (!gl) { host.innerHTML = `<div class="lab-say">${z('罚分是一只碗。这个画面要能转的图形才能看。', 'The penalty is a bowl. This picture needs a turning view.')}</div>`; return; }
  host.innerHTML = `<div class="lab-say">${z('罚分是一只碗。旋钮停在哪，球就在碗的哪一处。自动拧的时候，球顺着碗壁往下滚。拖动可以换个角度看。', 'The penalty is a bowl. Where the knobs sit, the ball sits. When they auto-turn, the ball rolls down the side. Drag to look from another side.')}</div><canvas class="lab-gl"></canvas>`;
  const canvas = host.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paint('card'));
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(6.2, 5.4, 6.2);
  camera.lookAt(1.5, 0.4, 1.5);
  const N = 28;
  const geo = new THREE.PlaneGeometry(6, 6, N - 1, N - 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  let maxL = 1;
  for (let i = 0; i < pos.count; i++) {
    const w = -1 + (i % N) / (N - 1) * 5;
    const b = -1 + Math.floor(i / N) / (N - 1) * 5;
    maxL = Math.max(maxL, lossAt(w, b));
  }
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color(paint('link'));
  const high = new THREE.Color(paint('mark'));
  for (let i = 0; i < pos.count; i++) {
    const w = -1 + (i % N) / (N - 1) * 5;
    const b = -1 + Math.floor(i / N) / (N - 1) * 5;
    const L = lossAt(w, b);
    pos.setZ(i, L / maxL * 2.4);
    const c = low.clone().lerp(high, Math.min(1, L / maxL));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const bowl = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  bowl.rotation.x = -Math.PI / 2;
  scene.add(bowl);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('highlight')) }),
  );
  scene.add(ball);
  const place = (w: number, b: number) => {
    const x = ((w - (-1)) / 5) * 6 - 3;
    const z = ((b - (-1)) / 5) * 6 - 3;
    ball.position.set(x, lossAt(w, b) / maxL * 2.4 + 0.12, z);
  };
  place(0, 0);
  let yaw = 0.6, pitch = 0.9, drag = false, lx = 0, ly = 0;
  const look = () => {
    const r = 9;
    camera.position.set(1.5 + r * Math.cos(pitch) * Math.sin(yaw), 0.6 + r * Math.sin(pitch), 1.5 + r * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(1.5, 0.5, 1.5);
  };
  look();
  const resize = () => {
    const w = canvas.clientWidth || 440, h = canvas.clientHeight || 280;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  resize();
  const draw = () => { resize(); renderer.render(scene, camera); };
  draw();
  const onMove = (ev: Event) => {
    const d = (ev as CustomEvent<{ v: number[] }>).detail;
    if (!d?.v || d.v.length < 2) return;
    place(d.v[0] ?? 0, d.v[1] ?? 0);
    draw();
  };
  const root = host.closest('.st-article') || host;
  root.addEventListener('knob-move', onMove);
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; });
  const up = () => { drag = false; };
  addEventListener('pointerup', up);
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw += (e.clientX - lx) * 0.008;
    pitch = Math.min(1.2, Math.max(0.25, pitch + (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
    look(); draw();
  });
  const ro = new ResizeObserver(() => draw());
  ro.observe(canvas);
}
