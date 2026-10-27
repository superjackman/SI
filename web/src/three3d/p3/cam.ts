/* R33 pilot v4: a real damped orbit camera. It circles a target (azimuth, elevation) and stands far enough back that a
   ball of radius r around the target fits the screen both ways, times a zoom factor. Drags turn it and pinch / wheel
   zoom it, inside limits; every change eases in (critically damped), and a flight to a thing is the same easing toward
   a new target, angle and radius. */
import { Vector3, type PerspectiveCamera } from 'three';

export interface Lim { az: [number, number]; el: [number, number]; z: [number, number] }
export interface Fly {
  to(look: Vector3, dir: Vector3, r: number, now?: boolean): void; tick(dt: number): void; busy(): boolean;
  /** turn by a drag of dx, dy CSS px */
  turn(dx: number, dy: number): void;
  /** zoom by a factor (> 1 = further away) */
  zoom(f: number): void;
  lim: Lim;
  /** the current orbit (for tests): azimuth, elevation, zoom */
  now(): [number, number, number];
}
const cl = (v: number, [a, b]: [number, number]) => Math.max(a, Math.min(b, v));
export function fly(cam: PerspectiveCamera, lim: Lim = { az: [-0.9, 0.9], el: [0.08, 1.3], z: [0.6, 1.5] }): Fly {
  const L = new Vector3(), tL = new Vector3(), v = new Vector3();
  let az = 0, el = 0.5, R = 4, Z = 1, tA = 0, tE = 0.5, tR = 4, tZ = 1, a0 = 0, e0 = 0.5;
  const dist = (r: number) => {
    const fv = (cam.fov * Math.PI) / 360, fh = Math.atan(Math.tan(fv) * (cam.aspect || 0.6));
    return r / Math.sin(Math.min(fv, fh));
  };
  const put = () => {
    const d = dist(R) * Z;
    v.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    cam.position.copy(L).addScaledVector(v, d); cam.lookAt(L);
  };
  const near = () => L.distanceTo(tL) < 1e-3 && Math.abs(az - tA) < 1e-3 && Math.abs(el - tE) < 1e-3 && Math.abs(R - tR) < 1e-3 && Math.abs(Z - tZ) < 1e-3;
  const F: Fly = {
    lim,
    to(look, dir, r, now = false) {
      const d = dir.clone().normalize();
      tL.copy(look); tR = r; tZ = 1;
      a0 = tA = Math.atan2(d.x, d.z); e0 = tE = Math.asin(cl(d.y, [-1, 1]));
      if (now) { L.copy(tL); az = tA; el = tE; R = tR; Z = tZ; }
      put();
    },
    turn(dx, dy) {
      tA = cl(tA - dx * 0.0065, [a0 + lim.az[0], a0 + lim.az[1]]);
      tE = cl(tE + dy * 0.0045, [Math.max(lim.el[0], e0 - 0.5), Math.min(lim.el[1], e0 + 0.45)]);
    },
    zoom(f) { tZ = cl(tZ * f, lim.z); },
    tick(dt) {
      const k = 1 - Math.exp(-dt * 7.5);
      L.lerp(tL, k); az += (tA - az) * k; el += (tE - el) * k; R += (tR - R) * k; Z += (tZ - Z) * k;
      if (near()) { L.copy(tL); az = tA; el = tE; R = tR; Z = tZ; }
      put(); // also refits after a resize (the aspect may have changed)
    },
    busy: () => !near(),
    now: () => [az, el, Z],
  };
  return F;
}
