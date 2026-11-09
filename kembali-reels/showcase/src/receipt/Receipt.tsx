import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Line, Em, displayText } from "../common";

// Desire (slowed) 0:08 → 0:28. Measured 104.1 BPM: beat k at 5.52 + 17.295k frames.
const bt = (k: number) => Math.round(5.52 + 17.295 * k);
// Standard end card: the carried loop lands (start + 18) on bt(32) = 559. The reel runs
// 40 frames longer than before so the card holds 61 frames after it settles.
const END = bt(32) - 18;
export const RECEIPT_LEN = 640;

const W = 760; // paper width
const LEFT = (1080 - W) / 2;
const SLOT = 1470; // printer slot, paper emerges upward from here
const INK = "#26241F";
const PAPER = "#FBF8F1";

// ---------- receipt content ----------
type Row = { key: string; h: number; at: number; dur: number; node: (f: number) => React.ReactNode; coupon?: boolean };

const mono = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT.mono,
  fontSize: size,
  color: INK,
  letterSpacing: "0.02em",
  textShadow: "0 0 0.7px rgba(38,36,31,0.6)",
  ...extra,
});

const Pair: React.FC<{ l: string; r: string; size?: number }> = ({ l, r, size = 36 }) => (
  <div style={{ ...mono(size), display: "flex", justifyContent: "space-between", padding: "0 48px" }}>
    <span>{l}</span>
    <span>{r}</span>
  </div>
);

const Divider: React.FC<{ ch?: string }> = ({ ch = "-" }) => (
  <div style={{ ...mono(30, { color: "rgba(38,36,31,0.55)" }), textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", padding: "0 30px" }}>
    {ch.repeat(40)}
  </div>
);

export const POP = bt(20); // 9th stamp lands

const Stamps: React.FC<{ n: number; f: number; live?: boolean }> = ({ n, f, live }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 48px" }}>
    {Array.from({ length: 9 }).map((_, i) => {
      const filled = i < n || (live && i === 8 && f >= POP);
      const pop = live && i === 8 ? tw(f, POP, POP + 8, 1.9, 1, BACK) : 1;
      const ring = live && i === 8 ? tw(f, POP, POP + 16) : 0;
      return (
        <div key={i} style={{ position: "relative", width: 52, height: 52 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: filled ? "none" : `4px solid ${INK}`,
              background: filled ? C.coral : "transparent",
              opacity: filled ? 1 : 0.55,
              scale: `${filled ? pop : 1}`,
            }}
          />
          {ring > 0 && ring < 1 && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `4px solid ${C.coral}`, scale: `${1 + ring * 2.2}`, opacity: 1 - ring }} />
          )}
        </div>
      );
    })}
  </div>
);

const VISITS = [
  { d: "03 MAR  08:12", item: "Flat white", p: "9.50" },
  { d: "06 MAR  12:40", item: "Iced latte", p: "11.00" },
  { d: "11 MAR  08:05", item: "Americano", p: "8.00" },
  { d: "15 MAR  16:22", item: "Mocha", p: "12.50" },
  { d: "19 MAR  08:31", item: "Cappuccino", p: "10.00" },
  { d: "28 MAR  09:14", item: "Hot chocolate", p: "11.50" },
  { d: "01 APR  13:02", item: "Iced latte", p: "11.00" },
  { d: "13 APR  08:09", item: "Flat white", p: "9.50" },
  { d: "26 APR  10:04", item: "Flat white", p: "9.50" },
];

// block start frames: visit 1 prints slow and readable, 2–8 are a timelapse, 9 lands on the beat
const BLOCK_AT = [bt(3), bt(8), bt(9) + 6, bt(10) + 8, bt(11) + 8, bt(12) + 6, bt(13) + 4, bt(14) + 2, bt(17)];
const BLOCK_STEP = [17.3, 5, 4.4, 4, 3.6, 3.3, 3, 3, 17.3];

