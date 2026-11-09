// Every formation the swarm can take. Each is a fixed list of N points sorted
// top-to-bottom, so dot i keeps a coherent place from shape to shape.
import { C } from "../lib";
import { rand } from "../lib";
import { QR_CIRCLES } from "./qr-data";

export const N = 400;
export const CX = 540;

export type Pt = {
  x: number;
  y: number;
  r: number;
  c: string;
  a: number;
  // metadata for animated formations
  g?: number; // group (disc index, column, segment…)
  k?: number; // index within group
  ang?: number;
  rad?: number;
};

const fit = (pts: Pt[]): Pt[] => {
  let out: Pt[];
  if (pts.length >= N) {
    out = Array.from({ length: N }, (_, i) => pts[Math.floor((i * pts.length) / N)]);
  } else {
    out = pts.slice();
    // spare dots hide inside random members of the shape
    for (let i = pts.length; i < N; i++) {
      const p = pts[Math.floor(rand(i * 7.1) * pts.length)];
      out.push({ ...p, r: 0, a: 0 });
    }
  }
  return out.sort((p, q) => p.y - q.y || p.x - q.x);
};

// 0 · a single seed dot
export const SEED: Pt[] = Array.from({ length: N }, () => ({ x: CX, y: 1000, r: 0, c: C.coral, a: 1 }));
SEED[0] = { x: CX, y: 1000, r: 26, c: C.coral, a: 1 };

// 1 · starfield across the whole frame
export const STARS: Pt[] = fit(
  Array.from({ length: N }, (_, i) => ({
    x: 30 + rand(i + 1) * 1020,
    y: 120 + rand(i + 501) * 1700,
    r: 2 + rand(i + 901) * 4.5,
    c: rand(i + 3) > 0.86 ? C.coral : C.sand,
    a: 0.3 + rand(i + 77) * 0.7,
    k: i,
  })),
);

// 2 · coffee cup with steam
export const CUP: Pt[] = (() => {
  const pts: Pt[] = [];
  const S = 21;
  for (let y = 880; y <= 1230; y += S) {
    const hw = 205 - ((y - 880) / 350) * 55;
    for (let x = CX - 260; x <= CX + 260; x += S) {
      const dx = x - CX + (((y - 880) / S) % 2) * (S / 2);
      if (Math.abs(dx) < hw) pts.push({ x: CX + dx, y, r: 7, c: y < 910 ? C.coral : C.sand, a: 1 });
    }
  }
  // handle
  for (let y = 900; y <= 1120; y += 17) {
    for (let x = 740; x <= 880; x += 17) {
      const d = Math.hypot(x - 760, y - 1010);
      if (d > 52 && d < 96 && x > 752) pts.push({ x, y, r: 6, c: C.sand, a: 1 });
    }
  }
  // saucer
  for (let x = CX - 320; x <= CX + 320; x += 19) {
    for (const dy of [0, 17]) {
      const y = 1262 + dy;
      if (((x - CX) / 320) ** 2 + ((dy - 8) / 22) ** 2 <= 1.05) pts.push({ x, y, r: 6, c: C.mist, a: 0.75 });
    }
  }
  // steam (animated: g = strand)
  for (let j = 0; j < 3; j++) {
    for (let y = 700; y <= 850; y += 19) {
      pts.push({ x: 470 + j * 70, y, r: 5, c: C.leaf, a: 0.75, g: 100 + j });
    }
  }
  return fit(pts);
})();

// 3 · the app's real dotted QR
export const QR: Pt[] = (() => {
  const s = 640 / 660;
  const ox = CX - 320;
  const oy = 715;
  const pts: Pt[] = [];
  const finders = [
    [10, 10],
    [530, 10],
    [10, 530],
  ];
  for (const [fx, fy] of finders) {
    // outer rounded square, sampled along its centre line
    const a = fx + 9;
    const b = fx + 121;
    const ay = fy + 9;
    const by = fy + 121;
    const step = (b - a) / 6;
    for (let i = 0; i < 6; i++) {
      pts.push({ x: a + i * step, y: ay, r: 8, c: C.sand, a: 1 });
      pts.push({ x: b, y: ay + i * step, r: 8, c: C.sand, a: 1 });
      pts.push({ x: b - i * step, y: by, r: 8, c: C.sand, a: 1 });
      pts.push({ x: a, y: by - i * step, r: 8, c: C.sand, a: 1 });
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push({ x: fx + 48 + i * 22, y: fy + 48 + j * 22, r: 10, c: C.coral, a: 1 });
  }
  const need = N - pts.length;
  for (let i = 0; i < need; i++) {
    const [x, y] = QR_CIRCLES[Math.floor((i * QR_CIRCLES.length) / need)];
    pts.push({ x, y, r: 7, c: C.sand, a: 1 });
  }
  return fit(pts.map((p) => ({ ...p, x: ox + p.x * s, y: oy + p.y * s })));
})();

// 4 · nine phyllotaxis discs: the stamp card
export const DISC_C = Array.from({ length: 9 }, (_, d) => ({ x: CX + ((d % 3) - 1) * 240, y: 1020 + (Math.floor(d / 3) - 1) * 235 }));
export const DISCS: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let d = 0; d < 9; d++)
    for (let k = 0; k < 44; k++) {
      const rad = 14.6 * Math.sqrt(k + 0.5);
      const ang = k * 2.39996;
      pts.push({ x: DISC_C[d].x + Math.cos(ang) * rad, y: DISC_C[d].y + Math.sin(ang) * rad, r: 6.5, c: C.sand, a: 0.24, g: d, k, ang, rad });
    }
  return fit(pts);
})();

