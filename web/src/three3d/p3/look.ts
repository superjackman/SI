/* R33 pilot v4: the shared render look of the real 3D scenes (no painted stage anywhere). Filmic tone mapping with sRGB
   output, a procedural image-based light (a small gradient room with three soft boxes, baked through PMREM: no HDR file),
   a warm soft key light with a soft shadow map, a hemisphere fill and a cool rim light, a canvas gradient sky with matching
   fog, glossy toy plastic and real glass (MeshPhysicalMaterial: clearcoat, transmission, thickness, ior), rounded boxes,
   additive glow sprites in place of a bloom pass, and canvas-drawn text. Everything here is lazy (only the scenes load it). */
import {
  ACESFilmicToneMapping, AdditiveBlending, BackSide, BufferAttribute, CanvasTexture, Color, DirectionalLight, Fog, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PCFSoftShadowMap, PlaneGeometry, PMREMGenerator, Scene, SphereGeometry, Sprite,
  SpriteMaterial, SRGBColorSpace, type Material, type Object3D, type Texture, type BufferGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Stage } from '../core';

export interface Look { sky: [string, string, string]; /** the haze: from this far behind the scene centre to this far (added to the camera distance) */ fog?: [number, number]; exposure?: number; shadow?: number; key?: [number, number, number]; env?: [string, string, string] }
/** the device pixel ratio cap of the v4 scenes (glass needs an extra pass, so a phone at 3x draws at 1.75x) */
export const DPR = 1.75;

