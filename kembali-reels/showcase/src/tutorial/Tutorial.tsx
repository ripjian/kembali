import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EIO, BACK, rand } from "../lib";
import { useFonts } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Mark } from "../common";

// Candyland (Joey Lamecker remix) 0:12 → 0:42. 128 BPM: beat k at 5.4 + 14.06k frames,
// 4 beats to a bar. A loving parody of a 2010 screen-recorded tutorial; every gag,
// click and hit sits on a beat.
const bt = (k: number) => Math.round(5.4 + 14.06 * k);
const bar = (n: number) => bt(4 * n);

const IMPACT = "Impact, 'Arial Black', sans-serif";
const COMIC = "'Comic Sans MS', 'Comic Neue', cursive";

const S1 = bar(2); // print
const S2 = bar(4); // scan
const S3 = bar(6); // stamps
const S4 = bar(10); // profit
const OUT = bar(12); // thx
const VHS_AT = bar(14);
const REW = VHS_AT - 10; // the tape rewinds from here (3× backwards)
const END_AT = bt(57); // hard cut to 2026 on a beat: the standard card starts here
// The reel runs 25 frames longer than before so the 2026 roll (card t 42–53) has time to land
// and the card then holds 66 frames.
export const TUTORIAL_LEN = 925;
const TR = 20; // transition length

const CLICK_PRINT = bt(10);
const CLICK_OK = bt(12);
const GRAB = bt(18) - 2;
const SCAN = bt(20);
const STEP35 = bt(38); // two beats for the joke
const STAMPS = Array.from({ length: 9 }, (_, i) => bt(26 + i));
const FULL = STAMPS[8];
const CLICK_GIFT = bt(42);
const CLICK_LIKE = bt(50);
const CLICK_SHARE = bt(52);

// ---------- 2010 kit ----------
const RAINBOW = "linear-gradient(90deg, #FF3B3B, #FF9F1C, #FFE600, #3BD16F, #2EB8FF, #8B5CF6, #FF4FD8)";
const CHROME = "linear-gradient(180deg, #FFFFFF 0%, #C9D3DD 45%, #6E7F8F 50%, #DDE5EC 75%, #FFFFFF 100%)";
const GOLD = "linear-gradient(180deg, #FFF6B0 0%, #F5C542 45%, #B07A10 50%, #F9D86A 75%, #FFF3A0 100%)";