// 5 · customer segments waffle
export const SEGMENTS = [
  { n: 248, c: C.coral, label: "returning" },
  { n: 96, c: C.leaf, label: "new" },
  { n: 56, c: C.mist, label: "lapsed" },
];
export const WAFFLE: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / 20);
    const col = i % 20;
    const seg = i < 248 ? 0 : i < 344 ? 1 : 2;
    pts.push({ x: CX + (col - 9.5) * 30, y: 1000 + (row - 9.5) * 30, r: 10, c: SEGMENTS[seg].c, a: seg === 2 ? 0.45 : 1, g: seg, k: i });
  }
  return fit(pts);
})();

// 6 · busiest hours, 8am → 10pm, two dots per row
export const HOURS = [14, 24, 30, 22, 16, 20, 26, 18, 12, 10, 12, 14, 10, 6, 4];
export const HIST_BASE = 1330;
export const HIST_PITCH = 58;
export const histX = (h: number) => CX - (HOURS.length * HIST_PITCH) / 2 + HIST_PITCH / 2 + h * HIST_PITCH;
export const HIST_ROWS = (() => {
  const sum = HOURS.reduce((a, b) => a + b, 0);
  const rows = HOURS.map((w) => Math.round((w / sum) * (N / 2)));
  rows[rows.length - 1] += N / 2 - rows.reduce((a, b) => a + b, 0);
  return rows;
})();
export const HIST: Pt[] = (() => {
  const pts: Pt[] = [];
  HIST_ROWS.forEach((rows, h) => {
    for (let r = 0; r < rows; r++)
      for (let s = 0; s < 2; s++)
        pts.push({ x: histX(h) + (s - 0.5) * 22, y: HIST_BASE - r * 22, r: 8, c: h === 2 ? C.coral : C.sand, a: h === 2 ? 1 : 0.85, g: h, k: r });
  });
  return fit(pts);
})();

// 7 · the return-loop mark, drawn in dots, with a slow orbit of spares
export const LOGO_C = { x: CX, y: 880 };
export const LOGO: Pt[] = (() => {
  const s = 6;
  const P = (x: number, y: number) => ({ x: LOGO_C.x + (x - 40) * s, y: LOGO_C.y + (y - 40) * s });
  const pts: Pt[] = [];
  for (const rr of [21.8, 24, 26.2]) {
    const len = rr * s * ((315 / 180) * Math.PI);
    const n = Math.floor(len / 13);
    for (let i = 0; i <= n; i++) {
      const t = ((i / n) * 315 * Math.PI) / 180;
      const p = P(40 + Math.cos(t) * rr, 40 + Math.sin(t) * rr);
      pts.push({ ...p, r: 6.5, c: C.sand, a: 1, g: 1, k: i / n });
    }
  }
  // arrowhead
  const A = P(62.7, 28.7), B = P(60.5, 19.5), Cc = P(53.5, 26.5);
  for (let u = 0; u <= 1.001; u += 0.2)
    for (let v = 0; u + v <= 1.001; v += 0.2) {
      pts.push({ x: A.x + (B.x - A.x) * u + (Cc.x - A.x) * v, y: A.y + (B.y - A.y) * u + (Cc.y - A.y) * v, r: 6.5, c: C.sand, a: 1, g: 2 });
    }
  // stamp dot
  for (let k = 0; k < 40; k++) {
    const rad = 7.6 * Math.sqrt(k + 0.5);
    const ang = k * 2.39996;
    pts.push({ x: LOGO_C.x + Math.cos(ang) * rad, y: LOGO_C.y + Math.sin(ang) * rad, r: 5.5, c: C.coral, a: 1, g: 3 });
  }
  const spare = N - pts.length;
  for (let i = 0; i < spare; i++) {
    const ang = (i / spare) * Math.PI * 2;
    pts.push({ x: LOGO_C.x + Math.cos(ang) * 330, y: LOGO_C.y + Math.sin(ang) * 330, r: 2.6, c: i % 9 === 0 ? C.coral : C.leaf, a: 0.55, g: 4, ang, rad: 330 });
  }
  return fit(pts);
})();
