import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, displayText } from "../common";
import { P, planeZ, Box, makeCam, camTransform, toScreen, Cam, CamKey } from "../iso/kit";
import { BIZ, PLOT, PlotView, CUSTOMER, Biz, WALL_H } from "./plots";

// Dive 0:00 → 0:40. 72.6 BPM: beat k at 3.4 + 24.8k frames. Soft intro to ~10 s,
// the groove arrives around beat 12–16. One business every three beats from beat 16.
const bt = (k: number) => Math.round(3.4 + 24.8 * k);
const DIVE = [bt(12), bt(16)];
const ARRIVE = BIZ.map((_, k) => bt(16 + 3 * k));
const STAMP = BIZ.map((_, k) => bt(17 + 3 * k));
const FINALE = bt(43);
const END = 1200;
// Standard end card: after the nine stamps have popped over the town (last lands 1136), the
// stamped town holds 34 frames, then the card grows in; its dot pops on bt(48) = 1194. The
// reel runs 75 frames longer than before so the card holds 67 frames after it settles.
const CARD = bt(48) - 24;
export const TOWN_LEN = 1275;

const G = 440; // plot pitch; roads run in the 140-unit gaps
const GRID: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 1],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
];
const origin = (k: number): [number, number] => [GRID[k][1] * G, GRID[k][0] * G];
const RISE = BIZ.map((_, k) => k * 28);
const TOWN = { x: G + PLOT / 2, y: G + PLOT / 2 };

const keys: CamKey[] = [
  { f: 0, x: TOWN.x, y: TOWN.y, z: 0, s: 0.48, ay: 1030 },
  { f: DIVE[0], x: TOWN.x, y: TOWN.y, z: 0, s: 0.52, ay: 1030 },
];
BIZ.forEach((_, k) => {
  const [ox, oy] = origin(k);
  const c = { x: ox + 150, y: oy + 150, z: 70, s: 1.7, ay: 1040 };
  if (k > 0) keys.push({ f: ARRIVE[k] - 20, ...origin2(k - 1) });
  keys.push({ f: ARRIVE[k], ...c });
});
function origin2(k: number) {
  const [ox, oy] = origin(k);
  return { x: ox + 150, y: oy + 150, z: 70, s: 1.7, ay: 1040 };
}
keys.push({ f: FINALE - 10, ...origin2(8) });
keys.push({ f: FINALE + 26, x: TOWN.x, y: TOWN.y, z: 40, s: 0.4, ay: 900 });
keys.push({ f: END, x: TOWN.x, y: TOWN.y, z: 40, s: 0.39, ay: 900 });
const cam = makeCam(keys);

// ---------- world ----------
// how far plot k's walls drop: only plots standing in front of the one in focus
const inFront = (k: number, j: number) => k !== j && GRID[k][0] >= GRID[j][0] && GRID[k][1] >= GRID[j][1];
const wallHeight = (k: number, f: number) => {
  let low = 0;
  BIZ.forEach((_, j) => {
    if (!inFront(k, j)) return;
    const a = ARRIVE[j];
    const e = (ARRIVE[j + 1] ?? FINALE) - 6;
    low = Math.max(low, tw(f, a - 14, a, 0, 1, EIO) * (1 - tw(f, e, e + 14, 0, 1, EIO)));
  });
  return WALL_H - low * (WALL_H - 34);
};
const Roads: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <g transform={planeZ(-20)}>
      <rect x={-260} y={-260} width={3 * G + 380} height={3 * G + 380} fill="#3C4144" />
      {[0, 1].map((i) => (
        <g key={i}>
          {Array.from({ length: 16 }).map((_, j) => (
            <rect key={`h${j}`} x={-200 + j * 90} y={i * G + PLOT + 68} width={44} height={5} fill="#E8E2D2" opacity={0.7} />
          ))}
          {Array.from({ length: 16 }).map((_, j) => (
            <rect key={`v${j}`} x={i * G + PLOT + 68} y={-200 + j * 90} width={5} height={44} fill="#E8E2D2" opacity={0.7} />
          ))}
        </g>
      ))}
    </g>
    {f < 0 && null}
  </g>
);

