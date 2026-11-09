import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "./lib";
import { Mark } from "./common";

// Faces land on the beat and the half-beat, alternating, so the cube syncopates.
export const FS = [366, 385, 410, 434, 459, 483];
const SIDE = 820;

const LABELS = [
  "Points on every spend",
  "Friends bring friends",
  "Your busiest hours",
  "Every outlet, one view",
  "Your shop's colours",
  "Your data, on every plan",
];

const faceBase: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: 60,
  padding: 64,
  overflow: "hidden",
  fontFamily: FONT.sans,
  color: C.ink,
};

const Kicker: React.FC<{ n: number; children: React.ReactNode; color?: string }> = ({ n, children, color = C.ink2 }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 24, letterSpacing: "0.2em", color }}>
    <span>{children}</span>
    <span>0{n + 1} / 06</span>
  </div>
);

const PointsFace: React.FC<{ t: number }> = ({ t }) => {
  const n = Math.round(tw(t, 4, 24, 0, 124, EO));
  const bar = tw(t, 8, 30, 1116 / 1500, 1240 / 1500, EO);
  return (
    <div style={{ ...faceBase, background: C.sand }}>
      <Kicker n={0}>POINTS</Kicker>
      <div style={{ marginTop: 70, fontFamily: FONT.display, fontSize: 300, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 0.9, color: C.coral }}>
        +{n}
      </div>
      <div style={{ fontSize: 44, fontWeight: 600, marginTop: 18 }}>points for RM 12.40</div>
      <div style={{ marginTop: 70, height: 26, borderRadius: 99, background: C.sandAlt, overflow: "hidden" }}>
        <div style={{ width: `${bar * 100}%`, height: "100%", background: C.leaf, borderRadius: 99 }} />
      </div>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", fontSize: 32, color: C.ink2 }}>
        <span>{Math.round(bar * 1500).toLocaleString("en-US")} pts</span>
        <span>Croissant at 1,500</span>
      </div>
    </div>
  );
};

const ReferralFace: React.FC<{ t: number }> = ({ t }) => {
  const draw = tw(t, 6, 22, 0, 1, EIO);
  const pop1 = tw(t, 20, 28, 0, 1, BACK);
  const pop2 = tw(t, 23, 31, 0, 1, BACK);
  const P0 = [220, 330], P1 = [410, -10], P2 = [600, 330];
  const q = (a: number, b: number, c: number) => (1 - draw) ** 2 * a + 2 * (1 - draw) * draw * b + draw ** 2 * c;
  const Av: React.FC<{ l: string; bg: string; x: number; pop: number }> = ({ l, bg, x, pop }) => (
    <div style={{ position: "absolute", left: x - 110, top: 245, width: 220, textAlign: "center" }}>
      <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: "50%", background: bg, color: C.sand, display: "grid", placeItems: "center", fontFamily: FONT.display, fontSize: 90, boxShadow: `0 0 0 10px ${C.white}` }}>
        {l}
      </div>
      <div
        style={{
          marginTop: 22,
          display: "inline-block",
          padding: "10px 22px",
          borderRadius: 99,
          background: C.coral,
          color: C.white,
          fontWeight: 700,
          fontSize: 30,
          scale: `${pop}`,
          opacity: pop > 0 ? 1 : 0,
        }}
      >
        +1 coffee
      </div>
    </div>
  );
  return (
    <div style={{ ...faceBase, background: C.white }}>
      <Kicker n={1}>REFERRALS</Kicker>
      <svg width={SIDE} height={SIDE} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`}
          fill="none"
          stroke={C.pandan}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${draw} 1`}
          opacity={0.85}
        />
      </svg>
      {draw > 0 && draw < 1 && (
        <div style={{ position: "absolute", left: q(P0[0], P1[0], P2[0]) - 20, top: q(P0[1], P1[1], P2[1]) - 20, width: 40, height: 40, borderRadius: "50%", background: C.coral, boxShadow: "0 0 30px rgba(224,104,75,0.8)" }} />
      )}
      <Av l="A" bg={C.pandan} x={220} pop={pop1} />
      <Av l="M" bg={C.shopBrown} x={600} pop={pop2} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 64, textAlign: "center", fontSize: 36, color: C.ink2 }}>
        Aisyah invited Ming Wei. <b style={{ color: C.ink }}>Both earn.</b>
      </div>
    </div>
  );
};

