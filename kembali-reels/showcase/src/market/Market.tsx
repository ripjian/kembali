import React from "react";
import { AbsoluteFill, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, displayText } from "../common";

// Rec2 Funk 0:00 → 0:28. 129.8 BPM: beat k at 0.72 + 13.872k frames; drop on beat 32.
const b = (k: number) => Math.round(0.72 + 13.872 * k);
const DROP = b(32);
const RISE = [b(44), b(50)];
// Standard end card: the carried mark lands (start + 18) on beat 52; 98 frames of hold.
const END = b(52) - 17; // the measured kick sits ~1 frame after b(52); land on it

// ---------------------------------------------------------------------------
// The market is the Kembali mark, built to the logo's own geometry
// (brand/logo-a-return-loop.svg, 80×80 viewBox, centre 40,40):
//   arc   M64 40 A24 24 0 1 1 57 23   radius 24, stroke 6, round cap at the start
//   arrow 62.7,28.7  60.5,19.5  53.5,26.5
//   dot   r 8
// One logo unit = U world units. Stalls are exact slices of the stroke, so the
// overhead shot at the end is the logo, not an approximation of it.
// ---------------------------------------------------------------------------
const U = 29;
const R = 24 * U; // arc centre-line radius
const HALF = 3 * U; // half the stroke width
const SWEEP = (315 * Math.PI) / 180;
const N = 30;
const GAP = 0; // stalls abut; seams are drawn as a stroke that fades in the overhead shot
const CANOPY_Z = 112;
const ARROW_Z = CANOPY_Z;
const logo = (x: number, y: number): [number, number] => [(x - 40) * U, (y - 40) * U];
const ARROW: [number, number][] = [logo(62.7, 28.7), logo(60.5, 19.5), logo(53.5, 26.5)];
const DOT_R = 8 * U;

const stallSpan = (i: number) => [(i / N) * SWEEP + GAP / 2, ((i + 1) / N) * SWEEP - GAP / 2];
const stallMid = (i: number) => ((i + 0.5) / N) * SWEEP;
const POP0 = b(2);
const POP1 = b(30);
const popAt = (i: number) => POP0 + (i * (POP1 - POP0)) / (N - 1);
const ARROW_POP = b(31);

// projection blending isometric (k = 0) into straight overhead (k = 1)
type Proj = (x: number, y: number, z?: number) => [number, number];
const proj = (k: number): Proj => (x, y, z = 0) => [(1 - k) * 0.866 * (x - y) + k * x, (1 - k) * (0.5 * (x + y) - z) + k * (y - 0.12 * z * (1 - k))];
const J = (p: Proj, list: [number, number, number][]) => list.map(([x, y, z]) => p(x, y, z).join(",")).join(" ");
const lerp = (a: number, c: number, t: number) => a + (c - a) * t;

type XY = [number, number];
const arcPts = (r: number, a0: number, a1: number, n: number): XY[] => Array.from({ length: n + 1 }, (_, q) => {
  const a = a0 + ((a1 - a0) * q) / n;
  return [Math.cos(a) * r, Math.sin(a) * r];
});
const sector = (a0: number, a1: number, r0: number, r1: number): XY[] => [...arcPts(r1, a0, a1, 6), ...arcPts(r0, a1, a0, 6)];
const centroid = (poly: XY[]): XY => [poly.reduce((s, q) => s + q[0], 0) / poly.length, poly.reduce((s, q) => s + q[1], 0) / poly.length];
const shrink = (poly: XY[], k: number): XY[] => {
  const [cx, cy] = centroid(poly);
  return poly.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
};