type D = { d: number; n: React.ReactNode };

const Car: React.FC<{ x: number; y: number; along: "x" | "y"; color: string }> = ({ x, y, along, color }) =>
  along === "x" ? (
    <g>
      <Box x={x} y={y} z={-20} dx={80} dy={44} dz={24} color={color} />
      <Box x={x + 16} y={y + 4} z={4} dx={44} dy={36} dz={18} color="#DCE6EA" />
    </g>
  ) : (
    <g>
      <Box x={x} y={y} z={-20} dx={44} dy={80} dz={24} color={color} />
      <Box x={x + 4} y={y + 16} z={4} dx={36} dy={44} dz={18} color="#DCE6EA" />
    </g>
  );

const World: React.FC<{ f: number }> = ({ f }) => {
  const items: D[] = [];
  BIZ.forEach((b, k) => {
    const [ox, oy] = origin(k);
    const t = f - RISE[k];
    if (t < 0) return;
    const up = tw(t, 0, 22, 0, 1, BACK);
    items.push({
      d: ox + oy + PLOT,
      n: (
        <g key={b.key} transform={`translate(0 ${(1 - up) * 260})`} opacity={Math.min(1, t / 6)}>
          <PlotView ox={ox} oy={oy} f={f} b={b} wallH={wallHeight(k, f)} scan={tw(f, STAMP[k] - 14, STAMP[k] - 6) * (1 - tw(f, STAMP[k] + 10, STAMP[k] + 18))} />
        </g>
      ),
    });
  });
  // one car per street, both running along x so they never meet at a crossing; fade at the ends
  const span = 3 * G + 520;
  [0, 1].forEach((i) => {
    const u = ((f * 6 + i * 900) % span) / span;
    const xr = -260 + u * span - 40;
    const a = Math.min(1, u / 0.08, (1 - u) / 0.08);
    items.push({
      d: xr + i * G + PLOT + 40 + 40,
      n: (
        <g key={`cx${i}`} opacity={a}>
          <Car x={xr} y={i * G + PLOT + (i ? 76 : 18)} along="x" color={i ? "#F2C14E" : "#2D6CB5"} />
        </g>
      ),
    });
  });
  items.sort((a, b) => a.d - b.d);
  return (
    <g>
      <Roads f={f} />
      {items.map((i) => i.n)}
    </g>
  );
};

// ---------- overlays ----------
const current = (f: number) => {
  let k = -1;
  ARRIVE.forEach((a, i) => {
    if (f >= a - 4) k = i;
  });
  return f >= FINALE - 10 ? -1 : k;
};