function envMap(st: Stage, c: [string, string, string]): Texture {
  const s = new Scene(), g = new SphereGeometry(10, 32, 16), p = g.attributes.position!, col = new Float32Array(p.count * 3);
  const top = new Color(c[0]), mid = new Color(c[1]), bot = new Color(c[2]), t = new Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 10;
    if (y > 0) t.copy(mid).lerp(top, y); else t.copy(mid).lerp(bot, -y);
    t.toArray(col, i * 3);
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  s.add(new Mesh(g, new MeshBasicMaterial({ vertexColors: true, side: BackSide })));
  /* three soft boxes: a big one overhead, one front left, a cooler one behind right (they make the highlights) */
  for (const [x, y, z, w, h, k, hex] of [[0, 9, 2, 8, 6, 5, '#ffffff'], [-8, 4, 6, 4, 5, 3.2, '#fff4ea'], [7, 3, -7, 4, 4, 2.4, '#d9d2ff']] as const) {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(k), side: BackSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  }
  const pm = new PMREMGenerator(st.renderer), tex = pm.fromScene(s, 0.035).texture;
  pm.dispose(); s.traverse((o) => { const m = o as Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as Material).dispose(); } });
  return tex;
}
/** a vertical gradient sky (three stops) drawn on a tiny canvas */
export function skyTex(c: [string, string, string]): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const g = cv.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, c[0]); gr.addColorStop(0.55, c[1]); gr.addColorStop(1, c[2]); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; return t;
}
/** set up the v4 look on a stage: call once, right after the stage is made and before anything is drawn */
export function look(st: Stage, o: Look) {
  const r = st.renderer, S = st.scene;
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR));
  r.toneMapping = ACESFilmicToneMapping; r.toneMappingExposure = o.exposure ?? 1.05; r.outputColorSpace = SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = PCFSoftShadowMap;
  /* drop the stage's default lights: the v4 rig replaces them */
  const old: Object3D[] = []; S.traverse((x) => { if ((x as DirectionalLight).isLight) old.push(x); }); old.forEach((x) => x.removeFromParent());
  const env = envMap(st, o.env ?? ['#ffffff', '#efeaff', '#b7a6ee']);
  S.environment = env; S.environmentIntensity = 0.65;
  const sky = skyTex(o.sky); S.background = sky;
  if (o.fog) S.fog = new Fog(o.sky[2], o.fog[0], o.fog[1]);
  const key = new DirectionalLight('#fff3e4', 2.2), [kx, ky, kz] = o.key ?? [4, 9, 6];
  key.position.set(kx, ky, kz); key.castShadow = true;
  const e = o.shadow ?? 5, sc = key.shadow.camera;
  sc.left = sc.bottom = -e; sc.right = sc.top = e; sc.near = 1; sc.far = 30;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.blurSamples = 12; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  const rim = new DirectionalLight('#c7b8ff', 1.6); rim.position.set(-5, 4, -7);
  const fill = new DirectionalLight('#ffe9f3', 0.5); fill.position.set(-6, 2, 5);
  S.add(new HemisphereLight('#ffffff', '#b9a8f0', 0.55), key, key.target, rim, fill);
  return { key, rim, env, sky, free: () => { env.dispose(); sky.dispose(); } };
}
type PO = Partial<{ rough: number; metal: number; coat: number; emissive: string; glow: number; map: Texture | null; opacity: number }>;
/** glossy toy plastic: a clear coat over a soft base (the reference's look) */
export const toy = (color: string, o: PO = {}) => new MeshPhysicalMaterial({
  color, roughness: o.rough ?? 0.42, metalness: o.metal ?? 0, clearcoat: o.coat ?? 0.8, clearcoatRoughness: 0.18,
  emissive: o.emissive ?? '#000000', emissiveIntensity: o.glow ?? 0, map: o.map ?? null,
  transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
});
/** real glass: transmission with thickness and an index of refraction, a clear coat, a faint tint */
export const glassP = (tint = '#f4f1ff', o: Partial<{ rough: number; thick: number; ior: number; att: string; dist: number; glow: string; gi: number }> = {}) => new MeshPhysicalMaterial({
  color: '#ffffff', roughness: o.rough ?? 0.06, metalness: 0, transmission: 1, thickness: o.thick ?? 0.5, ior: o.ior ?? 1.45,
  attenuationColor: new Color(o.att ?? tint), attenuationDistance: o.dist ?? 2.5, clearcoat: 1, clearcoatRoughness: 0.05,
  specularIntensity: 1, envMapIntensity: 1.2, emissive: o.glow ?? '#000000', emissiveIntensity: o.gi ?? 0,
});
/** cast and catch shadows on everything under o (except glass and glow) */
export function shade(o: Object3D, cast = true, take = true) {
  o.traverse((x) => {
    const m = x as Mesh; if (!m.isMesh) return;
    const mt = m.material as MeshPhysicalMaterial;
    if (mt.transmission > 0 || mt.blending === AdditiveBlending || mt.transparent) { m.castShadow = false; return; }
    m.castShadow = cast; m.receiveShadow = take;
  });
  return o;
}
/** a rounded box */
export function rbox(w: number, h: number, d: number, r: number, m: Material, x = 0, y = 0, z = 0, seg = 4): Mesh {
  const o = new Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) - 1e-4), m); o.position.set(x, y, z); return o;
}
let GT: CanvasTexture | null = null;
/** a soft round glow (additive): our stand-in for a bloom pass; size in scene units */
export function glow(color: string, size: number, a = 0.8): Sprite {
  if (!GT || !GT.image) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); GT = new CanvasTexture(c); GT.colorSpace = SRGBColorSpace;
  }
  const s = new Sprite(new SpriteMaterial({ map: GT, color, transparent: true, opacity: a, depthWrite: false, blending: AdditiveBlending, fog: false }));
  s.scale.setScalar(size); s.renderOrder = 8; return s;
}
/** the glow texture is shared: free it with the last scene */
export const freeGlow = () => { GT?.dispose(); GT = null; };
/** draw on a canvas and use it as a texture */
export function canvasTex(w: number, h: number, f: (g: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture {
  const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')!, w, h);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}
/** fit and draw a line of text centred (canvas px) */
export function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, px: number, color: string, weight = 700) {
  let f = px; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  do { g.font = `${weight} ${f}px system-ui,-apple-system,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif`; f -= 2; } while (g.measureText(s).width > maxW && f > 10);
  g.fillText(s, x, y);
}
export type { BufferGeometry };