// an extruded polygon: the faces a viewer at +x+y can see, back to front, then the top
const Prism: React.FC<{ p: Proj; poly: XY[]; z0: number; h: number; side: string; top: string; stroke?: string; strokeOpacity?: number }> = ({ p, poly, z0, h, side, top, stroke, strokeOpacity = 1 }) => {
  const [cx, cy] = centroid(poly);
  const faces = poly
    .map((a, q) => {
      const c2 = poly[(q + 1) % poly.length];
      let nx = c2[1] - a[1];
      let ny = -(c2[0] - a[0]);
      const mx = (a[0] + c2[0]) / 2;
      const my = (a[1] + c2[1]) / 2;
      if (nx * (mx - cx) + ny * (my - cy) < 0) {
        nx = -nx;
        ny = -ny;
      }
      return { a, c2, vis: nx + ny > 0, d: mx + my };
    })
    .filter((fc) => fc.vis)
    .sort((m, n) => m.d - n.d);
  return (
    <g>
      {faces.map((fc, q) => (
        <polygon key={q} points={J(p, [[fc.a[0], fc.a[1], z0], [fc.c2[0], fc.c2[1], z0], [fc.c2[0], fc.c2[1], z0 + h], [fc.a[0], fc.a[1], z0 + h]])} fill={side} />
      ))}
      <polygon points={J(p, poly.map(([x, y]) => [x, y, z0 + h] as [number, number, number]))} fill={top} stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={stroke ? 2.5 : 0} />
    </g>
  );
};

const VALANCE = ["#E0684B", "#2D6CB5", "#7FB069", "#F2C14E", "#6B4B8A", "#E27396", "#2F6B55", "#D98A2B"];

// ---------- lights: a strand hangs just under each canopy edge ----------
type Strand = { pts: [number, number, number][]; normal: XY };
const strandAlong = (path: XY[], z: number, outward: XY): Strand => {
  const pts: [number, number, number][] = [];
  for (let q = 0; q < path.length - 1; q++) {
    const [x0, y0] = path[q];
    const [x1, y1] = path[q + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / 22));
    for (let s = 0; s < n; s++) pts.push([x0 + ((x1 - x0) * s) / n, y0 + ((y1 - y0) * s) / n, 0]);
  }
  pts.push([...path[path.length - 1], 0]);
  // sag between the two end poles
  return { pts: pts.map(([x, y], q) => [x + outward[0] * 4, y + outward[1] * 4, z - 8 - Math.sin((Math.PI * q) / (pts.length - 1)) * 12]), normal: outward };
};
const facing = (n: XY) => n[0] + n[1] > 0;

const lightLevel = (f: number, seed: number) => {
  if (f >= DROP) return 1;
  if (f < b(29)) return 0;
  return rand(seed * 3.1 + Math.floor(f / 3)) > 0.7 ? 0.8 : 0;
};

const Bulbs: React.FC<{ p: Proj; s: Strand; f: number; reveal: number; seed: number; glow?: boolean }> = ({ p, s, f, reveal, seed, glow }) => {
  const on = lightLevel(f, seed);
  const n = Math.floor(s.pts.length * reveal);
  if (n <= 0) return null;
  const shown = s.pts.slice(0, n);
  if (glow) {
    if (on <= 0) return null;
    return (
      <>
        {shown.map(([x, y, z], q) => {
          const [X, Y] = p(x, y, z);
          return <circle key={q} cx={X} cy={Y + 4} r={12} fill={q % 3 === 0 ? "#FFC2AC" : "#FFE3A0"} opacity={on} />;
        })}
      </>
    );
  }
  return (
    <g>
      <polyline points={J(p, shown)} fill="none" stroke="#2A2A2A" strokeWidth={1.6} />
      {shown.map(([x, y, z], q) => {
        const [X, Y] = p(x, y, z);
        return <circle key={q} cx={X} cy={Y + 4} r={4.2} fill={on > 0 ? "#FFF3D1" : "#7A6F5E"} />;
      })}
    </g>
  );
};

