import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "./shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import {
  N,
  CX,
  Pt,
  SEED,
  STARS,
  CUP,
  QR,
  DISCS,
  WAFFLE,
  HIST,
  LOGO,
  SEGMENTS,
  HIST_ROWS,
  HIST_BASE,
  histX,
  LOGO_C,
} from "./forms";

// Funk Taka (slowed), 0:13 → 0:30. Measured: the hats and kicks sit on a grid
// of 1/3 s steps = 10.005 frames, phase 0.353 s. Heavy hit at step 0, breakdown
// from ~3.4 s, drop at 5.46 s (frame 164).
export const H = (m: number) => Math.round(10.6 + 10.005 * m);
// Standard end card: the carried mark lands (start + 18) on H(50) = 511; 69 frames of hold.
const END = H(50) - 18;

export const T = {
  bang: H(0),
  cup: H(2),
  cupEnd: H(5),
  qr: H(9),
  qrEnd: H(12),
  scan: [H(11) + 4, H(14)],
  ok: H(14),
  drop: 164,
  discEnd: H(17) + 5,
  full: H(26),
  rain: H(28),
  rainEnd: H(31),
  sort: H(35),
  sortEnd: H(38),
  logo: H(42),
  logoEnd: H(45),
};

type Style = "cut" | "burst" | "swarm" | "explode" | "vortex" | "rain" | "sort";
const KEYS: { at: number; end: number; form: Pt[]; style: Style }[] = [
  { at: 0, end: 1, form: SEED, style: "cut" },
  { at: T.bang, end: T.bang + 14, form: STARS, style: "burst" },
  { at: T.cup, end: T.cupEnd, form: CUP, style: "swarm" },
  { at: T.qr, end: T.qrEnd, form: QR, style: "explode" },
  { at: T.drop, end: T.discEnd, form: DISCS, style: "vortex" },
  { at: T.rain, end: T.rainEnd, form: WAFFLE, style: "rain" },
  { at: T.sort, end: T.sortEnd, form: HIST, style: "sort" },
  { at: T.logo, end: T.logoEnd, form: LOGO, style: "vortex" },
];
export const FILLS = Array.from({ length: 9 }, (_, i) => H(18 + i)); // one stamp per step after the drop
const SCAN = T.scan;