const ROWS: Row[] = (() => {
  const rows: Row[] = [];
  const add = (key: string, h: number, at: number, node: Row["node"], dur = 6, coupon = false) => rows.push({ key, h, at, dur, node, coupon });
  add("lead", 140, 0, () => null, 20);
  add("shop", 120, bt(1), () => (
    <div style={{ textAlign: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: 76, letterSpacing: "-0.02em", color: INK }}>CORNER COFFEE</div>
  ), 8);
  add("addr", 52, bt(1) + 8, () => <div style={{ ...mono(30), textAlign: "center" }}>Bangsar, Kuala Lumpur</div>);
  add("card", 52, bt(2), () => <div style={{ ...mono(30), textAlign: "center" }}>COFFEE CARD · BUY 9, 1 FREE</div>);
  add("d0", 50, bt(2) + 8, () => <Divider ch="=" />);
  VISITS.forEach((v, i) => {
    const at = BLOCK_AT[i];
    const st = BLOCK_STEP[i];
    const last = i === 8;
    add(`v${i}`, 62, at, () => <Pair l={`VISIT ${String(i + 1).padStart(2, "0")}`} r={v.d} size={34} />, last || i === 0 ? 6 : 3);
    add(`i${i}`, 62, at + st, () => <Pair l={v.item} r={`RM ${v.p}`} size={40} />, last || i === 0 ? 6 : 3);
    add(`s${i}`, 84, at + st * 2, (f) => <Stamps n={i + (last ? 0 : 1)} f={f} live={last} />, last || i === 0 ? 6 : 3);
    if (!last) {
      add(`m${i}`, 54, at + st * 3, () => (
        <div style={{ ...mono(30), textAlign: "center", opacity: 0.8 }}>{8 - i} more to a free coffee</div>
      ), i === 0 ? 6 : 3);
      add(`dv${i}`, 46, at + st * 4, () => <Divider />, i === 0 ? 6 : 3);
    }
  });
  add("full", 150, bt(21), () => (
    <div style={{ margin: "16px 40px", background: INK, color: PAPER, textAlign: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: 84, letterSpacing: "0.02em", lineHeight: "118px", borderRadius: 6 }}>
      CARD FULL
    </div>
  ), 7);
  add("perf", 60, bt(22), () => (
    <div style={{ ...mono(30, { color: "rgba(38,36,31,0.5)" }), display: "flex", alignItems: "center", gap: 8, padding: "0 20px", whiteSpace: "nowrap", overflow: "hidden" }}>
      <span style={{ fontSize: 40 }}>✂</span>
      {"- ".repeat(30)}
    </div>
  ), 5);
  add("coupon", 420, bt(22) + 6, () => <CouponBody />, 14, true);
  add("tail", 80, bt(23) + 4, () => null, 6, true);
  return rows;
})();

const OFFS = (() => {
  const o: number[] = [];
  let acc = 0;
  for (const r of ROWS) {
    o.push(acc);
    acc += r.h;
  }
  return o;
})();
const PERF_I = ROWS.findIndex((r) => r.key === "perf");
const COUPON_OFF = OFFS[PERF_I] + ROWS[PERF_I].h;

// paper fed out of the printer by frame f (stepper-motor motion per line)
const fed = (f: number) => ROWS.reduce((acc, r) => acc + r.h * tw(f, r.at, r.at + r.dur, 0, 1, EO), 0);

function CouponBody() {
  return (
    <div style={{ padding: "26px 48px 0", display: "flex", gap: 36 }}>
      <div style={{ flex: 1 }}>
        <div style={{ ...mono(26), letterSpacing: "0.2em", opacity: 0.7 }}>YOUR REWARD</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 82, lineHeight: 0.95, letterSpacing: "-0.03em", color: INK, marginTop: 16 }}>
          FREE
          <br />
          COFFEE
        </div>
        <div style={{ ...mono(30), marginTop: 14 }}>of your choice</div>
        <div style={{ ...mono(24), marginTop: 26, opacity: 0.75, lineHeight: 1.5 }}>
          Show at the counter
          <br />
          Single use · 15 min
        </div>
      </div>
      <div style={{ width: 230, height: 230, marginTop: 30, padding: 12, border: `3px solid ${INK}`, borderRadius: 18, background: PAPER }}>
        <Img src={staticFile("qr.svg")} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

// ---------- scene pieces ----------
const TEAR = bt(25);
const LAND = bt(26);