// WordArt: gradient fill clipped to the letters, black outline, stacked 3D extrusion
const WordArt: React.FC<{ text: string; size: number; fill?: string; spin?: number; style?: React.CSSProperties; depth?: number }> = ({ text, size, fill = RAINBOW, spin = 0, style, depth = 8 }) => (
  <div style={{ position: "relative", display: "inline-block", transform: `perspective(900px) rotateY(${spin}deg)`, ...style }}>
    {Array.from({ length: depth }).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: depth - i, top: depth - i, fontFamily: IMPACT, fontSize: size, lineHeight: 1, color: i === 0 ? "#000" : "#3A1E6B", whiteSpace: "nowrap", WebkitTextStroke: "3px #000" }}>
        {text}
      </div>
    ))}
    <div style={{ position: "relative", fontFamily: IMPACT, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", backgroundImage: fill, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextStroke: "3px #111" }}>{text}</div>
  </div>
);

const Sub: React.FC<{ text: string; f: number; at: number; out: number }> = ({ text, f, at, out }) => {
  if (f < at || f >= out) return null;
  const s = tw(f, at, at + 8, 0.4, 1, BACK) * (1 - tw(f, out - 4, out, 0, 0.6));
  return <div style={{ position: "absolute", left: 30, right: 30, top: 1380, textAlign: "center", fontFamily: COMIC, fontWeight: 700, fontSize: 52, color: "#FFF200", WebkitTextStroke: "2.5px #000", textShadow: "4px 4px 0 #000", scale: `${s}`, lineHeight: 1.1 }}>{text}</div>;
};

const Starburst: React.FC<{ text: string; size: number; spin: number; color?: string }> = ({ text, size, spin, color = "#FF3B6B" }) => {
  const n = 16;
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? size * 0.38 : size * 0.5;
    const a = (i / (n * 2)) * Math.PI * 2;
    return `${size / 2 + Math.cos(a) * r},${size / 2 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <div style={{ position: "relative", width: size, height: size, rotate: `${spin}deg` }}>
      <svg width={size} height={size}>
        <polygon points={pts} fill={color} stroke="#FFF200" strokeWidth={4} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: IMPACT, fontSize: size * 0.24, color: "#FFF200", WebkitTextStroke: "2px #000", rotate: "-12deg" }}>{text}</div>
    </div>
  );
};

// rays radiating from (cx, cy) in the parent's coordinates
const Sunburst: React.FC<{ f: number; cx: number; cy: number; a: string; b: string }> = ({ f, cx, cy, a, b }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: cx - 1600, top: cy - 1600, width: 3200, height: 3200, background: `repeating-conic-gradient(from ${f * 1.2}deg at 50% 50%, ${a} 0deg 10deg, ${b} 10deg 20deg)` }} />
    <div style={{ position: "absolute", left: cx - 500, top: cy - 500, width: 1000, height: 1000, background: "radial-gradient(circle, rgba(255,255,255,0.75), rgba(255,255,255,0) 50%)" }} />
  </AbsoluteFill>
);

const LensFlare: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <AbsoluteFill style={{ opacity: o, mixBlendMode: "screen", pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: x - 260, top: y - 260, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,200,0.6) 12%, rgba(255,200,120,0) 50%)" }} />
    <div style={{ position: "absolute", left: x - 700, top: y - 4, width: 1400, height: 8, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)" }} />
    {[0.35, 0.6, 0.85, 1.2].map((k, i) => (
      <div key={i} style={{ position: "absolute", left: x + (540 - x) * 2 * k - 40 - i * 10, top: y + (900 - y) * 2 * k - 40 - i * 10, width: 80 + i * 20, height: 80 + i * 20, borderRadius: "50%", background: ["rgba(120,200,255,0.35)", "rgba(255,120,220,0.3)", "rgba(140,255,160,0.3)", "rgba(255,230,120,0.3)"][i] }} />
    ))}
  </AbsoluteFill>
);

const WIN = { x: 50, y: 640, w: 980, h: 700 };
const CONTENT_Y = WIN.y + 52;
const Window: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 14, overflow: "hidden", boxShadow: "0 0 0 2px #1C3B66, 0 20px 50px rgba(0,0,0,0.5)", background: "#FFFFFF" }}>
    <div style={{ height: 52, background: "linear-gradient(180deg, rgba(190,220,255,0.95) 0%, rgba(120,170,230,0.95) 50%, rgba(90,140,210,0.95) 51%, rgba(150,195,245,0.95) 100%)", display: "flex", alignItems: "center", padding: "0 18px", gap: 12, fontFamily: "Tahoma, sans-serif", fontSize: 24, color: "#0B2240", textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: C.pandan, display: "grid", placeItems: "center" }}>
        <Mark size={20} stroke={C.sand} />
      </div>
      <span>{title}</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {["#D7E6F5", "#D7E6F5", "#E5584F"].map((c, i) => (
          <div key={i} style={{ width: 44, height: 26, borderRadius: 5, background: `linear-gradient(${c}, ${i === 2 ? "#B5302A" : "#9DB7D6"})`, border: "1px solid #3D5A80" }} />
        ))}
      </div>
    </div>
    <div style={{ position: "relative", height: WIN.h - 52, overflow: "hidden" }}>{children}</div>
  </div>
);

// ---------- cursor ----------
type CK = [number, number, number]; // frame, x, y
const PARK: [number, number] = [1040, 612];
const PRINT_BTN: [number, number] = [930, 760];
const OK_BTN: [number, number] = [722, 1066];
const PHONE_GRAB: [number, number] = [735, 1250];
const PHONE_DROP: [number, number] = [330, 1240];
const GIFT: [number, number] = [560, 1010];
const LIKE: [number, number] = [452, 1052];
const SHARE: [number, number] = [650, 1052];
const CARD_C: [number, number] = [540, 942];
const PAINT_TURNS = Math.PI * 2.15;
const PAINT_END: [number, number] = [CARD_C[0] + Math.cos(PAINT_TURNS) * 270 + Math.sin(PAINT_TURNS * 3) * 8, CARD_C[1] + Math.sin(PAINT_TURNS) * 250];
const CURSOR: CK[] = [
  [S1 + 4, ...PARK],
  [CLICK_PRINT - 2, ...PRINT_BTN],
  [CLICK_PRINT + 10, ...PRINT_BTN],
  [CLICK_OK - 2, ...OK_BTN],
  [CLICK_OK + 6, ...OK_BTN],
  [CLICK_OK + 16, ...PARK],
  [S2 - 6, ...PARK],
  [GRAB, ...PHONE_GRAB],
  [SCAN - 3, ...PHONE_DROP],
  [SCAN + 18, ...PHONE_DROP],
  [S3 - 4, ...PARK],
  [FULL + 4, ...PARK],
  [FULL + 10, CARD_C[0] + 270, CARD_C[1]],
  [FULL + 44, ...PAINT_END],
  [CLICK_GIFT - 30, ...PAINT_END],
  [CLICK_GIFT - 2, ...GIFT],
  [CLICK_GIFT + 12, ...GIFT],
  [OUT + 6, ...PARK],
  [CLICK_LIKE - 2, ...LIKE],
  [CLICK_SHARE - 2, ...SHARE],
  [CLICK_SHARE + 14, ...SHARE],
  [VHS_AT, ...PARK],
];
const CLICKS = [CLICK_PRINT, CLICK_OK, GRAB, CLICK_GIFT, CLICK_LIKE, CLICK_SHARE];
// while circling the full card, the cursor follows the paint stroke
const PAINT = [FULL + 10, FULL + 44];
const cursorAt = (f: number): [number, number] => {
  if (f >= PAINT[0] && f < PAINT[1]) {
    const t = (f - PAINT[0]) / (PAINT[1] - PAINT[0]);
    const a = t * PAINT_TURNS;
    return [CARD_C[0] + Math.cos(a) * 270 + Math.sin(a * 3) * 8, CARD_C[1] + Math.sin(a) * 250];
  }
  let x = CURSOR[0][1];
  let y = CURSOR[0][2];
  for (let i = 0; i < CURSOR.length - 1; i++) {
    const [f0, x0, y0] = CURSOR[i];
    const [f1, x1, y1] = CURSOR[i + 1];
    if (f >= f0 && f <= f1) {
      const t = EIO((f - f0) / Math.max(1, f1 - f0));
      const arc = Math.hypot(x1 - x0, y1 - y0) > 40 ? Math.sin(t * Math.PI) * 50 : 0;
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - arc];
    }
    if (f > f1) {
      x = x1;
      y = y1;
    }
  }
  return [x, y];
};

const Cursor: React.FC<{ f: number }> = ({ f }) => {
  if (f < S1) return null;
  const [x, y] = cursorAt(f);
  const lastClick = CLICKS.filter((c) => f >= c).pop();
  const rip = lastClick !== undefined ? tw(f, lastClick, lastClick + 14) : 1;
  const busy = f >= CLICK_PRINT + 2 && f < CLICK_OK - 4;
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const [gx, gy] = cursorAt(f - (i + 1) * 2);
        const s = 10 - i;
        return <div key={i} style={{ position: "absolute", left: gx - s / 2 + Math.sin(i * 3 + f / 4) * 4, top: gy - s / 2 + 18 + Math.cos(i * 2 + f / 4) * 4, width: s, height: s, rotate: "45deg", background: ["#FF4FD8", "#FFE600", "#2EB8FF", "#3BD16F"][i % 4], opacity: (1 - i / 8) * 0.9 }} />;
      })}
      <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: "50%", background: "rgba(255,240,0,0.35)" }} />
      {rip < 1 && <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: "50%", border: "5px solid #FF3B3B", scale: `${0.4 + rip * 1.4}`, opacity: 1 - rip }} />}
      {busy ? (
        <svg width={36} height={48} style={{ position: "absolute", left: x - 10, top: y - 6, rotate: `${Math.floor(f / 8) * 180}deg` }} viewBox="0 0 18 24">
          <path d="M2 1 H16 V4 L10 12 L16 20 V23 H2 V20 L8 12 L2 4 Z" fill="#FFFFFF" stroke="#000" strokeWidth={1.5} />
          <path d="M5 21 H13 L9 17 Z" fill="#D9A400" />
        </svg>
      ) : (
        <svg width={40} height={56} style={{ position: "absolute", left: x - 4, top: y - 2 }} viewBox="0 0 20 28">
          <path d="M1 1 L1 22 L6 17 L9.5 25 L13 23.5 L9.5 15.8 L16.5 15.8 Z" fill="#FFFFFF" stroke="#000" strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
};

const Sparkle: React.FC<{ x: number; y: number; s: number; c?: string }> = ({ x, y, s, c = "#FFFFFF" }) => (
  <svg width={s * 2} height={s * 2} style={{ position: "absolute", left: x - s, top: y - s }} viewBox="-10 -10 20 20">
    <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill={c} />
  </svg>
);

// ---------- scenes (window-local coordinates, 980 × 648) ----------
const Title: React.FC<{ f: number }> = ({ f }) => {
  const spin = interpolate(f, [4, bt(2)], [720, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });
  const fly = tw(f, 4, bt(2), 1, 0, EO);
  const sub = tw(f, bt(3), bt(4), 0, 1, BACK);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ translate: `${-fly * 900}px 0`, scale: `${1 + Math.sin(f / 6) * 0.03}` }}>
          <WordArt text="HOW 2 GET" size={130} spin={spin} />
        </div>
        <div style={{ translate: `${fly * 900}px 0` }}>
          <WordArt text="MORE REGULARS" size={130} spin={-spin} fill={GOLD} />
        </div>
        <div style={{ scale: `${sub}`, fontFamily: COMIC, fontWeight: 700, fontSize: 50, color: "#FFFFFF", WebkitTextStroke: "2px #000", textShadow: "3px 3px 0 #000", marginTop: 10 }}>(EASY) (2010) (WORKS 100%)</div>
      </div>
      <div style={{ position: "absolute", right: 60, top: 470, scale: `${tw(f, bt(4), bt(5), 0, 1, BACK)}` }}>
        <Starburst text="NEW" size={190} spin={f * 3} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 490, scale: `${tw(f, bt(5), bt(6), 0, 1, BACK)}`, rotate: "-10deg", fontFamily: IMPACT, fontSize: 52, color: "#FFFFFF", background: "linear-gradient(#FF3B3B, #B00000)", padding: "4px 18px", borderRadius: 10, border: "3px solid #FFF" }}>HD</div>
    </AbsoluteFill>
  );
};

const STEP_LABELS: [number, string, number][] = [
  [1, "PRINT DA POSTER", S1],
  [2, "THEY SCAN IT", S2],
  [3, "STAMP STAMP STAMP", S3],
  [3.5, "???", STEP35],
  [4, "PROFIT", S4],
];
const StepTitle: React.FC<{ f: number }> = ({ f }) => {
  if (f < S1 || f >= OUT) return null;
  const i = STEP_LABELS.filter(([, , s]) => f >= s).length - 1;
  const [n, label, start] = STEP_LABELS[i];
  const end = STEP_LABELS[i + 1]?.[2] ?? OUT;
  const t = f - start;
  const quick = n === 3.5;
  const drop = quick ? 0 : tw(t, 0, 12, -500, 0, BACK);
  const spin = quick ? 0 : interpolate(t, [0, 16], [360, 0], { extrapolateRight: "clamp", easing: EO });
  const lab = quick ? tw(t, 0, 5, 1.6, 1, BACK) : tw(t, 6, 18, 0, 1, BACK);
  const leave = tw(f, end - 8, end, 0, 1, EIO);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 1 - leave, translate: `0 ${-leave * 60}px` }}>
      <div style={{ translate: `0 ${drop}px` }}>
        <WordArt text={`STEP ${n}:`} size={100} spin={spin} />
      </div>
      <div style={{ scale: `${lab}`, rotate: `${Math.sin(f / 5) * 2}deg` }}>
        <WordArt text={label} size={64} fill={n === 4 ? GOLD : CHROME} depth={5} />
      </div>
    </div>
  );
};

const Printer: React.FC<{ f: number }> = ({ f }) => {
  const printed = tw(f, CLICK_OK + 4, CLICK_OK + 36, 0, 1, EO);
  // the recorder zooms toward the button, then all the way back out
  const zoom = 1 + tw(f, S1 + 10, CLICK_PRINT - 2, 0, 0.22, EIO) - tw(f, CLICK_PRINT + 4, CLICK_PRINT + 18, 0, 0.22, EIO);
  const dialog = tw(f, CLICK_PRINT + 2, CLICK_PRINT + 10, 0, 1, BACK) * (1 - tw(f, CLICK_OK + 1, CLICK_OK + 6));
  const pressed = (c: number) => f >= c && f < c + 6;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#EAF4FF, #C7DDF5)" }}>
      <div style={{ position: "absolute", inset: 0, scale: `${zoom}`, transformOrigin: "86% 10%" }}>
        <div style={{ position: "absolute", left: 30, top: 24, right: 30, height: 90, borderRadius: 12, background: "linear-gradient(#FFFFFF, #DCE8F5)", border: "1px solid #9DB7D6", display: "flex", alignItems: "center", gap: 18, padding: "0 20px" }}>
          {["File", "Edit", "View"].map((m) => (
            <span key={m} style={{ fontFamily: "Tahoma, sans-serif", fontSize: 26, color: "#22334A" }}>
              {m}
            </span>
          ))}
          <div style={{ marginLeft: "auto", padding: "12px 34px", borderRadius: 30, background: pressed(CLICK_PRINT) ? "linear-gradient(#2E8B2E, #5FD35F)" : "linear-gradient(#8DF08D 0%, #3DBE3D 50%, #2E9E2E 51%, #6EE06E 100%)", border: "2px solid #1E6B1E", fontFamily: "'Arial Black', sans-serif", fontSize: 30, color: "#FFFFFF", textShadow: "0 2px 0 #1E6B1E", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.7)" }}>PRINT</div>
        </div>
        <div style={{ position: "absolute", left: 360, top: 400 - printed * 250, width: 260, height: 300 * printed, overflow: "hidden" }}>
          <Poster />
        </div>
        <div style={{ position: "absolute", left: 300, top: 360, width: 380, height: 180, borderRadius: 20, background: "linear-gradient(#F4F4F4, #A9B2BB)", border: "3px solid #6D7780", boxShadow: "0 18px 30px rgba(0,0,0,0.25)" }}>
          <div style={{ position: "absolute", left: 40, right: 40, top: 26, height: 12, borderRadius: 6, background: "#2B2B2B" }} />
          <div style={{ position: "absolute", right: 24, bottom: 20, width: 16, height: 16, borderRadius: "50%", background: printed > 0 ? "#3BD16F" : "#999", boxShadow: printed > 0 ? "0 0 12px #3BD16F" : "none" }} />
        </div>
      </div>
      {/* the classic: it hangs on the first click */}
      {dialog > 0.01 && (
        <div style={{ position: "absolute", left: 230, top: 210, width: 520, scale: `${dialog}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", border: "2px solid #3D5A80" }}>
          <div style={{ height: 42, background: "linear-gradient(rgba(190,220,255,1), rgba(120,170,230,1))", fontFamily: "Tahoma, sans-serif", fontSize: 20, color: "#0B2240", display: "flex", alignItems: "center", padding: "0 14px" }}>kembali_tutorial.exe</div>
          <div style={{ background: "#F0F0F0", padding: "22px 26px", display: "flex", gap: 18, alignItems: "center", fontFamily: "Tahoma, sans-serif", fontSize: 24, color: "#111" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #FF8A80, #D32F2F)", color: "#FFF", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 34, flex: "none" }}>×</div>
            <div>
              kembali_tutorial.exe is not responding
              <div style={{ fontSize: 18, color: "#555", marginTop: 4 }}>(it is fine, just click OK)</div>
            </div>
          </div>
          <div style={{ background: "#F0F0F0", padding: "0 26px 20px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ padding: "8px 34px", borderRadius: 6, border: "1px solid #6D7780", background: pressed(CLICK_OK) ? "#BFD7F2" : "linear-gradient(#FFFFFF, #DDE5EC)", fontFamily: "Tahoma, sans-serif", fontSize: 22 }}>OK</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Poster: React.FC = () => (
  <div style={{ width: 260, height: 300, background: C.shopBrown, borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22, boxSizing: "border-box" }}>
    <div style={{ fontFamily: FONT.sans, fontWeight: 800, color: C.sand, fontSize: 24 }}>Corner Coffee</div>
    <div style={{ width: 150, height: 150, background: "#FFF", marginTop: 14, padding: 10, borderRadius: 8 }}>
      <Img src={staticFile("qr.svg")} style={{ width: "100%", height: "100%" }} />
    </div>
    <div style={{ fontFamily: FONT.sans, color: C.sand, fontSize: 18, marginTop: 12, fontWeight: 600 }}>Scan to collect stamps</div>
  </div>
);

const Phone: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", width: 230, height: 440, borderRadius: 34, background: "linear-gradient(135deg, #3A3A3A, #0E0E0E)", padding: "50px 14px", boxSizing: "border-box", boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 3px #555", ...style }}>
    <div style={{ width: "100%", height: "100%", background: "#FFF", borderRadius: 6, overflow: "hidden", position: "relative" }}>{children}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "50%", borderRadius: "34px 34px 0 0", background: "linear-gradient(160deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", left: 95, bottom: 12, width: 40, height: 26, borderRadius: 13, border: "3px solid #555" }} />
  </div>
);

const Scan: React.FC<{ f: number }> = ({ f }) => {
  // the cursor drags the phone over the poster's QR
  const [cx, cy] = cursorAt(f);
  const held = f >= GRAB && f < SCAN + 18;
  const start: [number, number] = [PHONE_GRAB[0] - WIN.x - 115, PHONE_GRAB[1] - CONTENT_Y - 400];
  const px = held ? cx - WIN.x - 115 : f < GRAB ? start[0] : PHONE_DROP[0] - WIN.x - 115;
  const py = held ? cy - CONTENT_Y - 400 : f < GRAB ? start[1] : PHONE_DROP[1] - CONTENT_Y - 400;
  const rot = interpolate(f, [GRAB - 4, GRAB + 4, SCAN + 14, SCAN + 22], [-6, 0, 0, -6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const aim = tw(f, GRAB + 4, SCAN - 4);
  const ok = f >= SCAN;
  const card = f >= SCAN + 8;
  const pop = tw(f, SCAN, SCAN + 12, 0, 1, BACK);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#FFF8E7, #FFE2B0)" }}>
      <div style={{ position: "absolute", left: 120, top: 150, rotate: "-4deg", boxShadow: "0 10px 20px rgba(0,0,0,0.25)" }}>
        <Poster />
      </div>
      <Phone style={{ left: px, top: py, rotate: `${rot}deg` }}>
        {card ? (
          <div style={{ padding: 14, fontFamily: FONT.sans }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Corner Coffee</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: "50%", background: i === 0 ? C.coral : "#EDE6D2", scale: i === 0 ? `${tw(f, SCAN + 8, SCAN + 18, 2, 1, BACK)}` : undefined }} />
              ))}
            </div>
            <div style={{ fontSize: 14, marginTop: 12, color: C.ink2 }}>1 of 9 stamps</div>
          </div>
        ) : (
          // camera viewfinder: the QR comes into frame, brackets turn green on the scan
          <div style={{ position: "absolute", inset: 0, background: "#2A2A2A", display: "grid", placeItems: "center" }}>
            <div style={{ width: 130, height: 130, background: "#FFF", padding: 8, opacity: aim, scale: `${0.7 + aim * 0.3}` }}>
              <Img src={staticFile("qr.svg")} style={{ width: "100%", height: "100%" }} />
            </div>
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{ position: "absolute", left: k % 2 ? undefined : 20, right: k % 2 ? 20 : undefined, top: k < 2 ? 70 : undefined, bottom: k < 2 ? undefined : 70, width: 34, height: 34, borderColor: ok ? "#3BD16F" : "#FFFFFF", borderStyle: "solid", borderWidth: 0, [k < 2 ? "borderTopWidth" : "borderBottomWidth"]: 5, [k % 2 ? "borderRightWidth" : "borderLeftWidth"]: 5 }} />
            ))}
            {ok && <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: 1 - tw(f, SCAN, SCAN + 6) }} />}
          </div>
        )}
      </Phone>
      {pop > 0 && (
        <div style={{ position: "absolute", left: 470, top: 40, scale: `${pop}`, rotate: `${(1 - pop) * 360}deg` }}>
          <WordArt text="+1 STAMP" size={92} fill={GOLD} />
        </div>
      )}
      {pop > 0 && [0, 1, 2, 3, 4].map((i) => <Sparkle key={i} x={520 + i * 80 + Math.sin(f / 3 + i) * 8} y={150 + (i % 2) * 40 + Math.cos(f / 4 + i) * 8} s={14 + (i % 3) * 6} c={["#FFE600", "#FFFFFF", "#FF4FD8"][i % 3]} />)}
    </AbsoluteFill>
  );
};

