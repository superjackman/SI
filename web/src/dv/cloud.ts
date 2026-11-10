/* Words as a labelled cloud. Drag to turn it; until then it turns slowly by itself. */
import { tx, type L } from '../l4/txt';
import { paint } from '../theme/paint';
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

type G = 'animal' | 'royal' | 'travel';
const WORDS: { zh: string; en: string; g: G; at: [number, number, number] }[] = [
  { zh: '猫', en: 'cat', g: 'animal', at: [-1.25, 0.4, 0.1] },
  { zh: '狗', en: 'dog', g: 'animal', at: [-0.95, 0.55, -0.05] },
  { zh: '鱼', en: 'fish', g: 'animal', at: [-1.15, 0.15, 0.4] },
  { zh: '鸟', en: 'bird', g: 'animal', at: [-0.8, 0.28, 0.32] },
  { zh: '马', en: 'horse', g: 'animal', at: [-1.45, 0.32, 0.28] },
  { zh: '国王', en: 'king', g: 'royal', at: [0.15, 0.72, -0.7] },
  { zh: '王后', en: 'queen', g: 'royal', at: [0.42, 0.88, -0.5] },
  { zh: '王子', en: 'prince', g: 'royal', at: [0.02, 0.48, -0.42] },
  { zh: '公主', en: 'princess', g: 'royal', at: [0.48, 0.52, -0.72] },
  { zh: '汽车', en: 'car', g: 'travel', at: [1.2, -0.15, 0.5] },
  { zh: '火车', en: 'train', g: 'travel', at: [1.5, 0.02, 0.28] },
  { zh: '飞机', en: 'plane', g: 'travel', at: [1.05, -0.42, 0.72] },
  { zh: '船', en: 'boat', g: 'travel', at: [1.42, -0.48, 0.42] },
  { zh: '自行车', en: 'bike', g: 'travel', at: [0.95, -0.08, 0.22] },
  { zh: '大象', en: 'elephant', g: 'animal', at: [-1.55, 0.12, -0.05] },
];
const dist = (a: [number, number, number], b: [number, number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function mount(host: HTMLElement, l: L) {
  const z = (a: string, b: string) => tx([a, b], l);
  const say = z('每个字是空间里的一个点。绿是动物，金是王室，蓝是交通。点一个词，看它离谁最近。拖动可以自己转。', 'Each word is a point in space. Green is animals, gold is royalty, blue is travel. Click a word to see its two nearest neighbours. Drag to turn it yourself.');
  const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  const chips = WORDS.map((w, i) => `<span data-i="${i}" data-g="${w.g}">${z(w.zh, w.en)}</span>`).join('');
  if (!gl) { host.innerHTML = `<div class="lab-say">${say}</div><div class="lab-words">${chips}</div>`; return; }
  host.innerHTML = `<div class="lab-say">${say}</div><div class="cloud-stage"><canvas class="lab-gl"></canvas></div><div class="lab-cap" data-cloud-cap>${z('点下面的词。', 'Click a word below.')}</div><div class="lab-words">${chips}</div>`;
  const stage = host.querySelector('.cloud-stage')!;
  const canvas = host.querySelector('canvas')!;
  const cap = host.querySelector('[data-cloud-cap]')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'cloud-overlay';
  stage.appendChild(labels.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paint('card'));
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  const group = new THREE.Group();
  scene.add(group);
  const grid = new THREE.GridHelper(4.2, 8, new THREE.Color(paint('line')), new THREE.Color(paint('line')));
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const m of mats) { m.transparent = true; m.opacity = 0.55; }
  grid.position.y = -0.7;
  group.add(grid);
  const col: Record<G, THREE.Color> = {
    animal: new THREE.Color(paint('good')),
    royal: new THREE.Color(paint('highlight')),
    travel: new THREE.Color(paint('link')),
  };
  const spheres: THREE.Mesh[] = [];
  WORDS.forEach((w) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({ color: col[w.g], roughness: 0.4 }));
    mesh.position.set(...w.at);
    group.add(mesh);
    spheres.push(mesh);
    const el = document.createElement('span');
    el.className = `wlab g-${w.g}`;
    el.textContent = z(w.zh, w.en);
    const tag = new CSS2DObject(el);
    tag.position.set(w.at[0], w.at[1] + 0.2, w.at[2]);
    group.add(tag);
  });
  scene.add(new THREE.AmbientLight(paint('white'), 0.85));
  const sun = new THREE.DirectionalLight(paint('white'), 0.8);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  const links = new THREE.Group();
  group.add(links);
  const clearLinks = () => {
    while (links.children.length) {
      const o = links.children.pop()!;
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    }
  };
  const show = (i: number) => {
    clearLinks();
    spheres.forEach((s, j) => s.scale.setScalar(j === i ? 1.8 : 1));
    host.querySelectorAll<HTMLElement>('.lab-words span').forEach((el, j) => el.classList.toggle('on', j === i));
    const me = WORDS[i]!;
    const near = WORDS.map((w, j) => ({ j, d: j === i ? Infinity : dist(me.at, w.at) })).sort((a, b) => a.d - b.d).slice(0, 2);
    for (const n of near) {
      const a = new THREE.Vector3(...me.at), b = new THREE.Vector3(...WORDS[n.j]!.at);
      const dir = new THREE.Vector3().subVectors(b, a);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, Math.max(0.05, dir.length() - 0.16), 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(paint('navy')) }));
      rod.position.copy(a).add(b).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      links.add(rod);
    }
    const [a, b] = near;
    cap.textContent = z(
      `「${me.zh}」最近的是「${WORDS[a!.j]!.zh}」（${a!.d.toFixed(1)}）和「${WORDS[b!.j]!.zh}」（${b!.d.toFixed(1)}）。`,
      `“${me.en}” is nearest “${WORDS[a!.j]!.en}” (${a!.d.toFixed(1)}) and “${WORDS[b!.j]!.en}” (${b!.d.toFixed(1)}).`,
    );
  };
  let yaw = 0.5, pitch = 0.35, drag = false, user = false, lx = 0, ly = 0;
  const reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  if (reduce) user = true;
  const look = () => {
    const r = 4.1;
    camera.position.set(r * Math.cos(pitch) * Math.sin(yaw), 0.2 + r * Math.sin(pitch), r * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(0, 0.15, 0);
  };
  const resize = () => {
    const w = stage.clientWidth || 440, h = stage.clientHeight || 250;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const draw = () => { resize(); renderer.render(scene, camera); labels.render(scene, camera); };
  look(); draw();
  const loop = () => {
    if (!host.isConnected) return;
    if (!user) yaw += 0.004;
    look(); draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  canvas.addEventListener('pointerdown', (e) => { user = true; drag = true; lx = e.clientX; ly = e.clientY; });
  addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw += (e.clientX - lx) * 0.01;
    pitch = Math.min(1.05, Math.max(-0.2, pitch + (e.clientY - ly) * 0.008));
    lx = e.clientX; ly = e.clientY;
  });
  host.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.lab-words span');
    if (!chip) return;
    show(Number(chip.dataset.i));
  });
}