const Paper: React.FC<{ f: number }> = ({ f }) => {
  const H = fed(f);
  const v = H - fed(f - 1);
  const recoil = tw(f, TEAR, TEAR + 4, 0, -40, EO) + tw(f, TEAR + 6, TEAR + 28, 0, -2600, EI);
  const top = SLOT - H + recoil;
  const blur = Math.min(26, Math.abs(v) * 0.22);
  const torn = f >= TEAR;
  // only the part above the perforation survives the tear
  const clipH = torn ? COUPON_OFF : 99999;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SLOT, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top,
          width: W,
          height: Math.min(clipH, H + 10),
          overflow: "hidden",
          background: PAPER,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          filter: blur > 0.5 ? `url(#vblur)` : undefined,
        }}
      >
        {/* paper grain + faint thermal banding */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0 2px, transparent 2px 7px)" }} />
        {ROWS.map((r, i) => {
          const y = top + OFFS[i];
          if (y > SLOT + 20 || y + r.h < -40) return null;
          if (torn && r.coupon) return null;
          return (
            <div key={r.key} style={{ position: "absolute", left: 0, right: 0, top: OFFS[i], height: r.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {r.node(f)}
            </div>
          );
        })}
        {torn && <Zig bottom />}
      </div>
      {/* torn top edge of the roll's start */}
      <svg width={1080} height={SLOT} style={{ position: "absolute", inset: 0, pointerEvents: "none", filter: "none" }}>
        <defs>
          <filter id="vblur" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation={`0 ${blur}`} />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

const Zig: React.FC<{ bottom?: boolean; color?: string }> = ({ bottom, color = C.pandan }) => (
  <svg width={W} height={16} viewBox={`0 0 ${W} 16`} preserveAspectRatio="none" style={{ position: "absolute", left: 0, [bottom ? "bottom" : "top"]: -1 }}>
    <path
      d={`M0 ${bottom ? 16 : 0} ${Array.from({ length: 39 }, (_, i) => `L${(i + 0.5) * (W / 38)} ${bottom ? (i % 2 ? 16 : 4 + rand(i) * 6) : i % 2 ? 0 : 12 - rand(i) * 6}`).join(" ")} L${W} ${bottom ? 16 : 0} Z`}
      fill={color}
    />
  </svg>
);

const Printer: React.FC<{ f: number }> = ({ f }) => {
  const H = fed(f);
  const moving = H - fed(f - 1) > 0.5;
  const drop = tw(f, bt(27), bt(28), 0, 700, EI);
  return (
    <div style={{ position: "absolute", left: 90, top: SLOT - 30, width: 900, height: 520, translate: `0 ${drop}px` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "56px 56px 0 0",
          background: "linear-gradient(180deg, #1B2F28 0%, #0E1D18 60%)",
          boxShadow: "0 -2px 0 rgba(255,255,255,0.06) inset, 0 -30px 80px rgba(0,0,0,0.5)",
        }}
      />
      {/* slot */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 22, height: 18, borderRadius: 10, background: "#050B09", boxShadow: "inset 0 4px 8px rgba(0,0,0,0.8)" }} />
      <div style={{ position: "absolute", left: 90, top: 90, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: moving ? C.leaf : "#2E4A3F", boxShadow: moving ? `0 0 16px ${C.leaf}` : "none" }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: "0.3em", color: "rgba(246,241,227,0.4)" }}>{moving ? "PRINTING" : "READY"}</div>
      </div>
    </div>
  );
};

// huge visit numeral behind the paper
const Numeral: React.FC<{ f: number }> = ({ f }) => {
  let n = 0;
  VISITS.forEach((_, i) => {
    if (f >= BLOCK_AT[i]) n = i + 1;
  });
  if (n === 0 || f > TEAR + 10) return null;
  const since = f - BLOCK_AT[n - 1];
  const roll = tw(since, 0, 6, 1, 0, EO);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 330,
        textAlign: "center",
        fontFamily: FONT.display,
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 1300,
        lineHeight: 1,
        color: n === 9 ? C.coral : C.sand,
        opacity: (n === 9 ? 0.3 : 0.1) * (1 - roll * 0.6) * (1 - tw(f, TEAR, TEAR + 10)),
        translate: `0 ${roll * 140}px`,
        letterSpacing: "-0.06em",
      }}
    >
      {n}
    </div>
  );
};