// ---------- stalls ----------
type Stall = { canopy: XY[]; counter: XY[]; poles: XY[]; poleBase?: number; vendor: XY; color: string; strands: Strand[]; pop: number; z: number; mid: XY; seed: number };
const STALLS: Stall[] = (() => {
  const out: Stall[] = [];
  for (let i = 0; i < N; i++) {
    const [a0, a1] = stallSpan(i);
    const am = stallMid(i);
    const tx: XY = [-Math.sin(am), Math.cos(am)];
    const rx: XY = [Math.cos(am), Math.sin(am)];
    const cc: XY = [Math.cos(am) * (R + 18), Math.sin(am) * (R + 18)];
    const counter: XY[] = [
      [cc[0] - tx[0] * 46 - rx[0] * 24, cc[1] - tx[1] * 46 - rx[1] * 24],
      [cc[0] + tx[0] * 46 - rx[0] * 24, cc[1] + tx[1] * 46 - rx[1] * 24],
      [cc[0] + tx[0] * 46 + rx[0] * 24, cc[1] + tx[1] * 46 + rx[1] * 24],
      [cc[0] - tx[0] * 46 + rx[0] * 24, cc[1] - tx[1] * 46 + rx[1] * 24],
    ];
    const inset = (0.9 * Math.PI) / 180;
    const poles: XY[] = [
      [Math.cos(a0 + inset) * (R - HALF + 12), Math.sin(a0 + inset) * (R - HALF + 12)],
      [Math.cos(a1 - inset) * (R - HALF + 12), Math.sin(a1 - inset) * (R - HALF + 12)],
      [Math.cos(a0 + inset) * (R + HALF - 12), Math.sin(a0 + inset) * (R + HALF - 12)],
      [Math.cos(a1 - inset) * (R + HALF - 12), Math.sin(a1 - inset) * (R + HALF - 12)],
    ];
    out.push({
      canopy: sector(a0, a1, R - HALF, R + HALF),
      counter,
      poles,
      vendor: [Math.cos(am) * (R + 62), Math.sin(am) * (R + 62)],
      color: VALANCE[i % VALANCE.length],
      strands: [strandAlong(arcPts(R - HALF, a0, a1, 6), CANOPY_Z, [-rx[0], -rx[1]]), strandAlong(arcPts(R + HALF, a0, a1, 6), CANOPY_Z, rx)],
      pop: popAt(i),
      z: CANOPY_Z,
      mid: [Math.cos(am) * R, Math.sin(am) * R],
      seed: i,
    });
  }
  // the round cap where the stroke starts: a parasol stall
  // the stroke travels toward +y from angle 0, so the cap bulges back toward -y
  const cap = arcPts(HALF, Math.PI, Math.PI * 2, 12).map(([x, y]): XY => [R + x, y]);
  out.push({
    canopy: cap,
    counter: shrink(cap, 0.42),
    poles: [centroid(shrink(cap, 0.42))],
    poleBase: 44,
    vendor: [R + 52, -52],
    color: "#9CC7C1",
    strands: [strandAlong(cap, CANOPY_Z, [0, -1])],
    pop: POP0 - 6,
    z: CANOPY_Z,
    mid: [R, -HALF / 2],
    seed: 77,
  });
  // the arrowhead: a triangular stall that overlaps the end of the stroke, like the mark
  out.push({
    canopy: ARROW,
    counter: (() => {
      // a straight counter just inside the base edge (B–C), facing the tip
      const [, B2, Cc] = ARROW;
      const tip = ARROW[0];
      const m: XY = [(B2[0] + Cc[0]) / 2, (B2[1] + Cc[1]) / 2];
      const along: XY = [(Cc[0] - B2[0]) / 2, (Cc[1] - B2[1]) / 2];
      const to: XY = [tip[0] - m[0], tip[1] - m[1]];
      const c: XY = [m[0] + to[0] * 0.3, m[1] + to[1] * 0.3];
      const h: XY = [to[0] * 0.12, to[1] * 0.12];
      const a: XY = [along[0] * 0.5, along[1] * 0.5];
      return [
        [c[0] - a[0] - h[0], c[1] - a[1] - h[1]],
        [c[0] + a[0] - h[0], c[1] + a[1] - h[1]],
        [c[0] + a[0] + h[0], c[1] + a[1] + h[1]],
        [c[0] - a[0] + h[0], c[1] - a[1] + h[1]],
      ] as XY[];
    })(),
    poles: shrink(ARROW, 0.78),
    vendor: (() => {
      const [tip, B2, Cc] = ARROW;
      const m: XY = [(B2[0] + Cc[0]) / 2, (B2[1] + Cc[1]) / 2];
      return [m[0] + (tip[0] - m[0]) * 0.12, m[1] + (tip[1] - m[1]) * 0.12] as XY;
    })(),
    color: VALANCE[N % VALANCE.length],
    strands: [0, 1, 2].map((q) => {
      const a = ARROW[q];
      const c2 = ARROW[(q + 1) % 3];
      const [cx, cy] = centroid(ARROW);
      let n: XY = [c2[1] - a[1], -(c2[0] - a[0])];
      if (n[0] * ((a[0] + c2[0]) / 2 - cx) + n[1] * ((a[1] + c2[1]) / 2 - cy) < 0) n = [-n[0], -n[1]];
      const l = Math.hypot(n[0], n[1]);
      return strandAlong([a, c2], ARROW_Z, [n[0] / l, n[1] / l]);
    }),
    pop: ARROW_POP,
    z: ARROW_Z,
    mid: centroid(ARROW),
    seed: 88,
  });
  return out;
})();