const StampCard: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const k = current(f);
  if (k < 0) return null;
  const b: Biz = BIZ[k];
  const a = ARRIVE[k];
  const end = (ARRIVE[k + 1] ?? FINALE) - 20;
  const show = tw(f, a + 2, a + 10) * (1 - tw(f, end - 6, end));
  if (show <= 0.01) return null;
  const s = tw(show, 0, 1, 0.6, 1, BACK);
  const [ox, oy] = origin(k);
  const [lx, ly] = CUSTOMER[b.key];
  const [hx, hy] = toScreen(c, ...P(ox + lx, oy + ly + 12, 0));
  const top = Math.min(1316, Math.max(1290, hy + 30));
  const W = 480;
  const cx = Math.min(1080 - W / 2 - 40, Math.max(W / 2 + 40, hx));
  const stamped = f >= STAMP[k];
  const pop = stamped ? tw(f, STAMP[k], STAMP[k] + 8, 1.8, 1, BACK) : 1;
  const n = stamped ? b.have : b.have - 1;
  const pts = b.kind === "points" ? Math.round(b.have - (b.gain ?? 0) + (b.gain ?? 0) * tw(f, STAMP[k], STAMP[k] + 10, 0, 1, EO)) : 0;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: show }}>
        <line x1={cx} y1={top} x2={hx} y2={hy} stroke={C.sand} strokeWidth={7} strokeDasharray="6 8" />
        <line x1={cx} y1={top} x2={hx} y2={hy} stroke={b.color} strokeWidth={3.5} strokeDasharray="6 8" />
        <circle cx={hx} cy={hy} r={8} fill={b.color} stroke={C.sand} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: cx - W / 2, top, width: W, scale: `${s}`, transformOrigin: "50% 0", opacity: show }}>
        <div style={{ borderRadius: 26, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: FONT.sans }}>
          <div style={{ background: b.color, color: "#FFFFFF", padding: "14px 26px", fontSize: 24, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            <span>{b.name}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: "0.16em", opacity: 0.8 }}>{b.kind === "points" ? "POINTS" : "STAMPS"}</span>
          </div>
          <div style={{ background: C.sand, padding: "18px 26px 20px", color: C.ink }}>
            {b.kind === "stamps" ? (
              <>
                <div style={{ fontSize: 30, fontWeight: 800 }}>
                  {n} of {b.total} stamps
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "nowrap" }}>
                  {Array.from({ length: b.total }).map((_, i) => {
                    const on = i < n;
                    const isNew = stamped && i === n - 1;
                    return <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: on ? b.accent : "transparent", border: on ? "none" : `3px solid ${C.border}`, scale: isNew ? `${pop}` : undefined }} />;
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{pts} points</div>
                  {stamped && <div style={{ fontSize: 26, fontWeight: 800, color: b.color, scale: `${pop}`, transformOrigin: "0 50%" }}>+{b.gain}</div>}
                </div>
                <div style={{ marginTop: 12, height: 14, borderRadius: 99, background: C.sandAlt, overflow: "hidden" }}>
                  <div style={{ width: `${(pts / b.total) * 100}%`, height: "100%", background: b.accent, borderRadius: 99 }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 20, color: C.ink2 }}>
                  A {b.prize} at {b.total} points
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Orbs: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const nodes: React.ReactNode[] = [];
  BIZ.forEach((b, k) => {
    const [ox, oy] = origin(k);
    const [lx, ly] = CUSTOMER[b.key];
    // during the visit: "+1" above the customer; at the finale: every shop pops
    const at = f >= FINALE ? FINALE + 30 + k * 4 : STAMP[k];
    const t = f - at;
    const life = f >= FINALE ? 999 : 26;
    if (t < 0 || t > life) return;
    const [x, y] = toScreen(c, ...P(ox + (f >= FINALE ? 150 : lx), oy + (f >= FINALE ? 150 : ly), f >= FINALE ? 120 : 96));
    const pop = tw(t, 0, 8, f >= FINALE ? 1.3 : 1.4, 1, BACK) * (f >= FINALE ? 1 : 1 - 0.4 * tw(t, 18, 24));
    const o = f >= FINALE ? 1 : 1 - tw(t, 20, 25);
    const r = f >= FINALE ? 14 : b.kind === "points" ? 36 : 32;
    nodes.push(
      <div key={k} style={{ position: "absolute", left: x - r, top: y - r - (f >= FINALE ? 0 : t * 1.4), width: r * 2, height: r * 2, borderRadius: "50%", background: f >= FINALE ? b.accent : C.coral, color: "#fff", display: "grid", placeItems: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: r * 0.85, scale: `${pop}`, opacity: o, boxShadow: "0 0 24px rgba(0,0,0,0.25), 0 0 0 4px rgba(246,241,227,0.95)" }}>
        {f >= FINALE ? "" : b.kind === "points" ? `+${b.gain}` : "+1"}
      </div>,
    );
  });
  return <>{nodes}</>;
};