// the torn-off coupon flies to camera, then collapses into the logo's stamp dot
const Coupon: React.FC<{ f: number }> = ({ f }) => {
  if (f < TEAR) return null;
  const startY = SLOT - fed(TEAR) + COUPON_OFF;
  const fly = tw(f, TEAR, LAND, 0, 1, EO);
  const shrink = tw(f, bt(28) + 2, bt(28) + 14, 0, 1, EIO);
  const Hc = 500;
  const y = interpolate(fly, [0, 1], [startY, 960 - Hc / 2]) + shrink * (900 - 960);
  const w = interpolate(shrink, [0, 1], [W, 154]);
  const h = interpolate(shrink, [0, 1], [Hc, 154]);
  const sc = 1 + Math.sin(fly * Math.PI) * 0.18 + (1 - shrink) * (fly * 0.08);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 1600 }}>
      <div
        style={{
          position: "absolute",
          left: 540 - w / 2,
          top: y + (Hc - h) / 2 * shrink,
          width: w,
          height: h,
          borderRadius: 4 + (Math.min(w, h) / 2 - 4) * Math.min(1, shrink * 1.8),
          background: shrink > 0 ? mixHex(PAPER, C.coral, shrink * shrink) : PAPER,
          boxShadow: `0 ${50 * (1 - shrink)}px ${100 * (1 - shrink)}px rgba(0,0,0,${0.5 * (1 - shrink)})`,
          overflow: "hidden",
          scale: `${sc}`,
          transform: `rotateX(${Math.sin(fly * Math.PI) * -28}deg) rotateZ(${(1 - fly) * 8 - 3 * (1 - shrink) + shrink * 220}deg)`,
        }}
      >
        <div style={{ opacity: 1 - tw(shrink, 0, 0.25), width: W, height: Hc }}>
          <div style={{ height: 40 }} />
          <CouponBody />
          <Zig color="#0B2A22" />
        </div>
      </div>
    </div>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};

// ---------- the ribbon: the receipt winds itself into the return loop ----------
const LC = { x: 540, y: 900 };
const R = 230;
const ARC = (315 / 180) * Math.PI;
const L = R * ARC;
const SL = 70;