const ReportsFace: React.FC<{ t: number }> = ({ t }) => {
  const vals = [0.42, 0.55, 0.48, 0.63, 0.78, 1, 0.7];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const tip = tw(t, 22, 30, 0, 1, BACK);
  return (
    <div style={{ ...faceBase, background: C.sand }}>
      <Kicker n={2}>REPORTS</Kicker>
      <div style={{ fontSize: 40, fontWeight: 600, marginTop: 40 }}>Stamps this week</div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 110, height: 430, display: "flex", alignItems: "flex-end", gap: 22 }}>
        {vals.map((v, i) => {
          const g = tw(t, 4 + i * 2, 18 + i * 2, 0, 1, BACK);
          return (
            <div key={i} style={{ flex: 1, height: `${v * 100 * g}%`, background: i === 5 ? C.coral : C.pandan, borderRadius: 16, position: "relative" }}>
              {i === 5 && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "100%",
                    marginBottom: 18,
                    translate: "-50% 0",
                    scale: `${tip}`,
                    transformOrigin: "50% 100%",
                    background: C.ink,
                    color: C.sand,
                    fontSize: 28,
                    fontWeight: 600,
                    padding: "12px 20px",
                    borderRadius: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sat 10am · 48
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 50, display: "flex", gap: 22 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: FONT.mono, fontSize: 26, color: C.ink2 }}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

const OutletsFace: React.FC<{ t: number }> = ({ t }) => {
  const pins = [
    { x: 210, y: 330, n: "Bangsar", d: 4 },
    { x: 540, y: 250, n: "Mont Kiara", d: 9 },
    { x: 430, y: 560, n: "SS2", d: 14 },
  ];
  return (
    <div style={{ ...faceBase, background: "#DDE8D3" }}>
      {/* street grid */}
      <svg width={SIDE} height={SIDE} style={{ position: "absolute", inset: 0 }}>
        {[120, 300, 470, 650].map((y, i) => (
          <line key={`h${i}`} x1={0} x2={SIDE} y1={y + i * 8} y2={y - i * 20} stroke={C.white} strokeWidth={i % 2 ? 26 : 14} />
        ))}
        {[160, 380, 610].map((x, i) => (
          <line key={`v${i}`} x1={x} x2={x + 90 - i * 50} y1={0} y2={SIDE} stroke={C.white} strokeWidth={i === 1 ? 30 : 16} />
        ))}
        <path d="M0 720 C 200 640, 420 800, 820 690 L 820 820 L 0 820 Z" fill="#B9D3E0" />
      </svg>
      <div style={{ position: "relative" }}>
        <Kicker n={3}>OUTLETS</Kicker>
      </div>
      {pins.map((p) => {
        const drop = tw(t, p.d, p.d + 8, 0, 1, EI);
        const bounce = tw(t, p.d + 8, p.d + 16, 0.7, 1, BACK);
        const rip = tw(t, p.d + 8, p.d + 24);
        return (
          <div key={p.n} style={{ position: "absolute", left: p.x, top: p.y }}>
            <div style={{ position: "absolute", left: -50, top: -20, width: 100, height: 40, borderRadius: "50%", border: `4px solid ${C.coral}`, scale: `${1 + rip * 1.6}`, opacity: rip > 0 && rip < 1 ? 1 - rip : 0 }} />
            <div style={{ position: "absolute", left: -38, top: -100, translate: `0 ${(1 - drop) * -500}px`, opacity: drop > 0 ? 1 : 0, scale: `1 ${drop < 1 ? 1.15 : bounce}`, transformOrigin: "50% 100%" }}>
              <svg width={76} height={100} viewBox="0 0 76 100">
                <path d="M38 98 C 38 98 4 56 4 36 A34 34 0 0 1 72 36 C 72 56 38 98 38 98 Z" fill={C.coral} />
                <circle cx={38} cy={36} r={13} fill={C.sand} />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                left: 48,
                top: -86,
                padding: "8px 16px",
                background: C.white,
                borderRadius: 12,
                fontSize: 26,
                fontWeight: 600,
                whiteSpace: "nowrap",
                opacity: tw(t, p.d + 10, p.d + 16),
                translate: `${tw(t, p.d + 10, p.d + 18, -14, 0)}px 0`,
              }}
            >
              {p.n}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 56,
          background: C.pandan,
          color: C.sand,
          borderRadius: 20,
          padding: "22px 28px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 32,
          fontWeight: 600,
          translate: `0 ${tw(t, 12, 24, 160, 0)}px`,
        }}
      >
        <span>3 outlets</span>
        <span style={{ color: C.leaf }}>1 dashboard</span>
      </div>
    </div>
  );
};

const THEMES = [
  { name: "Corner Coffee", stamp: C.shopStamp, primary: C.shopBrown, bg: "#FBF6EC" },
  { name: "Bloom Bakery", stamp: "#E27396", primary: "#7A2E4A", bg: "#FCF1F4" },
  { name: "Tide Car Wash", stamp: "#3A9BD9", primary: "#12436B", bg: "#EEF6FB" },
];

const ColoursFace: React.FC<{ t: number }> = ({ t }) => {
  const p = tw(t, 6, 14, 0, 1, EIO) + tw(t, 16, 24, 0, 1, EIO);
  const idx = Math.min(2, Math.floor(p + 0.5));
  const col = (k: "stamp" | "primary" | "bg") => interpolateColors(p, [0, 1, 2], THEMES.map((x) => x[k]));
  return (
    <div style={{ ...faceBase, background: col("bg") }}>
      <Kicker n={4}>THEMES</Kicker>
      <div
        style={{
          margin: "56px auto 0",
          width: 600,
          background: C.white,
          borderRadius: 32,
          padding: 40,
          boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
          rotate: `${Math.sin(p * Math.PI) * 3}deg`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: col("primary"), display: "grid", placeItems: "center" }}>
            <Mark size={44} stroke={C.white} dot={0} />
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{THEMES[idx].name}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 76px)", justifyContent: "space-between", rowGap: 22, marginTop: 34 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 76, height: 76, borderRadius: "50%", background: i < 6 ? col("stamp") : C.sandAlt, border: i < 6 ? "none" : `3px dashed ${C.border}` }} />
          ))}
        </div>
        <div style={{ marginTop: 34, height: 80, borderRadius: 18, background: col("primary"), color: C.white, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 600 }}>
          Show my QR
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 50 }}>
        {THEMES.map((th, i) => (
          <div key={th.name} style={{ width: 64, height: 64, borderRadius: "50%", background: th.stamp, boxShadow: i === idx ? `0 0 0 6px ${C.white}, 0 0 0 10px ${th.primary}` : "none" }} />
        ))}
      </div>
    </div>
  );
};