const StallView: React.FC<{ p: Proj; s: Stall; f: number; k: number }> = ({ p, s, f, k }) => {
  const t = f - s.pop;
  if (t < 0) return null;
  // pop-up tent: counter and poles rise, then the canopy unfolds with a bounce
  const rise = tw(t, 0, 7, 0, 1, EO);
  const unfold = tw(t, 5, 14, 0, 1, BACK);
  const reveal = f >= DROP ? 1 : tw(t, 14, 26, 0, 1, EIO);
  const base = s.poleBase ?? 0;
  const poleTop = base + (s.z - base) * rise;
  const canopy = unfold > 0 ? shrink(s.canopy, 0.35 + 0.65 * unfold) : null;
  const fade = 1 - k;
  const front = s.strands.filter((st) => facing(st.normal));
  const back = s.strands.filter((st) => !facing(st.normal));
  return (
    <g>
      <g opacity={fade}>
        {back.map((st, q) => (
          <Bulbs key={`b${q}`} p={p} s={st} f={f} reveal={reveal} seed={s.seed} />
        ))}
      </g>
      <Prism p={p} poly={s.counter} z0={0} h={44 * rise} side="#6B4B32" top="#A57D56" />
      {s.poles.map(([x, y], q) => {
        const [x1, y1] = p(x, y, base);
        const [x2, y2] = p(x, y, poleTop);
        return <line key={q} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2F2F2F" strokeWidth={3} opacity={fade} />;
      })}
      {canopy && <Prism p={p} poly={canopy} z0={s.z} h={10} side={s.color} top="#F6F1E3" stroke={interpolateColors(k, [0, 1], ["#D9CEB8", "#F6F1E3"])} />}
      <g opacity={fade}>
        {front.map((st, q) => (
          <Bulbs key={`f${q}`} p={p} s={st} f={f} reveal={reveal} seed={s.seed} />
        ))}
        {/* glow is drawn here, in depth order, so nearer canopies cover it */}
        <g filter="url(#bulbglow)" style={{ mixBlendMode: "screen" }}>
          {front.map((st, q) => (
            <Bulbs key={`g${q}`} p={p} s={st} f={f} reveal={reveal} seed={s.seed} glow />
          ))}
        </g>
      </g>
    </g>
  );
};

// ---------- people: fixed-speed lanes, so nobody walks through anybody ----------
const LANES = [
  { r: R - HALF - 60, dir: 1, n: 16 },
  { r: R - HALF - 100, dir: -1, n: 14 },
  { r: R + HALF + 60, dir: -1, n: 18 },
  { r: R + HALF + 100, dir: 1, n: 18 },
];
const WALKERS = LANES.flatMap((ln, li) =>
  Array.from({ length: ln.n }, (_, q) => ({ r: ln.r, dir: ln.dir, a0: (q / ln.n) * Math.PI * 2 + rand(li * 50 + q) * 0.06, seed: li * 31 + q * 1.7 })),
);
const SPEED = 0.0011; // radians per frame