// ---------- per-frame formation animation ----------
const animate = (form: Pt[], p: Pt, f: number, i: number): Pt => {
  if (form === STARS) {
    const k = p.k ?? i;
    return {
      ...p,
      x: p.x + Math.cos(f / 31 + k) * 7,
      y: p.y + Math.sin(f / 25 + k) * 9,
      a: p.a * (0.55 + 0.45 * Math.sin(f / 5 + k * 3)),
    };
  }
  if (form === CUP && (p.g ?? 0) >= 100) {
    const g = (p.g ?? 100) - 100;
    const lift = ((f * 1.6 + g * 20) % 40) - 20;
    return { ...p, x: p.x + Math.sin(p.y / 30 - f / 6 + g * 2) * 18, y: p.y + lift * 0.3, a: p.a * (0.45 + 0.55 * Math.abs(Math.sin(p.y / 50 - f / 9 + g))) };
  }
  if (form === QR) {
    const sy = interpolate(f, SCAN, [700, 1370], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const d = Math.abs(p.y - sy);
    const on = f > SCAN[0] && f < SCAN[1] ? Math.max(0, 1 - d / 60) : 0;
    const passed = f > SCAN[0] && p.y < sy ? 1 : 0;
    const ok = tw(f, T.ok, T.ok + 4) * (1 - tw(f, T.ok + 6, T.drop));
    return { ...p, r: p.r * (1 + on * 0.8 + ok * 0.3), c: on > 0.2 || ok > 0.5 ? C.leaf : p.c, a: Math.min(1, p.a * (passed ? 1 : 0.7) + on) };
  }
  if (form === DISCS) {
    const d = p.g ?? 0;
    const k = p.k ?? 0;
    const ang = (p.ang ?? 0) + f / 55 + d;
    const dc = { x: p.x - Math.cos(p.ang ?? 0) * (p.rad ?? 0), y: p.y - Math.sin(p.ang ?? 0) * (p.rad ?? 0) };
    const at = FILLS[d] + Math.sqrt(k) * 1.3;
    const fill = tw(f, at, at + 4);
    const pop = Math.max(0, 1 - Math.abs(f - at - 2) / 6);
    const full = tw(f, FILLS[8], FILLS[8] + 6, 0, 1) * (1 - tw(f, FILLS[8] + 6, FILLS[8] + 20));
    const rad = (p.rad ?? 0) * (1 + pop * 0.25 + full * 0.35);
    return {
      ...p,
      x: dc.x + Math.cos(ang) * rad,
      y: dc.y + Math.sin(ang) * rad,
      c: fill > 0.5 ? C.coral : C.sand,
      a: 0.24 + fill * 0.76,
      r: p.r * (1 + pop * 0.5),
    };
  }
  if (form === LOGO && p.g === 4) {
    const ang = (p.ang ?? 0) + f / 90;
    return { ...p, x: LOGO_C.x + Math.cos(ang) * 330, y: LOGO_C.y + Math.sin(ang) * 330 };
  }
  if (form === HIST && p.g === 2) {
    return { ...p, r: p.r * (1 + 0.25 * Math.max(0, 1 - Math.abs(((f - T.sortEnd) % 20.01) - 1) / 4)) };
  }
  return p;
};

// ---------- colour lerp ----------
const rgbCache = new Map<string, [number, number, number]>();
const rgb = (h: string) => {
  let v = rgbCache.get(h);
  if (!v) {
    v = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    rgbCache.set(h, v);
  }
  return v;
};
const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const Bc = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (Bc[i] - v) * t)).join(",")})`;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- transition paths ----------
const place = (style: Style, p0: Pt, p1: Pt, t: number, i: number) => {
  const r1 = rand(i + 0.37);
  const r2 = rand(i + 5.11);
  const bump = Math.sin(Math.PI * t);
  let x = lerp(p0.x, p1.x, t);
  let y = lerp(p0.y, p1.y, t);
  let z = 0;
  if (style === "swarm") {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const L = Math.hypot(dx, dy) || 1;
    const off = (r1 - 0.5) * 2 * Math.min(320, L * 0.6);
    x += (-dy / L) * off * bump;
    y += (dx / L) * off * bump;
    z = (r2 - 0.5) * 1100 * bump;
  } else if (style === "explode") {
    const dx = x - CX;
    const dy = y - 1000;
    const L = Math.hypot(dx, dy) || 1;
    const push = (160 + r1 * 380) * bump;
    x += (dx / L) * push;
    y += (dy / L) * push;
    z = -r2 * 700 * bump;
  } else if (style === "vortex") {
    const cy = 1000;
    const a0 = Math.atan2(p0.y - cy, p0.x - CX);
    let a1 = Math.atan2(p1.y - cy, p1.x - CX);
    while (a1 < a0) a1 += Math.PI * 2;
    const R0 = Math.hypot(p0.x - CX, p0.y - cy);
    const R1 = Math.hypot(p1.x - CX, p1.y - cy);
    const a = lerp(a0, a1 + Math.PI * 2, t);
    const R = lerp(R0, R1, t) * (1 - bump * 0.45) + bump * r1 * 60;
    x = CX + Math.cos(a) * R;
    y = cy + Math.sin(a) * R;
    z = (r2 - 0.5) * 500 * bump;
  } else if (style === "rain") {
    if (t < 0.42) {
      const u = t / 0.42;
      x = p0.x;
      y = p0.y + u * u * 1500;
    } else {
      const u = (t - 0.42) / 0.58;
      const fall = BACK(u);
      x = p1.x;
      y = p1.y - (1 - fall) * 1400;
    }
  } else if (style === "sort") {
    const u = Math.min(1, t / 0.5);
    const v = Math.max(0, (t - 0.5) / 0.5);
    x = lerp(p0.x, p1.x, EIO(u));
    y = lerp(p0.y, p1.y, EIO(v));
  }
  return { x, y, z };
};

const delayOf = (style: Style, p1: Pt, i: number) => {
  switch (style) {
    case "swarm":
      return rand(i + 9.3) * 10;
    case "explode":
      return rand(i + 2.2) * 6;
    case "vortex":
      return (Math.hypot(p1.x - CX, p1.y - 1000) / 520) * 10;
    case "rain":
      return ((p1.x - 230) / 620) * 14 + rand(i) * 4;
    case "sort":
      return ((HIST_BASE - p1.y) / 580) * 12;
    case "burst":
      return rand(i) * 3;
    default:
      return 0;
  }
};

const DOTS_BEATS = Array.from({ length: 60 }, (_, k) => H(k));

const Dots: React.FC<{ f: number; chroma: number }> = ({ f, chroma }) => {
  let k = 0;
  for (let j = 0; j < KEYS.length; j++) if (f >= KEYS[j].at) k = j;
  const cur = KEYS[k];
  const prev = KEYS[Math.max(0, k - 1)];
  // the built logo must be still and centred when the end card cuts over it (END)
  const still = tw(f, END - 14, END - 6, 1, 0, (x) => x); // linear: the halo's alpha rides this and must not drop in one frame
  const yaw = Math.sin(f / 70) * 0.16 * still;
  const F = 1500;
  let beat = -99;
  let strong = false;
  DOTS_BEATS.forEach((b, m) => {
    if (b <= f) {
      beat = b;
      strong = m % 2 === 0;
    }
  });
  const pulse = 1 + (strong ? 0.28 : 0.12) * Math.exp(-(f - beat) / 3.5) * still;
  const circles: React.ReactNode[] = [];
  const maxD = cur.style === "rain" ? 18 : cur.style === "sort" ? 12 : 10;
  const span = Math.max(1, cur.end - cur.at - maxD);
  for (let i = 0; i < N; i++) {
    const p1 = animate(cur.form, cur.form[i], f, i);
    let x: number, y: number, z: number, r: number, a: number, c: string;
    const raw = (f - cur.at - delayOf(cur.style, cur.form[i], i)) / span;
    const tl = Math.min(1, Math.max(0, raw));
    if (tl >= 1 || cur.style === "cut") {
      ({ x, y } = p1);
      z = 0;
      r = p1.r;
      a = p1.a;
      c = p1.c.startsWith("#") ? p1.c : p1.c;
    } else {
      const p0 = animate(prev.form, prev.form[i], f, i);
      const t = cur.style === "burst" ? EO(tl) : cur.style === "rain" || cur.style === "sort" ? tl : EIO(tl);
      ({ x, y, z } = place(cur.style, p0, p1, t, i));
      r = lerp(p0.r, p1.r, t);
      a = lerp(p0.a, p1.a, t);
      c = mix(p0.c, p1.c, t);
    }
    // gentle camera yaw + perspective
    const dx = x - CX;
    const xr = dx * Math.cos(yaw);
    const zr = z + dx * Math.sin(yaw);
    const s = F / (F + zr);
    const px = CX + xr * s;
    const py = 1000 + (y - 1000) * s;
    const pr = r * s * pulse;
    // the orbit halo (LOGO g=4, r 330) sits outside the end card's first disc frame: fade it with `still`
    if (cur.form === LOGO && cur.form[i].g === 4) a *= still;
    if (pr < 0.2 || a < 0.02) continue;
    circles.push(<circle key={i} cx={px} cy={py} r={pr} fill={c} opacity={Math.min(1, a)} />);
  }
  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: "absolute",
        inset: 0,
        filter: chroma > 0.01 ? `drop-shadow(${chroma * 14}px 0 0 rgba(224,104,75,0.75)) drop-shadow(${-chroma * 14}px 0 0 rgba(90,200,255,0.55))` : undefined,
      }}
    >
      <defs>
        <filter id="bloom" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feComponentTransfer in="b" result="b2">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#bloom)">{circles}</g>
    </svg>
  );
};

// ---------- kinetic type: each letter blooms in from a hairline weight ----------
const Wave: React.FC<{
  f: number;
  text: string;
  inAt: number;
  outAt?: number;
  size: number;
  accent?: boolean;
  font?: string;
  from?: number;
  to?: number;
}> = ({ f, text, inAt, outAt = 1e9, size, accent, font = FONT.display, from = 100, to = 540 }) => (
  <div style={{ fontFamily: font, fontSize: size, lineHeight: 1.05, letterSpacing: "-0.03em", whiteSpace: "nowrap", textAlign: "center" }}>
    {text.split("").map((ch, j) => {
      const s = inAt + j * 1.1;
      const o = outAt + j * 0.7;
      const op = tw(f, s, s + 7) * (1 - tw(f, o, o + 7, 0, 1, EI));
      const w = tw(f, s, s + 16, from, to, EO) + tw(f, o, o + 7, 0, 300, EI);
      const y = tw(f, s, s + 16, 0.45, 0, EO) + tw(f, o, o + 8, 0, -0.35, EI);
      const bl = tw(f, s, s + 10, 14, 0) + tw(f, o, o + 8, 0, 12);
      return (
        <span
          key={j}
          style={{
            display: "inline-block",
            opacity: op,
            fontVariationSettings: `"wght" ${Math.round(w)}`,
            translate: `0 ${y}em`,
            filter: `blur(${bl}px)`,
            fontStyle: accent ? "italic" : "normal",
            color: accent ? C.coral : C.sand,
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      );
    })}
  </div>
);

const Headline: React.FC<{ f: number }> = ({ f }) => {
  const L = (text: string, inAt: number, outAt: number, accent = false) => (
    <Wave f={f} text={text} inAt={inAt} outAt={outAt} size={112} accent={accent} />
  );
  const slot = (a: React.ReactNode, b: React.ReactNode, key: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {a}
      {b}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 440, height: 240 }}>
      {f < 100 && slot(L("Every visit", 18, 92), L("counts.", 30, 95, true), "a")}
      {f >= 96 && f < 166 && slot(L("One scan", 101, 158), L("at the counter.", 111, 161, true), "b")}
      {f >= 164 && f < 292 && slot(L("Nine visits.", 170, 284), f >= 245 ? L("One free coffee.", FILLS[6], 287, true) : null, "c")}
      {f >= 288 && f < 362 && slot(L("See who", 293, 350), L("comes back.", 303, 353, true), "d")}
      {f >= 356 && f < 432 && slot(L("And when", 363, 420), L("they do.", 373, 423, true), "e")}
    </div>
  );
};

const Mono: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: "0.24em", color: C.mist, textAlign: "center", ...style }}>{children}</div>
);

const Overlays: React.FC<{ f: number }> = ({ f }) => {
  const filled = FILLS.filter((x) => f >= x).length;
  const pill = tw(f, T.ok, T.ok + 8, 0, 1, BACK) * (1 - tw(f, T.drop - 2, T.drop + 3));
  const leg = (i: number) => tw(f, T.rainEnd - 4 + i * 3, T.rainEnd + 8 + i * 3, 0, 1, EO) * (1 - tw(f, T.sort - 6, T.sort));
  return (
    <>
      {/* scan confirmation */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1385, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 30px",
            borderRadius: 99,
            background: C.leaf,
            color: C.pandanDeep,
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: 34,
            scale: `${pill}`,
            opacity: pill > 0.01 ? 1 : 0,
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={C.pandanDeep} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Stamp added
        </div>
      </div>

      {/* card counter */}
      <Mono style={{ position: "absolute", left: 0, right: 0, top: 1392, opacity: tw(f, T.discEnd, T.discEnd + 6) * (1 - tw(f, T.rain - 4, T.rain + 2)) }}>
        {filled >= 9 ? "READY TO REDEEM" : `STAMP ${Math.max(filled, 0)} OF 9`}
      </Mono>

      {/* segment legend */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1350, display: "flex", justifyContent: "center", gap: 44 }}>
        {SEGMENTS.map((s, i) => {
          const pct = Math.round((s.n / N) * 100 * tw(f, T.rainEnd, T.rainEnd + 20, 0, 1, EO));
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14, opacity: leg(i), translate: `0 ${(1 - leg(i)) * 30}px` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.c, opacity: i === 2 ? 0.6 : 1 }} />
              <div style={{ fontFamily: FONT.sans, fontSize: 34, color: C.sand }}>
                <b style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</b> <span style={{ color: C.mist }}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* histogram axis + peak callout */}
      <div style={{ opacity: tw(f, T.sortEnd - 10, T.sortEnd) * (1 - tw(f, T.logo - 4, T.logo + 2)) }}>
        {[0, 4, 8, 12].map((h) => (
          <div key={h} style={{ position: "absolute", left: histX(h) - 60, width: 120, top: HIST_BASE + 26, textAlign: "center", fontFamily: FONT.mono, fontSize: 24, color: C.mist }}>
            {["8am", "12pm", "4pm", "8pm"][h / 4]}
          </div>
        ))}
      </div>
      {(() => {
        const t = tw(f, T.sortEnd, T.sortEnd + 10, 0, 1, BACK) * (1 - tw(f, T.logo - 4, T.logo + 2));
        const top = HIST_BASE - (HIST_ROWS[2] - 1) * 22 - 96;
        return (
          <div
            style={{
              position: "absolute",
              left: histX(2) - 20,
              top,
              padding: "14px 24px",
              borderRadius: 18,
              background: C.coral,
              color: C.white,
              fontFamily: FONT.sans,
              fontWeight: 700,
              fontSize: 34,
              whiteSpace: "nowrap",
              scale: `${t}`,
              transformOrigin: "0% 100%",
              opacity: t > 0.01 ? 1 : 0,
            }}
          >
            10am, your busiest hour
          </div>
        );
      })()}
    </>
  );
};

const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  const full = tw(f, FILLS[8], FILLS[8] + 3) * (1 - tw(f, FILLS[8] + 3, FILLS[8] + 24));
  const bang = tw(f, T.bang, T.bang + 2) * (1 - tw(f, T.bang + 2, T.bang + 16)) + tw(f, T.drop, T.drop + 2) * (1 - tw(f, T.drop + 2, T.drop + 18));
  return (
    <AbsoluteFill style={{ background: "#0A241D" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 1300px at 540px ${980 + Math.sin(f / 60) * 60}px, #154A3B 0%, #0E3329 45%, #081C16 100%)`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 540px 1000px, rgba(224,104,75,${0.45 * full + 0.5 * bang}), rgba(224,104,75,0) 70%)` }} />
      {/* fine horizon lines give the dots a floor to sit over */}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(246,241,227,0.035) 1px, transparent 1px)",
          backgroundSize: "100% 48px",
          backgroundPosition: `0 ${f * 0.8}px`,
          maskImage: "radial-gradient(ellipse 60% 45% at 50% 55%, black, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

const SOUND: { at: number; src: string; vol?: number }[] = [
  { at: T.bang - 1, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.5 },
  { at: T.cup - 3, src: "sfx/web/whoosh.wav", vol: 0.25 },
  { at: T.qr - 3, src: "sfx/web/whip.wav", vol: 0.3 },
  { at: SCAN[0], src: "sfx/ui/switch1.ogg", vol: 0.4 },
  { at: T.ok, src: "sfx/interface/drop_001.ogg", vol: 0.5 },
  { at: T.drop - 3, src: "sfx/web/whoosh.wav", vol: 0.4 },
  ...FILLS.map((x, i) => ({ at: x - 1, src: "sfx/interface/click_003.ogg", vol: 0.3 + i * 0.03 })),
  { at: T.full, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.25 },
  { at: T.rain - 3, src: "sfx/web/whoosh.wav", vol: 0.3 },
  ...Array.from({ length: 8 }).map((_, i) => ({ at: T.sort + i * 3, src: `sfx/keyboard/keypress-00${(i % 3) + 1}.wav`, vol: 0.2 })),
  { at: T.logo - 3, src: "sfx/web/whoosh.wav", vol: 0.35 },
  { at: T.logoEnd - 1, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.3 },
  ...endSfx(END, true),
];

// Big hits get a zoom kick + RGB split; every beat after the drop gets a small kick + shake.
const BIG = [T.bang, T.drop, T.full, T.rain, T.sort, T.logo, T.logoEnd];
const SMALL = [
  ...[2, 4, 6, 8].map(H),
  ...Array.from({ length: 30 }, (_, i) => H(18 + i * 2)).filter((x) => !BIG.includes(x) && x < 500),
];
const hit = (f: number, at: number, len: number) => (f >= at && f < at + len ? Math.exp(-(f - at) / (len / 4)) : 0);

export const Swarm: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  let kickAmt = 0;
  let chroma = 0;
  for (const b of BIG) {
    kickAmt += hit(f, b, 14) * 1;
    chroma += hit(f, b, 8);
  }
  for (const b of SMALL) kickAmt += hit(f, b, 10) * 0.35;
  kickAmt *= tw(f, END - 14, END - 6, 1, 0, (x) => x); // no shake under the end card's hand-off
  // breakdown: the camera creeps in, then the drop snaps it back
  const creep = tw(f, T.qrEnd, T.drop, 0, 0.07, EI) * (f < T.drop ? 1 : 0);
  const scale = 1 + kickAmt * 0.045 + creep;
  const sx = (rand(Math.floor(f) * 3.3) - 0.5) * kickAmt * 22;
  const sy = (rand(Math.floor(f) * 7.7) - 0.5) * kickAmt * 22;
  const flash = hit(f, T.drop, 6) * 0.55 + hit(f, T.bang, 5) * 0.35;
  return (
    <AbsoluteFill style={{ background: "#0A241D", overflow: "hidden" }}>
      <Backdrop f={f} />
      <AbsoluteFill style={{ scale: `${scale}`, translate: `${sx}px ${sy}px`, transformOrigin: "50% 52%" }}>
        <Dots f={f} chroma={Math.min(1, chroma)} />
        <Overlays f={f} />
      </AbsoluteFill>
      <AbsoluteFill style={{ translate: `${sx * 0.4}px ${sy * 0.4}px` }}>
        <Headline f={f} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.sand, opacity: flash, mixBlendMode: "overlay" }} />
      <Grain f={f} />
      {/* the dot-built mark (480px at LOGO_C) is carried into the standard card */}
      <StandardEnd f={f} start={END} from={{ x: LOGO_C.x, y: LOGO_C.y, size: 480, stroke: C.sand }} />
      <Audio
        src={staticFile("music/funk-taka.mp3")}
        trimBefore={13 * 30}
        volume={(fr) => endDuck(fr, END) * interpolate(fr, [0, 2, 505, 596], [0, 0.72, 0.72, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SOUND.map((s, i) => (
        <Sfx key={i} {...s} />
      ))}
    </AbsoluteFill>
  );
};