const ExportFace: React.FC<{ t: number }> = ({ t }) => {
  const rows = [
    ["Aisyah R.", "9", "1,240"],
    ["Ming Wei", "4", "380"],
    ["Priya K.", "7", "910"],
    ["Daniel T.", "2", "120"],
    ["Farah Z.", "6", "655"],
  ];
  const chip = tw(t, 16, 26, 0, 1, BACK);
  return (
    <div style={{ ...faceBase, background: C.sand }}>
      <Kicker n={5}>PDPA EXPORT</Kicker>
      <div style={{ marginTop: 40, background: C.white, borderRadius: 24, border: `2px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "18px 28px", fontFamily: FONT.mono, fontSize: 22, letterSpacing: "0.12em", color: C.muted, background: C.sandAlt }}>
          <span style={{ flex: 2 }}>CUSTOMER</span>
          <span style={{ flex: 1, textAlign: "right" }}>STAMPS</span>
          <span style={{ flex: 1, textAlign: "right" }}>POINTS</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r[0]}
            style={{
              display: "flex",
              padding: "18px 28px",
              fontSize: 30,
              borderTop: `1px solid ${C.sandAlt}`,
              opacity: tw(t, 2 + i * 2, 8 + i * 2),
              translate: `${tw(t, 2 + i * 2, 10 + i * 2, 80, 0)}px 0`,
            }}
          >
            <span style={{ flex: 2, fontWeight: 600 }}>{r[0]}</span>
            <span style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r[1]}</span>
            <span style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r[2]}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 64,
          bottom: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: C.pandan,
          color: C.sand,
          padding: "20px 30px",
          borderRadius: 20,
          fontSize: 32,
          fontWeight: 600,
          scale: `${chip}`,
          rotate: `${(1 - chip) * -10 + 3}deg`,
        }}
      >
        <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={C.leaf} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M6 11l6 6 6-6M4 21h16" />
        </svg>
        customers.csv
      </div>
    </div>
  );
};

const FACES = [PointsFace, ReferralFace, ReportsFace, OutletsFace, ColoursFace, ExportFace];

export const Features: React.FC<{ f: number }> = ({ f }) => {
  if (f < 352 || f > 520) return null;
  // cube progress: one quarter turn per face, landing exactly on its frame
  let p = 0;
  for (let i = 1; i < FS.length; i++) p += tw(f, FS[i] - 11, FS[i], 0, 1, EIO);
  // small overshoot settle after each turn
  let wob = 0;
  for (let i = 1; i < FS.length; i++) {
    const d = f - FS[i];
    if (d >= 0 && d < 14) wob += Math.exp(-d / 3) * Math.sin(d * 1.1) * 4;
  }

  // pull the cube back mid-turn so its rolling edge never climbs into the label
  const dip = Math.sin((p % 1) * Math.PI) * 0.22;
  const enter = tw(f, 352, 368, 0, 1, EO);
  const enterV = tw(f, 354, 368, 0, 1, EO) - tw(f, 352, 366, 0, 1, EO);
  const exit = tw(f, 492, 504, 0, 1, EI); // the cube must be inside the end card's disc by 503 (r 555)

  return (
    <AbsoluteFill style={{ translate: `0 ${(1 - enter) * 1800}px`, filter: `blur(${Math.abs(enterV) * 90}px)` }}>
      {/* label slot machine */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 432, textAlign: "center", fontFamily: FONT.mono, fontSize: 26, letterSpacing: "0.3em", color: C.mist, opacity: 1 - exit }}>
        ONE CARD DOES IT ALL
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 478,
          height: 118,
          overflow: "hidden",
          opacity: 1 - exit,
          maskImage: "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
        }}
      >
        <div style={{ translate: `0 ${-p * 118}px` }}>
          {LABELS.map((l, i) => (
            <div
              key={l}
              style={{
                height: 118,
                lineHeight: "118px",
                textAlign: "center",
                fontFamily: FONT.display,
                fontSize: 82,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: C.sand,
                whiteSpace: "nowrap",
                opacity: 1 - Math.min(1, Math.abs(i - p) * 0.9),
              }}
            >
              {l.split(" ").map((w, j, arr) =>
                j === arr.length - 1 ? (
                  <span key={j} style={{ fontStyle: "italic", fontWeight: 400, color: C.coral }}>
                    {w}
                  </span>
                ) : (
                  <span key={j}>{w} </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* cube */}
      <div
        style={{
          position: "absolute",
          left: (1080 - SIDE) / 2,
          top: 650,
          width: SIDE,
          height: SIDE,
          perspective: 2600,
          transformOrigin: `50% ${773 - 650}px`, // shrink towards the disc's centre so the corners never poke out of it
          scale: `${(1 - exit * 0.9) * (1 - dip)}`, // the end card's disc covers it; no opacity fade (it read as a one-frame ghost)
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${Math.sin(f / 24) * 7}deg) rotateX(${wob}deg)` }}>
          {FACES.map((Face, i) => {
            const ang = (i - p) * 90;
            if (Math.abs(ang) > 92) return null;
            const t = f - (FS[i] - 12);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  transform: `translateZ(${-SIDE / 2}px) rotateX(${-ang}deg) translateZ(${SIDE / 2}px)`,
                  boxShadow: "0 50px 100px rgba(0,0,0,0.4)",
                  borderRadius: 60,
                }}
              >
                <Face t={t} />
                <div style={{ position: "absolute", inset: 0, borderRadius: 60, background: "#04140F", opacity: Math.min(0.7, Math.abs(ang) / 90 * 0.8) }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* sparks on each landing */}
      {FS.slice(1).map((s) =>
        Array.from({ length: 10 }).map((_, k) => {
          const tt = tw(f, s, s + 14);
          if (tt <= 0 || tt >= 1) return null;
          const side = k % 2 ? 1 : -1;
          return (
            <div
              key={`${s}-${k}`}
              style={{
                position: "absolute",
                left: 540 + side * (SIDE / 2 + 10 + tt * (60 + rand(k + s) * 90)),
                top: 700 + rand(k * 7 + s) * 700,
                width: 30 + rand(k) * 40,
                height: 5,
                borderRadius: 4,
                background: k % 3 ? C.leaf : C.coral,
                opacity: 1 - tt,
                rotate: `${side * (rand(k + 2) * 40 - 20)}deg`,
              }}
            />
          );
        }),
      )}
    </AbsoluteFill>
  );
};