const Figure: React.FC<{ p: Proj; k: number; x: number; y: number; f: number; seed: number; alpha?: number; still?: boolean }> = ({ p, k, x, y, f, seed, alpha = 1, still }) => {
  const [X, Y] = p(x, y, 0);
  const sh = ["#E0684B", "#2D6CB5", "#F2C14E", "#7FB069", "#FFFFFF", "#6B4B8A", "#E27396", "#9CC7C1"][Math.floor(rand(seed) * 8)];
  const bob = still ? 0 : Math.abs(Math.sin(f / 3 + seed)) * 3 * (1 - k);
  const sy = 1 - 0.8 * k;
  return (
    <g opacity={alpha} transform={`translate(${X} ${Y}) scale(1 ${sy}) translate(${-X} ${-Y})`}>
      <ellipse cx={X + 5} cy={Y + 2} rx={12} ry={4} fill="#000" opacity={0.25} />
      <rect x={X - 9} y={Y - 50 - bob} width={18} height={50} rx={8} fill={sh} />
      <circle cx={X} cy={Y - 62 - bob} r={9} fill={["#8D5A3B", "#C58C62", "#E3B48E"][Math.floor(rand(seed + 3) * 3)]} />
    </g>
  );
};

// a walker never stands on a stall that hasn't been built yet: lanes clear the ring
const walkerPos = (w: (typeof WALKERS)[number], f: number): XY => {
  const a = w.a0 + w.dir * SPEED * f;
  return [Math.cos(a) * w.r, Math.sin(a) * w.r];
};

// ---------- plaza: the stamp dot ----------
const PLAZA_TABLES: XY[] = Array.from({ length: 7 }, (_, q) => {
  const a = (q / 7) * Math.PI * 2 + 0.3;
  return [Math.cos(a) * 140, Math.sin(a) * 140];
});

const Plaza: React.FC<{ p: Proj; f: number; k: number }> = ({ p, f, k }) => {
  const circle = (r: number): XY[] => arcPts(r, 0, Math.PI * 2, 48).slice(0, 48);
  const on = tw(f, b(4), b(8));
  return (
    <g opacity={on}>
      <Prism p={p} poly={circle(DOT_R)} z0={0} h={10} side="#A93E24" top={C.coral} />
      <polygon points={J(p, circle(DOT_R - 26).map(([x, y]) => [x, y, 10] as [number, number, number]))} fill="none" stroke="#F6F1E3" strokeWidth={3} strokeDasharray="10 10" opacity={0.5 * (1 - k)} />
    </g>
  );
};

// ---------- camera ----------
type CamS = { x: number; y: number; z: number; s: number; k: number; ay: number };
const ringFocus = (deg: number, s: number, z = 60): CamS => ({ x: Math.cos((deg * Math.PI) / 180) * R, y: Math.sin((deg * Math.PI) / 180) * R, z, s, k: 0, ay: 1120 });
const POST: { f: number; c: CamS }[] = [
  { f: DROP - 2, c: ringFocus(300, 1.0) },
  { f: DROP + 8, c: ringFocus(250, 1.7) },
  { f: b(36) - 4, c: ringFocus(250, 1.7) },
  { f: b(36) + 8, c: ringFocus(120, 1.65) },
  { f: b(40) - 4, c: ringFocus(120, 1.65) },
  { f: b(40) + 8, c: ringFocus(40, 1.55) },
  { f: RISE[0] - 4, c: ringFocus(40, 1.55) },
  { f: RISE[0] + 14, c: { x: 0, y: 0, z: 30, s: 0.43, k: 0.1, ay: 960 } },
  { f: RISE[1], c: { x: 0, y: 0, z: 0, s: 0.36, k: 1, ay: 820 } },
  { f: 840, c: { x: 0, y: 0, z: 0, s: 0.35, k: 1, ay: 820 } },
];
const cam = (f: number): CamS => {
  if (f < DROP - 2) {
    // follow the stall being put up right now
    const u = Math.min(1, Math.max(0, (f - POP0) / (POP1 - POP0)));
    const build = tw(f, POP1, DROP - 2, 0, 1, EIO);
    const deg = 6 + u * 309;
    const s = lerp(2.1, 1.3, EIO(u)) * (1 - build) + 1.0 * build;
    return ringFocus(deg, s);
  }
  let i = 0;
  while (i < POST.length - 2 && f >= POST[i + 1].f) i++;
  const a = POST[i].c;
  const c2 = POST[i + 1].c;
  const t = tw(f, POST[i].f, POST[i + 1].f, 0, 1, EIO);
  return { x: lerp(a.x, c2.x, t), y: lerp(a.y, c2.y, t), z: lerp(a.z, c2.z, t), s: Math.exp(lerp(Math.log(a.s), Math.log(c2.s), t)), k: lerp(a.k, c2.k, t), ay: lerp(a.ay, c2.ay, t) };
};