const Headlines: React.FC<{ f: number }> = ({ f }) => {
  const k = current(f);
  const L = (a: string, b: string, inAt: number, outAt: number, big = 90, small = 90) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center" }}>
      <div style={displayText(big)}>
        <Line f={f} inAt={inAt} outAt={outAt} dur={10}>
          {a}
        </Line>
      </div>
      <div style={{ ...displayText(small), marginTop: 4 }}>
        <Line f={f} inAt={inAt + 4} outAt={outAt + 2} dur={10}>
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>{b}</span>
        </Line>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 432 }}>
      {L("Every small business", "has its regulars.", 24, 150, 80, 80)}
      {L("Here's how", "they keep coming back.", 160, DIVE[1] - 24, 80, 80)}
      {BIZ.map((b, i) => (
        <React.Fragment key={b.key}>{f >= ARRIVE[i] - 12 && f < (ARRIVE[i + 1] ?? FINALE) + 4 && L(`${b.label}.`, b.rule, ARRIVE[i] - 4, (ARRIVE[i + 1] ?? FINALE) - 22, 108, 48)}</React.Fragment>
      ))}
      {f >= FINALE && L("Built for every kind", "of small business.", FINALE + 24, CARD - 12, 80, 80)}
      {k < -99 && null}
    </div>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number; skip?: number }> = ({ at, src, vol = 0.5, skip = 0 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} trimBefore={skip} />
  </Sequence>
);
// the stamps land on beats, so the music dips 3 dB under each click (linear ramps)
const stampDuck = (fr: number) => 1 - 0.3 * STAMP.reduce((m, s) => Math.max(m, tw(fr, s - 3, s - 1, 0, 1, (x) => x) - tw(fr, s + 3, s + 7, 0, 1, (x) => x)), 0);
const SOUND = [
  ...RISE.map((r) => ({ at: r + 12, src: "sfx/casino/card-place-1.ogg", vol: 0.14 })),
  { at: DIVE[0] + 30, src: "sfx/web/whoosh.wav", vol: 0.35 },
  // the click file is two events: a 1 ms down-click at 0 and the loud up-click 2.82 frames in.
  // Skip the first two frames and start one frame early so the up-click lands on the stamp.
  ...STAMP.map((s) => ({ at: s - 1, src: "sfx/web/mouse-click-loud.wav", vol: 0.7, skip: 2 })),
  ...ARRIVE.slice(1).map((a) => ({ at: a - 12, src: "sfx/web/whoosh.wav", vol: 0.22 })),
  ...BIZ.map((_, k) => ({ at: FINALE + 30 + k * 4, src: "sfx/interface/click_003.ogg", vol: 0.16 })),
  ...endSfx(CARD),
];

export const Town: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const c = cam(f);
  const world = (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={camTransform(c)}>
        <World f={f} />
      </g>
    </svg>
  );
  const wide = 1 - tw(f, DIVE[0], DIVE[1] - 20) + tw(f, FINALE, FINALE + 26);
  return (
    <AbsoluteFill style={{ background: C.pandan, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1300px 1500px at 50% 48%, #1C5A48 0%, #0F3D32 55%, #082119 100%)" }} />
      <AbsoluteFill style={{ filter: "saturate(1.15)" }}>{world}</AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: "blur(8px) saturate(1.15)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          maskImage: "linear-gradient(180deg, black 0%, transparent 30%, transparent 66%, black 100%)",
          opacity: 1 - Math.min(1, wide),
        }}
      >
        {world}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,14,11,0.68) 0%, rgba(6,14,11,0.55) 29%, rgba(6,14,11,0.22) 36%, rgba(6,14,11,0) 42%)" }} />
      <Orbs f={f} c={c} />
      <StampCard f={f} c={c} />
      <Headlines f={f} />
      <Grain f={f} />
      <StandardEnd f={f} start={CARD} />
      <Audio src={staticFile("music/dive.mp3")} volume={(fr) => stampDuck(fr) * endDuck(fr, CARD) * interpolate(fr, [0, 3, TOWN_LEN - 50, TOWN_LEN - 4], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};

