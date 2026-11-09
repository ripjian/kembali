import React from "react";
import { AbsoluteFill, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, displayText } from "../common";
import { P, SHOPS, SHOP_W, ROW_N, ROW_END, shopCenter, Ground, RowShadow, Shophouse, EndWall, Tree, Lamp, Car, Person } from "./world";

// Que Loucura (instrumental) 0:00 → 0:30. Measured 85 BPM: beat k at 4.32 + 21.17k
// frames. No kick until 11.44 s (beat 16, frame 343): that is dawn; the kick is the rush.
const bt = (k: number) => Math.round(4.32 + 21.17 * k);
const KICK = bt(16);
const NEON = bt(38);
const WORDON = bt(39);
// Standard end card: after the neon sign is fully lit, the lit mark (500px at 540, 860) is
// carried in and lands (start + 18) on bt(41) = 872. The reel runs 55 frames longer than
// before so the card holds 63 frames after it settles.
const END = bt(41) - 16; // the measured downbeat sits ~2 frames after bt(41); land on it
export const STREET_LEN = 955;

// ---------- time of day ----------
const TOD_F = [0, 130, KICK, bt(22), bt(28), bt(34), 800];
const TOD_H = [6.5, 7.75, 10.5, 13.5, 16.5, 19.2, 21.4];
const hours = (f: number) => interpolate(f, TOD_F, TOD_H, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const clock = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;

const SKY_H = [6.5, 8, 12, 16, 18, 19.5, 21];
const SKY_TOP = ["#2B3A67", "#6FA8DC", "#5DA9E9", "#6BA3D6", "#4B4E8C", "#1E2350", "#0A1128"];
const SKY_BOT = ["#F4A57A", "#F8D9B0", "#CFE8F7", "#F3D6A4", "#F39A5B", "#8B4F7A", "#1B2745"];
const TINT_C = ["#E9B0A0", "#FFF1DE", "#FFFFFF", "#FFE2B8", "#F29A6A", "#6A5A9E", "#26315F"];
const TINT_A = [0.5, 0.25, 0, 0.28, 0.5, 0.62, 0.74];
const sky = (h: number) => ({
  top: interpolateColors(h, SKY_H, SKY_TOP),
  bot: interpolateColors(h, SKY_H, SKY_BOT),
  tint: interpolateColors(h, SKY_H, TINT_C),
  tintA: interpolate(h, SKY_H, TINT_A, { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  night: interpolate(h, [18.6, 20.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  shadowLen: interpolate(h, [6.5, 9, 12, 15, 18, 19.5], [260, 150, 50, 130, 280, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  shadowSkew: interpolate(h, [6.5, 12, 18.5], [-300, 0, 340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  shadowA: interpolate(h, [6.5, 7.5, 18.5, 19.8], [0.12, 0.3, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
});

// ---------- camera: one continuous move, jumping shop to shop on the beat in the rush ----------
type Key = { f: number; x: number; y: number; z: number; s: number };
const K: Key[] = [
  { f: 0, x: 330, y: 30, z: 70, s: 2.6 },
  { f: 130, x: 330, y: 30, z: 120, s: 1.95 },
  { f: KICK - 6, x: 470, y: 40, z: 120, s: 1.3 },
  { f: KICK + 8, x: shopCenter(2), y: 20, z: 120, s: 1.75 },
  { f: bt(18) - 6, x: shopCenter(2), y: 20, z: 120, s: 1.75 },
  { f: bt(18) + 8, x: shopCenter(4), y: 20, z: 120, s: 1.75 },
  { f: bt(20) - 6, x: shopCenter(4), y: 20, z: 120, s: 1.75 },
  { f: bt(20) + 8, x: shopCenter(0), y: 20, z: 120, s: 1.65 },
  { f: bt(22) - 8, x: shopCenter(0), y: 20, z: 120, s: 1.65 },
  { f: bt(22) + 8, x: 560, y: 60, z: 100, s: 1.05 },
  { f: bt(28), x: 780, y: 60, z: 100, s: 1.1 },
  { f: bt(29) + 6, x: 660, y: 150, z: 60, s: 0.86 },
  { f: bt(34), x: 700, y: 150, z: 60, s: 0.88 },
  { f: bt(35) + 10, x: 330, y: 20, z: 60, s: 1.9 },
  { f: 796, x: 330, y: 0, z: 45, s: 9 },
];
const cam = (f: number) => {
  let i = 0;
  while (i < K.length - 2 && f >= K[i + 1].f) i++;
  const a = K[i];
  const b = K[i + 1];
  const last = i === K.length - 2;
  const t = tw(f, a.f, b.f, 0, 1, last ? EI : EIO);
  const [ax, ay] = P(a.x, a.y, a.z);
  const [bx, by] = P(b.x, b.y, b.z);
  // scale interpolated in log space so zooms feel even
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, s };
};
const toScreen = (c: { x: number; y: number; s: number }, X: number, Y: number): [number, number] => [(X - c.x) * c.s + 540, (Y - c.y) * c.s + 1000];

// ---------- stamps ----------
type Ev = { f: number; shop: number; tag?: string };
const EVENTS: Ev[] = [
  { f: bt(10), shop: 1, tag: "Ming Wei · first stamp" },
  { f: bt(14), shop: 1 },
  ...[16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5].map((k, j) => ({ f: bt(k), shop: [1, 2, 3, 2, 4, 5, 4, 3, 0, 1, 0, 2][j] })),
  { f: bt(23), shop: 2, tag: "Referral · both get a reward" },
  { f: bt(24), shop: 1 },
  { f: bt(26), shop: 3 },
  { f: bt(27), shop: 1 },
  { f: bt(29), shop: 1, tag: "Aisyah · 9th visit · free coffee" },
  { f: bt(30), shop: 4 },
  { f: bt(31), shop: 5 },
  { f: bt(32), shop: 1, tag: "Priya · welcome back" },
  { f: bt(33), shop: 2 },
];

// ---------- people ----------
const WALKERS = Array.from({ length: 44 }, (_, i) => {
  const lane = rand(i + 1) > 0.45 ? 38 + rand(i) * 20 : 350 + rand(i + 2) * 30;
  const dir = rand(i + 3) > 0.5 ? 1 : -1;
  return { lane, dir, sp: 1.4 + rand(i + 4) * 1.2, st: -200 + rand(i + 5) * 1000, seed: i * 1.7 };
});
const density = (h: number) => interpolate(h, [6.5, 8, 11, 14, 17, 19, 21], [0.15, 0.35, 1, 0.8, 0.7, 0.45, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const People: React.FC<{ f: number; far: boolean }> = ({ f, far }) => {
  const nodes: { d: number; n: React.ReactNode }[] = [];
  WALKERS.forEach((w, i) => {
    if ((w.lane > 200) !== far) return;
    if (rand(i + 11) > density(hours(Math.max(0, w.st + 300)))) return;
    const span = 2200;
    const x0 = w.dir > 0 ? -500 : ROW_END + 500;
    const x = x0 + w.dir * (((f - w.st) * w.sp) % span + span) % span;
    nodes.push({ d: x + w.lane, n: <Person key={`w${i}`} x={x} y={w.lane} f={f} seed={w.seed} /> });
  });
  // customers walking into shops right before their stamp
  if (!far)
    EVENTS.forEach((e, i) => {
      const t = f - (e.f - 34);
      if (t < 0 || t > 40) return;
      const from = rand(i + 21) > 0.5 ? 1 : -1;
      const door = shopCenter(e.shop);
      const walk = Math.min(1, t / 26);
      const x = door + from * 140 * (1 - walk);
      const y = t < 26 ? 46 : 46 - (t - 26) * 4;
      nodes.push({ d: x + y, n: <Person key={`c${i}`} x={x} y={y} f={f} seed={i * 3.3 + 50} alpha={t < 26 ? Math.min(1, t / 4) : 1 - (t - 26) / 14} /> });
    });
  nodes.sort((a, b) => a.d - b.d);
  return <>{nodes.map((n) => n.n)}</>;
};

const CARS = [
  { lane: 120, dir: 1, sp: 7, off: 0, color: "#E0684B" },
  { lane: 230, dir: -1, sp: 6, off: 600, color: "#F6F1E3" },
  { lane: 120, dir: 1, sp: 8, off: 1300, color: "#2D6CB5" },
  { lane: 230, dir: -1, sp: 7, off: 200, color: "#3F5B2E" },
];

// ---------- world ----------
const World: React.FC<{ f: number }> = ({ f }) => {
  const h = hours(f);
  const sk = sky(h);
  const c = cam(f);
  const open = (i: number) => tw(f, 34 + i * 9, 80 + i * 9, 0, 1, EIO) * (1 - tw(h, 20.6, 21.2));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(540 1000) scale(${c.s}) translate(${-c.x} ${-c.y})`}>
        <Ground night={sk.night} />
        <RowShadow len={sk.shadowLen} skew={sk.shadowSkew} alpha={sk.shadowA} />
        <EndWall />
        {Array.from({ length: ROW_N }).map((_, i) => (
          <Shophouse key={i} i={i} open={open(i)} glow={sk.night} f={f} />
        ))}
        <People f={f} far={false} />
        {[0, 440, 880, 1320].map((x) => (
          <Lamp key={x} x={x} y={92} />
        ))}
        {CARS.map((car, i) => {
          const span = 3600;
          const x = car.dir > 0 ? -1200 + ((f * car.sp + car.off) % span) : ROW_END + 1200 - ((f * car.sp + car.off) % span);
          return <Car key={i} x={x} y={car.lane} color={car.color} night={sk.night} />;
        })}
        <People f={f} far />
        {[-100, 300, 700, 1100, 1500].map((x) => (
          <Tree key={x} x={x} y={420} night={sk.night} />
        ))}
      </g>
    </svg>
  );
};

// light sources that must stay bright over the dusk tint
const Emissive: React.FC<{ f: number }> = ({ f }) => {
  const h = hours(f);
  const n = sky(h).night;
  if (n <= 0) return null;
  const c = cam(f);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      <defs>
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <g transform={`translate(540 1000) scale(${c.s}) translate(${-c.x} ${-c.y})`} opacity={n}>
        {Array.from({ length: ROW_N }).map((_, i) => {
          const [e, fy] = P(i * SHOP_W, 0, 0);
          return (
            <g key={i} transform={`matrix(0.866 0.5 0 1 ${e} ${fy})`} filter="url(#glow)">
              {[34, 92, 150].map((u) => (
                <rect key={u} x={u} y={-236} width={36} height={70} fill="#FFB85C" opacity={0.75} />
              ))}
              <rect x={30} y={-90} width={160} height={90} fill="#FFC77A" opacity={0.8} />
            </g>
          );
        })}
        {[0, 440, 880, 1320].map((x) => {
          const [X, Y] = P(x, 92);
          return (
            <g key={x}>
              <circle cx={X + 35} cy={Y - 178} r={18} fill="#FFF1C9" filter="url(#glow)" />
              <ellipse cx={X + 60} cy={Y + 10} rx={110} ry={50} fill="#FFD98A" opacity={0.35} filter="url(#glow)" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// the counters floating over each shop, in screen space so they stay readable at any zoom
const Orbs: React.FC<{ f: number }> = ({ f }) => {
  const c = cam(f);
  if (f > 790) return null;
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < ROW_N; i++) {
    const evs = EVENTS.filter((e) => e.shop === i && f >= e.f);
    if (!evs.length) continue;
    const last = evs[evs.length - 1];
    const [X, Y] = P(shopCenter(i), 0, 300);
    const [sx, sy] = toScreen(c, X, Y);
    const pop = tw(f, last.f, last.f + 10, 1.7, 1, BACK);
    const plus = tw(f, last.f, last.f + 22);
    const r = 26 + Math.min(1.4, c.s) * 6;
    const clear = tw(sy, 660, 740);
    if (clear <= 0) continue;
    nodes.push(
      <div key={i} style={{ position: "absolute", left: sx - r, top: sy - r + Math.sin(f / 12 + i) * 4, opacity: clear }}>
        <div
          style={{
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: C.coral,
            boxShadow: `0 0 ${30 * pop}px rgba(224,104,75,0.8), 0 0 0 5px rgba(246,241,227,0.9)`,
            display: "grid",
            placeItems: "center",
            color: C.white,
            fontFamily: FONT.sans,
            fontWeight: 800,
            fontSize: r * 0.85,
            scale: `${pop}`,
          }}
        >
          {evs.length}
        </div>
        {plus < 1 && (
          <div style={{ position: "absolute", left: r * 2 + 6, top: -10 - plus * 40, opacity: 1 - plus, fontFamily: FONT.sans, fontWeight: 800, fontSize: 30, color: C.sand, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            +1
          </div>
        )}
      </div>,
    );
  }
  // tags
  EVENTS.filter((e) => e.tag).forEach((e, k) => {
    const t = f - e.f;
    if (t < 0 || t > 48) return;
    const [X, Y] = P(shopCenter(e.shop), 0, 330);
    const [sx, sy] = toScreen(c, X, Y);
    const inn = tw(t, 2, 12, 0, 1, BACK);
    const out = tw(t, 40, 48);
    nodes.push(
      <div
        key={`t${k}`}
        style={{
          position: "absolute",
          left: Math.min(1030, Math.max(50, sx)),
          top: Math.max(730, sy - 110) - t * 0.6,
          translate: "-50% 0",
          scale: `${inn}`,
          opacity: 1 - out,
          display: "flex",
          alignItems: "center",
          gap: 12,
          whiteSpace: "nowrap",
          padding: "14px 24px",
          borderRadius: 99,
          background: C.sand,
          color: C.ink,
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 30,
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.coral }} />
        {e.tag}
      </div>,
    );
  });
  // referral: a dashed arc from the café to the bakery
  const ref = tw(f, bt(22) + 10, bt(23), 0, 1, EIO) * (1 - tw(f, bt(24), bt(24) + 10));
  if (ref > 0) {
    const [aX, aY] = toScreen(c, ...P(shopCenter(1), 0, 330));
    const [bX, bY] = toScreen(c, ...P(shopCenter(2), 0, 330));
    const mx = (aX + bX) / 2;
    const my = Math.min(aY, bY) - 160;
    nodes.push(
      <svg key="ref" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M${aX} ${aY} Q ${mx} ${my} ${bX} ${bY}`} fill="none" stroke={C.sand} strokeWidth={5} strokeDasharray="10 12" pathLength={1000} strokeDashoffset={0} opacity={0.9} clipPath={undefined} style={{ strokeDasharray: `${ref * 1000} 1000` }} />
      </svg>,
    );
  }
  return <>{nodes}</>;
};

const Headlines: React.FC<{ f: number }> = ({ f }) => {
  const h = hours(f);
  const L = (a: string, b: string, inAt: number, outAt: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", ...displayText(90), textShadow: "0 4px 30px rgba(0,0,0,0.35)" }}>
      <Line f={f} inAt={inAt} outAt={outAt}>
        {a}
      </Line>
      {b && (
        <Line f={f} inAt={inAt + 5} outAt={outAt + 2}>
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>{b}</span>
        </Line>
      )}
    </div>
  );
  if (f > 800) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center", fontFamily: FONT.mono, fontSize: 40, letterSpacing: "0.18em", color: C.sand, textShadow: "0 2px 16px rgba(0,0,0,0.4)", opacity: tw(f, 4, 14) * (1 - tw(f, 780, 792)) }}>
        {clock(h)}
      </div>
      <div style={{ position: "absolute", left: 50, right: 50, top: 492 }}>
        {L("Shutters up", "on the row.", 22, bt(6) - 4)}
        {L("First regular.", "First stamp.", bt(6) + 4, KICK - 10)}
        {L("Three seconds", "a stamp.", KICK + 2, bt(22) - 10)}
        {L("A friend brings", "a friend.", bt(22) + 2, bt(28) - 10)}
        {L("The same faces,", "every week.", bt(28) + 2, bt(34) - 10)}
        {L("Every visit,", "remembered.", bt(34) + 2, 782)}
      </div>
    </>
  );
};

// ---------- the end: through the café window to a neon sign ----------
const NEON_DROPS = [2, 3, 6, 11];
const neonOn = (f: number, at: number) => f >= at && !NEON_DROPS.includes(f - at);

const NeonEnd: React.FC<{ f: number }> = ({ f }) => {
  if (f < 796) return null;
  const mark = neonOn(f, NEON);
  const word = neonOn(f, WORDON);
  const R = 150;
  const s = R / 24;
  const Pm = (x: number, y: number) => `${540 + (x - 40) * s},${860 + (y - 40) * s}`;
  const tube = "#FFF4E2";
  return (
    <AbsoluteFill style={{ background: "#140F0D" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(#0E0A08 3px, transparent 3px), linear-gradient(90deg, #0E0A08 3px, transparent 3px)",
          backgroundSize: "120px 56px, 120px 112px",
          backgroundPosition: "0 0, 60px 56px",
          opacity: 0.7,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(700px 700px at 540px 900px, rgba(255,200,150,${mark ? 0.22 : 0.04}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(500px 360px at 540px 1170px, rgba(224,104,75,${word ? 0.14 : 0}), transparent 70%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6} result="a" />
            <feGaussianBlur stdDeviation={22} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="a" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* unlit tube, always faintly visible */}
        <g opacity={mark ? 1 : 0.18} filter={mark ? "url(#neon)" : undefined}>
          <path d={`M${Pm(64, 40)} A ${R} ${R} 0 1 1 ${Pm(57, 23)}`} fill="none" stroke={tube} strokeWidth={14} strokeLinecap="round" />
          <polygon points={`${Pm(62.7, 28.7)} ${Pm(60.5, 19.5)} ${Pm(53.5, 26.5)}`} fill="none" stroke={tube} strokeWidth={10} strokeLinejoin="round" />
          <circle cx={540} cy={860} r={8 * s - 8} fill="none" stroke={C.coral} strokeWidth={14} />
          <circle cx={540} cy={860} r={8 * s - 26} fill={C.coral} opacity={0.5} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1110,
          textAlign: "center",
          fontFamily: FONT.sans,
          fontWeight: 500,
          fontSize: 176,
          letterSpacing: "-0.04em",
          color: word ? tube : "rgba(255,244,226,0.14)",
          textShadow: word ? "0 0 8px #FFE9C9, 0 0 24px rgba(255,190,140,0.9), 0 0 60px rgba(224,104,75,0.7)" : "none",
        }}
      >
        kembal<span style={{ color: word ? "#FFB29A" : "rgba(224,104,75,0.2)" }}>i</span>
      </div>
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
// the switch clicks land on beats: the music dips 30 % under each (linear ramps), as Town does under its stamps
const CLICKS = [0, 4, 7, 12].flatMap((d) => [NEON + d, WORDON + d]);
const clickDuck = (fr: number) => 1 - 0.3 * CLICKS.reduce((m, s) => Math.max(m, tw(fr, s - 3, s - 1, 0, 1, (x) => x) - tw(fr, s + 3, s + 7, 0, 1, (x) => x)), 0);
const SOUND = [
  ...EVENTS.map((e) => ({ at: e.f - 1, src: "sfx/interface/click_003.ogg", vol: 0.35 })),
  ...EVENTS.filter((e) => e.tag).map((e) => ({ at: e.f + 2, src: "sfx/interface/drop_001.ogg", vol: 0.35 })),
  { at: 766, src: "sfx/web/whoosh.wav", vol: 0.3 }, // levels trimmed: these stacked on music peaks and clipped
  // *-trim.wav = the switch files with their 1.35 / 1.57-frame lead-in silence cut, so the click starts on the light's frame
  ...[0, 4, 7, 12].map((d) => ({ at: NEON + d, src: "sfx/ui/switch2-trim.wav", vol: 0.7 })),
  ...[0, 4, 7, 12].map((d) => ({ at: WORDON + d, src: "sfx/ui/switch3-trim.wav", vol: 0.35 })),
  ...endSfx(END, true),
];

export const Street: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const h = hours(f);
  const sk = sky(h);
  const warm = tw(f, 786, 797) * (1 - tw(f, 799, 812));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${sk.top} 0%, ${sk.bot} 55%)` }} />
      {/* stars at night */}
      <AbsoluteFill style={{ opacity: sk.night }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: rand(i) * 1080, top: rand(i + 60) * 700, width: 3, height: 3, borderRadius: "50%", background: "#FFF", opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i)) }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ filter: "saturate(1.25) contrast(1.04)" }}>
        <World f={f} />
      </AbsoluteFill>
      {/* tilt-shift: a blurred copy of the world, masked to the top and bottom bands */}
      <AbsoluteFill
        style={{
          filter: "blur(9px) saturate(1.25) contrast(1.04)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 32%, transparent 66%, black 100%)",
          maskImage: "linear-gradient(180deg, black 0%, transparent 32%, transparent 66%, black 100%)",
        }}
      >
        <World f={f} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: sk.tint, opacity: sk.tintA, mixBlendMode: "multiply" }} />
      <Emissive f={f} />
      {/* tilt-shift: blur the top and bottom of the frame */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 45%)" }} />
      <Orbs f={f} />
      <Headlines f={f} />
      <AbsoluteFill style={{ background: "#FFD9A0", opacity: warm }} />
      <NeonEnd f={f} />
      <Grain f={f} />
      <StandardEnd f={f} start={END} from={{ x: 540, y: 860, size: (150 / 24) * 80, stroke: "#FFF4E2" }} />
      <Audio src={staticFile("music/que-loucura.mp3")} volume={(fr) => clickDuck(fr) * endDuck(fr, END) * interpolate(fr, [0, 2, STREET_LEN - 50, STREET_LEN - 4], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};