const Ribbon: React.FC<{ f: number }> = ({ f }) => {
  const F = tw(f, bt(27) + 4, bt(30), 0, L, EIO);
  if (F <= 0) return null;
  const segs: React.ReactNode[] = [];
  {
    // Backing UNDER the striped segments: the 70 rotated rectangles leave 2–4 px notches at
    // their outer corners, so each segment also gets a plain arc in its own shade (butt ends,
    // 1.5 px overlap) that fills them, plus a round disc on the ribbon's start edge (q = 0) so
    // the built loop matches the card's round-capped Mark at the reveal. The leading tip stays
    // flat (the arrowhead covers it once the loop closes).
    const pt = (s: number) => (s >= 0 ? [LC.x + Math.cos(s / R) * R, LC.y + Math.sin(s / R) * R] : [LC.x + R, LC.y + s]);
    const shade = (light: number) => `rgb(${Math.round(251 * light)},${Math.round(248 * light)},${Math.round(241 * light)})`;
    const seg = L / SL;
    const paths: React.ReactNode[] = [];
    for (let i = 0; i < SL; i++) {
      const a = ((i + 0.5) / SL) * L - (L - F);
      const s1 = a - seg / 2 - 1.5;
      const s2 = a + seg / 2 + 1.5;
      const ang = (a >= 0 ? a / R : 0) + Math.PI / 2;
      const light = 0.8 + 0.2 * Math.cos(ang - Math.PI / 4);
      const [x1, y1] = pt(s1);
      const [x2, y2] = pt(s2);
      const d = s2 <= 0 ? `M ${x1} ${y1} L ${x2} ${y2}` : s1 >= 0 ? `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}` : `M ${x1} ${y1} L ${LC.x + R} ${LC.y} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
      paths.push(<path key={i} d={d} fill="none" stroke={shade(light)} strokeWidth={58} strokeLinecap="butt" />);
    }
    const [cx, cy] = pt(-(L - F));
    paths.push(<circle key="cap" cx={cx} cy={cy} r={29} fill={shade(0.8 + 0.2 * Math.cos(Math.PI / 4))} />);
    segs.push(
      <svg key="backing" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {paths}
      </svg>,
    );
  }
  for (let i = 0; i < SL; i++) {
    const q = ((i + 0.5) / SL) * L; // tip is q = L
    const a = q - (L - F);
    let x: number, y: number, ang: number;
    if (a >= 0) {
      const th = a / R;
      x = LC.x + Math.cos(th) * R;
      y = LC.y + Math.sin(th) * R;
      ang = th + Math.PI / 2;
    } else {
      x = LC.x + R;
      y = LC.y + a;
      ang = Math.PI / 2;
    }
    const light = 0.8 + 0.2 * Math.cos(ang - Math.PI / 4);
    segs.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - (L / SL) / 2 - 1,
          top: y - 29,
          width: L / SL + 2,
          height: 58,
          rotate: `${ang}rad`,
          background: `rgb(${Math.round(251 * light)},${Math.round(248 * light)},${Math.round(241 * light)})`,
          backgroundImage: "repeating-linear-gradient(90deg, rgba(38,36,31,0.18) 0 3px, transparent 3px 9px)",
          backgroundSize: "100% 30%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 50%",
        }}
      />,
    );
  }
  const arrow = tw(f, bt(30), bt(30) + 8, 0, 1, BACK);
  // arrowhead at the tip, from the mark's own geometry (scale R / 24)
  const s = R / 24;
  const P = (px: number, py: number) => `${LC.x + (px - 40) * s},${LC.y + (py - 40) * s}`;
  return (
    <>
      {segs}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <polygon
          points={`${P(62.7, 28.7)} ${P(60.5, 19.5)} ${P(53.5, 26.5)}`}
          fill={PAPER}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%", scale: `${arrow}` }}
        />
      </svg>
    </>
  );
};

const Backdrop: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "#08201A" }}>
    <AbsoluteFill style={{ background: `radial-gradient(900px 1300px at 540px ${700 + Math.sin(f / 50) * 40}px, #17503F 0%, #0C2E25 50%, #061712 100%)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
  </AbsoluteFill>
);

// ---------- sound: every line step is a printer tick ----------
const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

// the arrowhead bell lands on the song's loudest bar: dip the music 30 % under it (linear ramps)
const bellDuck = (fr: number) => 1 - 0.3 * (tw(fr, bt(30) - 2, bt(30), 0, 1, (x) => x) - tw(fr, bt(30) + 4, bt(30) + 8, 0, 1, (x) => x));
const SOUND: { at: number; src: string; vol?: number }[] = [
  ...ROWS.filter((r) => r.at > 0 && r.at < TEAR).map((r, i) => ({ at: r.at, src: `sfx/keyboard/keypress-00${(i % 3) + 1}.wav`, vol: 0.35 })),
  // the −1 offsets here compensated the render's old 1.28-frame audio lag; the mux now trims it
  { at: POP, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.6 },
  { at: bt(21), src: "sfx/impact/impactGeneric_light_000.ogg", vol: 0.5 },
  { at: TEAR, src: "sfx/web/whip.wav", vol: 0.45 },
  { at: LAND, src: "sfx/casino/card-place-1.ogg", vol: 0.5 },
  { at: bt(27) + 4, src: "sfx/web/whoosh.wav", vol: 0.35 },
  { at: bt(30) + 1, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.5 }, // arrowhead's first visible pixel; 0.3 was masked by the kick
  ...endSfx(END, true),
];

// camera: pushed in on the printer to open, back for the timelapse, in again for the ninth stamp
const CAM_T = [0, 40, 150, 318, 348, TEAR, LAND];
const cam = (f: number) => ({
  ty: interpolate(f, CAM_T, [-330, -330, 0, 0, -380, -380, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EIO }),
  s: interpolate(f, CAM_T, [1.3, 1.3, 1, 1, 1.15, 1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EIO }),
});

export const Receipt: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const land = f >= LAND && f < LAND + 12 ? Math.exp(-(f - LAND) / 3) * Math.cos((f - LAND) * 1.8) : 0;
  return (
    <AbsoluteFill style={{ background: "#08201A", overflow: "hidden" }}>
      <Backdrop f={f} />
      <Numeral f={f} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 470, textAlign: "center", ...displayText(120) }}>
        <Line f={f} inAt={bt(0)} outAt={bt(3) + 2}>
          Your regulars,
        </Line>
        <Line f={f} inAt={bt(1) - 4} outAt={bt(3) + 4}>
          <Em>on record.</Em>
        </Line>
      </div>
      <AbsoluteFill
        style={{
          translate: `0 ${cam(f).ty + land * 10}px`,
          scale: `${cam(f).s}`,
          transformOrigin: `540px ${SLOT}px`,
        }}
      >
        <Paper f={f} />
        <Printer f={f} />
        <Ribbon f={f} />
        <Coupon f={f} />
      </AbsoluteFill>
      <Grain f={f} />
      {/* the paper loop (R = 230 → mark 767px at LC) is carried into the standard card */}
      <StandardEnd f={f} start={END} from={{ x: LC.x, y: LC.y, size: (R / 24) * 80, stroke: PAPER }} />
      <Audio
        src={staticFile("music/desire.mp3")}
        trimBefore={8 * 30}
        volume={(fr) => bellDuck(fr) * endDuck(fr, END) * interpolate(fr, [0, 3, 572, 606], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SOUND.map((s, i) => (
        <Sfx key={i} {...s} />
      ))}
    </AbsoluteFill>
  );
};