const Stamps: React.FC<{ f: number }> = ({ f }) => {
  const n = STAMPS.filter((b) => f >= b).length;
  const full = n >= 9;
  const lastHit = n > 0 ? STAMPS[n - 1] : -99;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#FFE9F7, #FFC7EC)" }}>
      <div style={{ position: "absolute", left: 270, top: 30, width: 440, height: 440, borderRadius: 36, background: "#FFFFFF", border: "6px solid #FF4FD8", boxShadow: "0 0 0 8px #FFF200, 0 20px 40px rgba(0,0,0,0.2)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, padding: 30, boxSizing: "border-box" }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const t = f - STAMPS[i];
          const on = t >= 0;
          const spin = on ? interpolate(t, [0, 12], [360, 0], { extrapolateRight: "clamp", easing: EO }) : 0;
          const sc = on ? tw(t, 0, 10, 2.4, 1, BACK) : 1;
          return (
            <div key={i} style={{ borderRadius: "50%", border: "5px dashed #D9C8E8", position: "relative" }}>
              {on && (
                <div style={{ position: "absolute", inset: -5, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #FFB199, ${C.coral} 55%, #A93E24)`, transform: `perspective(400px) rotateY(${spin}deg)`, scale: `${sc}`, display: "grid", placeItems: "center", boxShadow: "0 6px 0 #7A2A16" }}>
                  <Mark size={54} stroke="#FFFFFF" dot={0} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center" }}>
        <div style={{ display: "inline-block", scale: `${1 + (n > 0 ? 0.25 * Math.exp(-(f - lastHit) / 4) : 0)}` }}>
          <WordArt text={full ? "9/9 CARD FULL" : `${n}/9`} size={76} fill={full ? GOLD : RAINBOW} depth={6} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Profit: React.FC<{ f: number }> = ({ f }) => {
  const bounce = f < CLICK_GIFT ? Math.abs(Math.sin((f - S4) / 4.4)) * 26 : 0;
  const lid = tw(f, CLICK_GIFT, CLICK_GIFT + 18, 0, 1, EO);
  const rise = tw(f, CLICK_GIFT + 4, CLICK_GIFT + 22, 0, 1, BACK);
  return (
    <AbsoluteFill>
      <Sunburst f={f} cx={490} cy={360} a="#FFB300" b="#FFE680" />
      <div style={{ position: "absolute", left: 340, top: 330 - bounce, width: 300, height: 240 }}>
        {/* the reward rises out of the box */}
        <div style={{ position: "absolute", left: -40, top: 60 - rise * 230, width: 380, height: 150, opacity: rise > 0 ? 1 : 0, rotate: `${Math.sin(f / 6) * 3}deg`, borderRadius: 16, background: "linear-gradient(180deg, #FFF6B0, #F5C542 50%, #E0A820)", border: "4px solid #000", display: "grid", placeItems: "center", boxShadow: "0 10px 0 #7A5A10" }}>
          <WordArt text="FREE REWARD" size={50} fill={RAINBOW} depth={4} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 60, width: 300, height: 200, background: "linear-gradient(135deg, #FF4FD8, #B0179A)", borderRadius: 12, border: "4px solid #000" }} />
        <div style={{ position: "absolute", left: 130, top: 60, width: 40, height: 200, background: "linear-gradient(#FFF200, #E0B800)", borderLeft: "3px solid #000", borderRight: "3px solid #000" }} />
        <div style={{ position: "absolute", left: -14, top: 20, width: 328, height: 60, background: "linear-gradient(135deg, #FF7AE5, #C21FAB)", borderRadius: 10, border: "4px solid #000", translate: `${lid * 700}px ${-lid * 900}px`, rotate: `${lid * 540}deg` }} />
      </div>
      {rise > 0 && (
        <div style={{ position: "absolute", right: 40, top: 30, scale: `${rise}` }}>
          <Starburst text="WOW" size={170} spin={f * 4} color="#2EB8FF" />
        </div>
      )}
      {rise > 0 && Array.from({ length: 10 }).map((_, i) => <Sparkle key={i} x={490 + Math.cos(i * 0.63 + f / 10) * 260} y={300 + Math.sin(i * 0.63 + f / 10) * 190} s={10 + (i % 3) * 8} c={["#FFFFFF", "#FFE600", "#FF4FD8"][i % 3]} />)}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ f: number }> = ({ f }) => {
  const spin = interpolate(f, [OUT, OUT + 30], [-720, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });
  const pressed = (c: number) => f >= c && f < c + 6;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1B2A6B, #4A1B6B)" }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: rand(i) * 980, top: rand(i + 50) * 650, width: 4, height: 4, borderRadius: "50%", background: "#FFF", opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5 + i)) }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center" }}>
        <WordArt text="THX 4 WATCHING" size={96} spin={spin} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 30 }}>
        {[
          ["LIKE", "#3BD16F", "#1E8B3E", CLICK_LIKE],
          ["SHARE", "#2EB8FF", "#1A6FB0", CLICK_SHARE],
        ].map(([t, a, b2, c], i) => (
          <div key={String(t)} style={{ width: 230, textAlign: "center", padding: "18px 0", borderRadius: 40, background: f >= (c as number) ? `linear-gradient(${b2}, ${a})` : `linear-gradient(${a} 0%, ${b2} 51%, ${a} 100%)`, border: "3px solid #FFF", fontFamily: "'Arial Black', sans-serif", fontSize: 40, color: "#FFF", textShadow: "0 2px 0 rgba(0,0,0,0.4)", scale: `${tw(f, OUT + 10 + i * 4, OUT + 20 + i * 4, 0, 1, BACK) * (pressed(c as number) ? 0.92 : 1)}` }}>
            {f >= (c as number) ? `${t}D` : t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- transitions ----------
const starClip = (t: number) => {
  const r = t * 1600;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${490 + Math.cos(a) * rr}px ${324 + Math.sin(a) * rr}px`;
  });
  return `polygon(${pts.join(", ")})`;
};
const checkerClip = (t: number) => {
  const n = 6;
  const cw = 980 / n;
  const ch = 648 / 4;
  const rects: string[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < 4; j++) {
      const k = Math.max(0, Math.min(1, t * 2 - (i + j) / (n + 4)));
      if (k <= 0) continue;
      const w = cw * k;
      const h = ch * k;
      rects.push(`M${i * cw + (cw - w) / 2} ${j * ch + (ch - h) / 2}h${w}v${h}h${-w}Z`);
    }
  return rects.length ? `path('${rects.join(" ")}')` : "path('M0 0')";
};

const ORDER: [string, number, string][] = [
  ["s1", S1, "star"],
  ["s2", S2, "cube"],
  ["s3", S3, "checker"],
  ["s4", S4, "spin"],
  ["out", OUT, "star"],
];
const TITLES = ["kembali_tutorial_FINAL.wmv", "kembali_tutorial_FINAL.wmv", "kembali_tutorial_FINAL(2).wmv", "kembali_tutorial_FINAL_real.wmv", "kembali_tutorial_FINAL_real.wmv"];
const sceneFor = (key: string, f: number) => {
  switch (key) {
    case "s1":
      return <Printer f={f} />;
    case "s2":
      return <Scan f={f} />;
    case "s3":
      return <Stamps f={f} />;
    case "s4":
      return <Profit f={f} />;
    default:
      return <Outro f={f} />;
  }
};

const SceneSwitch: React.FC<{ f: number }> = ({ f }) => {
  if (f < S1 - 6) return null;
  let i = 0;
  ORDER.forEach(([, s], k) => {
    if (f >= s) i = k;
  });
  const [key, s, kind] = ORDER[i];
  const prev = i > 0 ? ORDER[i - 1] : null;
  const t = tw(f, s, s + TR, 0, 1, EIO);
  const cur = sceneFor(key, f);
  const old = prev && t < 1 ? sceneFor(prev[0], f) : null;
  let body: React.ReactNode;
  if (!old) body = cur;
  else if (kind === "cube")
    body = (
      <div style={{ position: "absolute", inset: 0, perspective: 1600 }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50% -490px", transform: `rotateY(${-t * 90}deg)`, backfaceVisibility: "hidden" }}>{old}</div>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50% -490px", transform: `rotateY(${90 - t * 90}deg)`, backfaceVisibility: "hidden" }}>{cur}</div>
      </div>
    );
  else if (kind === "spin")
    body = (
      <>
        {old}
        <div style={{ position: "absolute", inset: 0, scale: `${t}`, rotate: `${(1 - t) * 360}deg` }}>{cur}</div>
      </>
    );
  else
    body = (
      <>
        {old}
        <div style={{ position: "absolute", inset: 0, clipPath: kind === "star" ? starClip(t) : checkerClip(t) }}>{cur}</div>
      </>
    );
  // the window zooms in from its own centre
  const enter = tw(f, S1 - 6, S1 + 12, 0.15, 1, BACK);
  const shake = CLICKS.some((c) => f >= c && f < c + 3) ? (rand(f * 5) - 0.5) * 10 : 0;
  return (
    <AbsoluteFill style={{ translate: `${shake}px ${shake * 0.5}px`, scale: `${enter}`, transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + WIN.h / 2}px`, opacity: tw(f, S1 - 6, S1 - 2) }}>
      <Window title={TITLES[i]}>
        {body}
        <div style={{ position: "absolute", right: 16, bottom: 12, fontFamily: "Tahoma, sans-serif", fontSize: 22, color: key === "out" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)", fontWeight: 700 }}>UNREGISTERED VERSION</div>
      </Window>
    </AbsoluteFill>
  );
};

// card-full payoff: a red paint circle around the card and confetti that bursts out of the window
const Paint: React.FC<{ f: number }> = ({ f }) => {
  if (f < PAINT[0] || f > S4 + 4) return null;
  const draw = tw(f, PAINT[0], PAINT[1]);
  const path = Array.from({ length: 80 }, (_, i) => {
    const a = (i / 79) * Math.PI * 2.15;
    return `${i ? "L" : "M"}${CARD_C[0] + Math.cos(a) * 270 + Math.sin(a * 3) * 8} ${CARD_C[1] + Math.sin(a) * 250}`;
  }).join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - tw(f, S4 - 4, S4 + 4) }}>
      <path d={path} fill="none" stroke="#FF1A1A" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} opacity={0.9} />
    </svg>
  );
};
const Confetti: React.FC<{ f: number }> = ({ f }) => {
  const t = f - FULL;
  if (t < 0 || t > 70) return null;
  return (
    <>
      {Array.from({ length: 70 }).map((_, i) => {
        const a = rand(i) * Math.PI * 2;
        const v = 14 + rand(i + 3) * 22;
        const x = CARD_C[0] + Math.cos(a) * v * t * Math.exp(-t / 30);
        const y = CARD_C[1] + Math.sin(a) * v * t * Math.exp(-t / 30) + t * t * 0.35;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 10, background: ["#FF3B3B", "#FFE600", "#3BD16F", "#2EB8FF", "#FF4FD8"][i % 5], rotate: `${t * 20 + i * 30}deg`, opacity: 1 - tw(t, 50, 70) }} />;
      })}
    </>
  );
};

const UrDone: React.FC<{ f: number }> = ({ f }) => {
  if (f < OUT || f >= VHS_AT) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", scale: `${tw(f, OUT, OUT + 12, 0, 1, BACK)}` }}>
      <WordArt text="UR DONE" size={110} spin={interpolate(f, [OUT, OUT + 18], [360, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </div>
  );
};

// ---------- the rewind to 2026 ----------
const Static: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <filter id="tv">
      <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves={1} seed={1 + (f % 13)} /* feTurbulence treats seed 0 as 1: frames 806/807 would repeat */ />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 0 1 1" />
        <feFuncG type="discrete" tableValues="0 0 1 1" />
        <feFuncB type="discrete" tableValues="0 0 1 1" />
        <feFuncA type="discrete" tableValues="1" />
      </feComponentTransfer>
    </filter>
    <rect width="100%" height="100%" filter="url(#tv)" />
  </svg>
);

// The parody's punchline rides on the standard card: its mono line is an odometer that
// rolls "NOW IN 2010 QUALITY" over to 2026 once the card has settled.
const Odometer: React.FC<{ f: number }> = ({ f }) => {
  const t = f - END_AT;
  return (
    <span style={{ display: "inline-flex", lineHeight: 1, alignItems: "flex-start" }}>
      <span>NOW IN 20</span>
      {[
        ["1", "2"],
        ["0", "6"],
      ].map(([a, b2], i) => {
        const roll = tw(t, 42 + i * 3, 50 + i * 3, 0, 1, EIO);
        return (
          /* the cell is clipped to the digits' cap-height..baseline box (Plex Mono at line-height 1:
             cap top 0.177em, baseline 0.875em) so the outgoing digit is cut at the text's own top edge */
          <span key={i} style={{ display: "inline-block", height: "calc(0.70em + 1px)", marginTop: "calc(0.175em - 1px)", overflow: "hidden" }}>
            {/* Chrome snaps the clip rect a row below the cap line at 26 px; the 1 px lifts it onto it */}
            <span style={{ display: "block", translate: `0 calc(${-(0.175 + roll)}em + 1px)` }}>
              <span style={{ display: "block", height: "1em" }}>{a}</span>
              <span style={{ display: "block", height: "1em", color: C.coral }}>{b2}</span>
            </span>
          </span>
        );
      })}
      <span>&nbsp;QUALITY</span>
    </span>
  );
};

// ---------- sound ----------
const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={120} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
const SOUND = [
  { at: bt(2), src: "sfx/web/vine-boom.wav", vol: 0.45 },
  ...ORDER.map(([, s]) => ({ at: s, src: "sfx/web/whoosh.wav", vol: 0.45 })),
  ...CLICKS.map((c) => ({ at: c, src: "sfx/web/click-hard.wav", vol: 0.85 })),
  { at: STEP35, src: "sfx/web/vine-boom.wav", vol: 0.3 },
  { at: CLICK_PRINT + 2, src: "sfx/web/record-scratch.wav", vol: 0.35 },
  { at: SCAN, src: "sfx/web/ding-tight.wav", vol: 0.45 },
  ...STAMPS.map((b) => ({ at: b, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.7 })),
  { at: FULL, src: "sfx/web/yippee-tight.wav", vol: 0.5 },
  { at: CLICK_GIFT + 2, src: "sfx/web/anime-wow-tight.wav", vol: 0.4 },
  { at: REW, src: "sfx/web/record-scratch.wav", vol: 0.3 },
  { at: END_AT - 3, src: "sfx/web/static.wav", vol: 0.55 }, // on the frame the snow snaps in
  ...endSfx(END_AT),
  // the same click for both digits (switch3 is louder and later); the file's onset is 1.35
  // frames in, so place it a frame early to click as each digit starts rolling
  { at: END_AT + 43, src: "sfx/ui/switch2.ogg", vol: 0.5 }, // digit 3 starts rolling at +44
  { at: END_AT + 47, src: "sfx/ui/switch2.ogg", vol: 0.5 }, // digit 4 starts rolling at +48
];

const SUBS: [string, number, number][] = [
  ["step 1 is ez", S1 + 8, CLICK_PRINT],
  ["ugh not again", CLICK_PRINT + 4, CLICK_OK],
  ["ok it works now lol", CLICK_OK + 6, S2 - 2],
  ["drag ur phone over it", S2 + 8, SCAN - 2],
  ["no app needed (srsly)", SCAN + 2, S3 - 2],
  ["they keep coming back", S3 + 8, FULL],
  ["u did it", FULL + 2, STEP35 - 2],
  ["wait what is step 3.5", STEP35, S4 + 12],
  ["click the box", S4 + 14, CLICK_GIFT],
  ["free stuff = happy regulars", CLICK_GIFT + 4, OUT - 2],
  ["plz like and share", OUT + 8, VHS_AT - 6],
];

const Bubbles: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 18 }).map((_, i) => {
      const sp = 1 + rand(i) * 2;
      const y = ((((rand(i + 9) * 2100 - f * sp) % 2100) + 2100) % 2100) - 120;
      const d = 40 + rand(i + 3) * 80;
      return <div key={i} style={{ position: "absolute", left: rand(i) * 1080 + Math.sin(f / 30 + i) * 30, top: y, width: d, height: d, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.35)" }} />;
    })}
  </>
);