// ---------- world ----------
const World: React.FC<{ f: number; c: CamS }> = ({ f, c }) => {
  const p = proj(c.k);
  const [fx, fy] = p(c.x, c.y, c.z);
  const k = c.k;
  const night = tw(f, 0, DROP, 0, 1);
  type D = { d: number; n: React.ReactNode };
  const items: D[] = [];
  STALLS.forEach((s, q) => items.push({ d: s.mid[0] + s.mid[1], n: <StallView key={`s${q}`} p={p} s={s} f={f} k={k} /> }));
  STALLS.forEach((s, q) => {
    if (f > s.pop + 10) items.push({ d: s.vendor[0] + s.vendor[1] - 1, n: <Figure key={`v${q}`} p={p} k={k} x={s.vendor[0]} y={s.vendor[1]} f={f} seed={q * 9 + 3} alpha={1 - k} still /> });
  });
  WALKERS.forEach((w, q) => {
    const [x, y] = walkerPos(w, f);
    items.push({ d: x + y, n: <Figure key={`w${q}`} p={p} k={k} x={x} y={y} f={f} seed={w.seed} alpha={1 - k} /> });
  });
  PLAZA_TABLES.forEach(([x, y], q) => {
    items.push({
      d: x + y,
      n: (
        <g key={`pt${q}`} opacity={tw(f, b(4), b(8)) * (1 - k)}>
          <Prism p={p} poly={arcPts(20, 0, Math.PI * 2, 12).slice(0, 12).map(([a, c2]): XY => [x + a, y + c2])} z0={10} h={30} side="#9A3A23" top="#C9583E" />
        </g>
      ),
    });
  });
  items.sort((m, n) => m.d - n.d);
  const trees = Array.from({ length: 22 }, (_, q) => {
    const a = (q / 22) * Math.PI * 2;
    const x = Math.cos(a) * 1250;
    const y = Math.sin(a) * 1250;
    const [X, Y] = p(x, y, 0);
    const [TX, TY] = p(x, y, 160);
    return (
      <g key={q}>
        <line x1={X} y1={Y} x2={TX} y2={TY} stroke="#4A3526" strokeWidth={10} opacity={1 - k} />
        <circle cx={TX} cy={TY} r={70} fill={interpolateColors(night, [0, 1], ["#3E6B45", "#1F3A2A"])} opacity={1 - k} />
      </g>
    );
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="bulbglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g transform={`translate(540 ${c.ay}) scale(${c.s}) translate(${-fx} ${-fy})`}>
        <polygon points={J(p, [[-3200, -3200, 0], [3200, -3200, 0], [3200, 3200, 0], [-3200, 3200, 0]])} fill={interpolateColors(night, [0, 1], ["#5E6A62", "#1F2A26"])} />
        {Array.from({ length: 21 }).map((_, q) => (
          <line key={q} x1={p(-1500 + q * 150, -1500)[0]} y1={p(-1500 + q * 150, -1500)[1]} x2={p(-1500 + q * 150, 1500)[0]} y2={p(-1500 + q * 150, 1500)[1]} stroke="#FFFFFF" strokeOpacity={0.05 * (1 - k)} strokeWidth={3} />
        ))}
        <Plaza p={p} f={f} k={k} />
        {items.map((it) => it.n)}
        {trees}
      </g>
    </svg>
  );
};

// stamps pop at stalls in view
const STAMPS = Array.from({ length: 22 }, (_, q) => DROP + Math.round(q * 6.936)).filter((x) => x < b(44));
// each tag lives inside one camera hold so it points at what is on screen
const TAGS = [
  { at: DROP + 12, end: b(36) - 6, text: "Dim sum · Aisyah · visit 5" },
  { at: b(36) + 12, end: b(40) - 6, text: "Bubble tea · free drink ready" },
  { at: b(40) + 12, end: RISE[0] - 6, text: "Grill · a friend joined, both rewarded" },
];

const Overlay: React.FC<{ f: number; c: CamS }> = ({ f, c }) => {
  const p = proj(c.k);
  const [fx, fy] = p(c.x, c.y, c.z);
  const scr = (x: number, y: number, z: number): XY => {
    const [X, Y] = p(x, y, z);
    return [(X - fx) * c.s + 540, (Y - fy) * c.s + c.ay];
  };
  const nodes: React.ReactNode[] = [];
  STAMPS.forEach((at, q) => {
    const t = f - at;
    if (t < 0 || t > 26 || c.k > 0) return;
    // the stalls in view at the moment of the stamp, used in turn so bursts never stack
    const ca = cam(at);
    const pa = proj(ca.k);
    const [ax, ay] = pa(ca.x, ca.y, ca.z);
    const visible = STALLS.slice(0, N)
      .map((s, i) => {
        const [X, Y] = pa(s.mid[0], s.mid[1], CANOPY_Z + 60);
        return { i, x: (X - ax) * ca.s + 540, y: (Y - ay) * ca.s + ca.ay };
      })
      .filter((v) => v.y > 740 && v.y < 1440 && v.x > 90 && v.x < 990)
      .sort((m, n) => m.x - n.x);
    if (!visible.length) return;
    const pick = visible[(q * 3) % visible.length];
    const s = STALLS[pick.i];
    const [x, y] = scr(s.mid[0], s.mid[1], CANOPY_Z + 60);
    const inBand = tw(y, 700, 760) * (1 - tw(y, 1420, 1460)) * tw(x, 40, 90) * (1 - tw(x, 990, 1040));
    if (inBand <= 0) return;
    const pop = tw(t, 0, 8, 1.8, 1, BACK) * (1 - 0.45 * tw(t, 18, 24));
    nodes.push(
      <div key={q} style={{ position: "absolute", left: x - 32, top: y - 32 - t * 1.6, width: 64, height: 64, borderRadius: "50%", background: C.coral, color: "#fff", display: "grid", placeItems: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: 28, scale: `${pop}`, opacity: inBand * (1 - tw(t, 20, 24)), boxShadow: "0 0 30px rgba(224,104,75,0.8), 0 0 0 5px rgba(246,241,227,0.9)" }}>
        +1
      </div>,
    );
  });
  TAGS.forEach((tg, q) => {
    const t = f - tg.at;
    const len = tg.end - tg.at;
    if (t < 0 || t > len) return;
    const inn = tw(t, 0, 10, 0, 1, BACK) * (1 - tw(t, len - 6, len));
    nodes.push(
      <div key={`t${q}`} style={{ position: "absolute", left: 540, top: 1360, translate: "-50% 0", scale: `${inn}`, opacity: inn > 0.01 ? 1 : 0, display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap", padding: "16px 28px", borderRadius: 99, background: C.sand, color: C.ink, fontFamily: FONT.sans, fontWeight: 700, fontSize: 32, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.coral }} />
        {tg.text}
      </div>,
    );
  });
  return <>{nodes}</>;
};

const Headlines: React.FC<{ f: number }> = ({ f }) => {
  const h = interpolate(f, [0, DROP, RISE[0], RISE[1]], [17.75, 19.5, 21.8, 22.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clock = `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
  const L = (a: string, bb: string, inAt: number, outAt: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", ...displayText(84) }}>
      <Line f={f} inAt={inAt} outAt={outAt} dur={10}>
        {a}
      </Line>
      <Line f={f} inAt={inAt + 4} outAt={outAt + 2} dur={10}>
        <span style={{ fontStyle: "italic", fontWeight: 400 }}>{bb}</span>
      </Line>
    </div>
  );
  if (f > RISE[0] + 8) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 614, textAlign: "center", fontFamily: FONT.mono, fontSize: 30, letterSpacing: "0.18em", color: C.sand, textShadow: "0 2px 16px rgba(0,0,0,0.5)", opacity: tw(f, 4, 14) * (1 - tw(f, RISE[0] - 6, RISE[0] + 4)) }}>
        FRI {clock}
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 432 }}>
        {L("Friday, dusk.", "The market sets up.", 8, b(9) - 6)}
        {L("Every stall", "gets its own card.", b(9) + 2, b(24) - 6)}
        {L("Then the lights", "come on.", b(24) + 2, DROP - 5)}
        {L("Stamps at", "every stall.", DROP + 7, b(40) - 6)}
        {L("The same faces,", "every Friday.", b(40) + 8, RISE[0] - 4)}
      </div>
    </>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
// the settle bell lands on a kick with the music at full level: dip it 30 % under the bell (linear ramps)
const bellDuck = (fr: number) => 1 - 0.3 * (tw(fr, RISE[1] - 2, RISE[1], 0, 1, (x) => x) - tw(fr, RISE[1] + 4, RISE[1] + 8, 0, 1, (x) => x));
const SOUND = [
  ...STALLS.map((s) => ({ at: s.pop + 6, src: "sfx/casino/card-place-1.ogg", vol: 0.16 })),
  { at: DROP - 1, src: "sfx/impact/impactMetal_heavy_000.ogg", vol: 0.35 },
  ...STAMPS.map((s) => ({ at: s - 1, src: "sfx/interface/click_003.ogg", vol: 0.3 })),
  ...TAGS.map((t) => ({ at: t.at, src: "sfx/interface/drop_001.ogg", vol: 0.35 })),
  { at: RISE[0], src: "sfx/web/whoosh.wav", vol: 0.4 },
  { at: RISE[1] + 1, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.5 }, // on the kick the rise lands on: the song plays 0.75 f late (mp3 decoder delay), same +1 as END
  ...endSfx(END, true),
];

export const Market: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const c = cam(f);
  const stut = f >= b(29) && f < DROP ? Math.exp(-((f - b(29)) % 13.872) / 3) * 0.05 : 0;
  const hit = f >= DROP && f < DROP + 10 ? 1 - (f - DROP) / 10 : 0;
  const world = <World f={f} c={c} />;
  // the world's saturation boost eases off during the final rise so the built mark sits in
  // true brand coral by the time the standard card picks it up
  const sat = 1.2 - 0.2 * tw(f, RISE[0], RISE[1]);
  return (
    <AbsoluteFill style={{ background: "#0B1411", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: `${1 + stut + hit * 0.08}`, transformOrigin: "50% 52%" }}>
        <AbsoluteFill style={{ filter: `saturate(${sat})` }}>{world}</AbsoluteFill>
        <AbsoluteFill
          style={{
            filter: "blur(8px) saturate(1.2)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 32%, transparent 66%, black 100%)",
            maskImage: "linear-gradient(180deg, black 0%, transparent 32%, transparent 66%, black 100%)",
            opacity: 1 - c.k,
          }}
        >
          {world}
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: interpolateColors(f, [0, b(20), b(29), DROP, DROP + 10], ["#F2A477", "#8B6FA8", "#3D3F78", "#3D3F78", "#4A4A80"]),
            opacity: interpolate(f, [0, b(20), b(29), DROP, DROP + 10], [0.28, 0.4, 0.55, 0.55, 0.26], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - c.k),
            mixBlendMode: "multiply",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#FFE2B0", opacity: hit * 0.5, mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,12,10,0.6) 0%, rgba(6,12,10,0.5) 29%, rgba(6,12,10,0.2) 35%, rgba(6,12,10,0) 41%)", opacity: 1 - c.k }} />
      <AbsoluteFill style={{ scale: `${1 + stut + hit * 0.08}`, transformOrigin: "50% 52%" }}>
        <Overlay f={f} c={c} />
      </AbsoluteFill>
      <Headlines f={f} />
      <Grain f={f} />
      {/* the stalls seen from above (mark 820px at 540, 820, measured at RISE[1]) are carried into the card */}
      <StandardEnd f={f} start={END} from={{ x: 540, y: 820, size: 835, stroke: C.sand }} /* 80·U(29)·scale(0.36) */ />
      <Audio src={staticFile("music/rec2-funk.mp3")} volume={(fr) => bellDuck(fr) * endDuck(fr, END) * interpolate(fr, [0, 2, 790, 836], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, q) => (
        <Sfx key={q} {...s} />
      ))}
    </AbsoluteFill>
  );
};
