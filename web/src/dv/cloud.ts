/* A few words as points in space. Drag to turn the cloud. Loaded only on the word-vector station. */
import { tx, type L } from '../l4/txt';
import { paint } from '../theme/paint';
import * as THREE from 'three';

const WORDS: { zh: string; en: string; at: [number, number, number] }[] = [
  { zh: '猫', en: 'cat', at: [0.2, 0.7, 0.1] },
  { zh: '狗', en: 'dog', at: [0.45, 0.85, 0.25] },
  { zh: '鱼', en: 'fish', at: [-0.2, 0.15, 0.7] },
  { zh: '汽车', en: 'car', at: [1.3, -0.55, -0.4] },
  { zh: '国王', en: 'king', at: [-0.7, 0.9, -0.2] },
  { zh: '王后', en: 'queen', at: [-0.45, 0.72, -0.05] },
];

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const say = z('每个字是空间里的一个点。拖动可以转一转：猫和狗挨得近，汽车离得远。', 'Each word is a point in space. Drag to turn it: cat sits near dog, and the car is far away.');
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (!gl) { host.innerHTML = `<div class="lab-say">${say}</div>`; return; }
  host.innerHTML = `<div class="lab-say">${say}</div><canvas class="lab-gl"></canvas><div class="lab-words">${WORDS.map((w) => `<span>${z(w.zh, w.en)}</span>`).join('')}</div>`;
  const canvas = host.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paint('card'));
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
  const group = new THREE.Group();
  scene.add(group);
  const dot = new THREE.Color(paint('navy'));
  const link = new THREE.Color(paint('link'));
  for (const w of WORDS) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: dot }));
    mesh.position.set(...w.at);
    group.add(mesh);
  }
  const pair = (a: number, b: number) => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...WORDS[a]!.at), new THREE.Vector3(...WORDS[b]!.at)]);
    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: link })));
  };
  pair(0, 1); pair(4, 5);
  let yaw = 0.4, pitch = 0.3, drag = false, lx = 0, ly = 0;
  const look = () => {
    const r = 3.2;
    camera.position.set(r * Math.cos(pitch) * Math.sin(yaw), r * Math.sin(pitch), r * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(0.2, 0.3, 0);
  };
  look();
  const resize = () => {
    const w = canvas.clientWidth || 440, h = canvas.clientHeight || 280;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const draw = () => { resize(); renderer.render(scene, camera); };
  draw();
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; });
  addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw += (e.clientX - lx) * 0.01;
    pitch = Math.min(1.1, Math.max(-0.4, pitch + (e.clientY - ly) * 0.008));
    lx = e.clientX; ly = e.clientY;
    look(); draw();
  });
  new ResizeObserver(() => draw()).observe(canvas);
}