export const Tutorial: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  // the tape rewinds: from REW the whole 2010 layer plays backwards at 3×
  // the tape stays in rewind (static full on) until the sand disc has covered the frame
  const rew = f >= REW && f < END_AT + 16;
  const rt = f - REW;
  const ef = f < REW ? f : Math.max(0, REW - (3 * rt + (20 * rt * rt) / 24));
  const beatPulse = Math.exp(-((((ef - 5.4) % 14.06) + 14.06) % 14.06) / 3);
  const flare = tw(ef, 0, bt(2)) * (1 - tw(ef, bt(3), bt(6)));
  const jitter = rew ? (rand(f * 7) - 0.5) * 40 : 0;
  const snow = tw(f, END_AT - 4, END_AT - 2);
  return (
    <AbsoluteFill style={{ background: "#2EB8FF", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          scale: `${1 + beatPulse * 0.012}`,
          translate: `${jitter}px ${rew ? (rand(f * 3) - 0.5) * 20 : 0}px`,
          filter: rew ? "drop-shadow(14px 0 0 rgba(255,0,60,0.8)) drop-shadow(-14px 0 0 rgba(0,255,255,0.75)) saturate(1.7)" : undefined,
        }}
      >
        <Sunburst f={ef} cx={540} cy={960} a="#1E90FF" b="#56C8FF" />
        <Bubbles f={ef} />
        {ef < S1 + 6 && (
          <div style={{ opacity: 1 - tw(ef, S1 - 6, S1 + 2) }}>
            <Title f={ef} />
          </div>
        )}
        <SceneSwitch f={ef} />
        <StepTitle f={ef} />
        <UrDone f={ef} />
        <Paint f={ef} />
        <Confetti f={ef} />
        <Cursor f={ef} />
        {SUBS.map(([t, a, b2]) => (
          <Sub key={t} text={t} f={ef} at={a} out={b2} />
        ))}
        <LensFlare x={interpolate(ef, [0, bt(6)], [120, 960])} y={560} o={flare} />
      </AbsoluteFill>
      {rew && (
        <>
          {/* tracking roll, scanlines, and a chunky REW label (kept below the top safe zone);
              none of it is drawn once the card has started */}
          {f < END_AT && <div style={{ position: "absolute", left: 0, right: 0, top: ((f - REW) * 150) % 1920, height: 110, background: "rgba(0,0,0,0.6)" }} />}
          {f < END_AT && <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0 2px, transparent 2px 5px)" }} />}
          {f < END_AT && <div style={{ position: "absolute", left: 70, top: 1290, fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 64, color: "#FFFFFF", textShadow: "3px 3px 0 #000", opacity: Math.floor(f / 6) % 2 ? 1 : 0.35 }}>◀◀ REW</div>}
          {snow > 0 && (
            <AbsoluteFill style={{ opacity: snow }}>
              <Static f={f} />
            </AbsoluteFill>
          )}
        </>
      )}
      <StandardEnd f={f} start={END_AT} mono={<Odometer f={f} />} />
      <Audio src={staticFile("music/candyland.mp3")} trimBefore={12 * 30} volume={(fr) => endDuck(fr, END_AT) * interpolate(fr, [0, 3, TUTORIAL_LEN - 30, TUTORIAL_LEN - 4], [0, 0.75, 0.75, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};
