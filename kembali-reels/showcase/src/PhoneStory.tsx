import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, tw, EO, EI, EIO, BACK, rand, kick } from "./lib";
import { Line, Em, Mark, displayText } from "./common";

// Stamp beats: stamps 4 → 9 land on the music.
export const HITS = [180, 197, 213, 229, 246, 262];
const START_STAMPS = 3;
const K = 492 / 390; // app authored at the real 390px viewport

const Header: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "46px 24px 0" }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: C.shopBrown, display: "grid", placeItems: "center" }}>
      <Mark size={24} stroke={C.sand} />
    </div>
    <div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Corner Coffee</div>
      <div style={{ fontSize: 12, color: C.ink2 }}>Aisyah Rahman</div>
    </div>
    <div style={{ marginLeft: "auto", fontSize: 12, color: C.muted, fontWeight: 500 }}>1,240 pts</div>
  </div>
);

const QrView: React.FC<{ f: number }> = ({ f }) => {
  const br = tw(f, 104, 114, 1.25, 1, BACK);
  const bo = tw(f, 104, 110);
  const laser = tw(f, 114, 146, 0, 1, EIO);
  const lo = tw(f, 112, 116) * (1 - tw(f, 144, 148));
  const brk = (r: number): React.CSSProperties => ({
    position: "absolute",
    width: 46,
    height: 46,
    borderColor: C.leaf,
    borderStyle: "solid",
    borderWidth: 0,
    rotate: `${r}deg`,
  });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Header />
      <div style={{ textAlign: "center", marginTop: 34, fontSize: 21, fontWeight: 600 }}>Show this at the counter</div>
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 13, color: C.ink2 }}>Your cashier scans it to add a stamp</div>
      <div
        style={{
          position: "relative",
          margin: "22px auto 0",
          width: 300,
          height: 300,
          background: C.white,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          padding: 22,
        }}
      >
        <Img src={staticFile("qr.svg")} style={{ width: 256, height: 256 }} />
        {/* scanner brackets */}
        <div style={{ position: "absolute", inset: -14, opacity: bo, scale: `${br}` }}>
          <div style={{ ...brk(0), left: 0, top: 0, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: 18 }} />
          <div style={{ ...brk(0), right: 0, top: 0, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: 18 }} />
          <div style={{ ...brk(0), left: 0, bottom: 0, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: 18 }} />
          <div style={{ ...brk(0), right: 0, bottom: 0, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: 18 }} />
        </div>
        {/* laser */}
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            top: 10 + laser * 270,
            height: 4,
            borderRadius: 4,
            background: C.leaf,
            boxShadow: `0 0 18px 6px rgba(127,176,105,0.7)`,
            opacity: lo,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            top: 12,
            height: laser * 270,
            background: "linear-gradient(to bottom, rgba(127,176,105,0), rgba(127,176,105,0.28))",
            opacity: lo,
          }}
        />
      </div>
      <div style={{ textAlign: "center", marginTop: 22, fontFamily: FONT.mono, fontSize: 13, letterSpacing: "0.12em", color: C.muted }}>
        CODE REFRESHES AUTOMATICALLY
      </div>
      <div
        style={{
          margin: "26px 16px 0",
          padding: 18,
          background: C.white,
          border: "1px solid #E6DFCB",
          borderRadius: 16,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <span>Coffee Card</span>
        <span style={{ color: C.muted, fontWeight: 500 }}>3/9</span>
      </div>
    </div>
  );
};

const CardView: React.FC<{ f: number }> = ({ f }) => {
  const landed = HITS.filter((h) => f >= h).length;
  const count = START_STAMPS + landed;
  // bar eases between counts
  let prog = START_STAMPS;
  HITS.forEach((h) => (prog += tw(f, h, h + 10, 0, 1, EO)));
  const full = count >= 9;
  const glow = tw(f, 262, 272);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Header />
      <div
        style={{
          margin: "18px 16px 0",
          padding: "22px 22px 20px",
          background: C.white,
          border: `${full ? 2 : 1}px solid ${full ? C.shopStamp : "#E6DFCB"}`,
          borderRadius: 16,
          boxShadow: `0 0 ${glow * 40}px ${glow * 6}px rgba(217,138,43,${0.35 * glow})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <b style={{ fontSize: 15, fontWeight: 600 }}>Coffee Card</b>
          <span style={{ fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{count}/9</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 44px)",
            justifyContent: "space-between",
            rowGap: 14,
            marginTop: 18,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const h = i >= START_STAMPS ? HITS[i - START_STAMPS] : -100;
            const s = h < 0 ? 1 : tw(f, h - 5, h, 2.8, 1, EI) + kick(f, h, 0.22, 12);
            const o = h < 0 ? 1 : tw(f, h - 5, h - 1);
            const ring = h < 0 ? 0 : tw(f, h, h + 16);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `2px dashed ${C.border}`,
                  background: C.sandAlt,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: "50%",
                    background: C.shopStamp,
                    opacity: o,
                    scale: `${s}`,
                    rotate: `${h < 0 ? 0 : tw(f, h - 5, h, -40, 0)}deg`,
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.35)",
                  }}
                >
                  <Mark size={26} stroke={C.white} dot={0} />
                </div>
                {ring > 0 && ring < 1 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: -2,
                      borderRadius: "50%",
                      border: `3px solid ${C.shopStamp}`,
                      scale: `${1 + ring * 1.8}`,
                      opacity: 1 - ring,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height: 8, borderRadius: 99, background: C.sandAlt, marginTop: 22, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(prog / 9) * 100}%`, borderRadius: 99, background: C.shopBrown }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: C.ink2, height: 20 }}>
          {full ? (
            <span style={{ color: "#B5651D", fontWeight: 600 }}>Free coffee of your choice, ready to redeem</span>
          ) : (
            <>
              <b style={{ color: C.ink }}>{9 - count}</b> more {9 - count === 1 ? "stamp" : "stamps"} to free coffee of your choice
            </>
          )}
        </div>
        <div
          style={{
            marginTop: 18,
            height: 48,
            borderRadius: 12,
            background: C.shopBrown,
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            display: "grid",
            placeItems: "center",
          }}
        >
          {full ? "Redeem free coffee" : "Show my QR"}
        </div>
      </div>
      <div style={{ padding: "22px 20px 0", fontSize: 15, fontWeight: 600 }}>Rewards</div>
      {[
        ["☕", "Free coffee of your choice", "9 stamps"],
        ["🥐", "Butter croissant", "300 pts"],
        ["🧁", "Any cake slice", "600 pts"],
      ].map(([ic, t, p]) => (
        <div
          key={t}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "10px 16px 0",
            padding: "10px 12px",
            border: "1px solid #E6DFCB",
            borderRadius: 12,
            background: C.white,
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.sandAlt, display: "grid", placeItems: "center", fontSize: 18 }}>
            {ic}
          </div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t}</div>
          <div style={{ fontSize: 12, fontWeight: 700, background: C.sandAlt, borderRadius: 99, padding: "5px 10px" }}>{p}</div>
        </div>
      ))}
    </div>
  );
};

// Confetti burst when the card fills.
const Burst: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const t = f - at;
  if (t < 0 || t > 50) return null;
  const cols = [C.coral, C.shopStamp, C.leaf, C.sand, "#F2B84B"];
  return (
    <>
      {Array.from({ length: 56 }).map((_, i) => {
        const a = rand(i) * Math.PI * 2;
        const v = 16 + rand(i + 50) * 30;
        const dx = Math.cos(a) * v * t * Math.exp(-t / 22) * 1.6;
        const dy = Math.sin(a) * v * t * Math.exp(-t / 22) * 1.6 + 0.5 * t * t * 0.9;
        const sz = 12 + rand(i + 3) * 22;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + dx - sz / 2,
              top: y + dy - sz / 2,
              width: sz,
              height: i % 3 === 0 ? sz * 0.45 : sz,
              borderRadius: i % 3 === 0 ? 3 : "50%",
              background: cols[i % cols.length],
              rotate: `${t * (8 + rand(i) * 20)}deg`,
              opacity: 1 - tw(f, at + 30, at + 50),
            }}
          />
        );
      })}
    </>
  );
};

const CODE = "KMB-7Q4M-2XLP";
const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const Coupon: React.FC<{ f: number }> = ({ f }) => {
  const enter = tw(f, 280, 304, 0, 1, EO);
  const slam = 342;
  const sh = kick(f, slam, 10, 16);
  const code = CODE.split("")
    .map((ch, i) => {
      if (ch === "-") return ch;
      const settle = 300 + i * 2;
      if (f >= settle) return ch;
      if (f < 292) return "·";
      return GLYPHS[Math.floor(rand(i * 31 + Math.floor(f / 2)) * GLYPHS.length)];
    })
    .join("");
  const secs = 15 * 60 - Math.max(0, Math.floor((f - 300) / 30));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const ss_ = tw(f, slam - 6, slam, 3, 1, EI);
  const so = tw(f, slam - 6, slam - 2);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 600,
        width: 880,
        height: 470,
        translate: `${sh}px ${(1 - enter) * 700 + sh * 0.5}px`,
        rotate: `${(1 - enter) * 10 - 3}deg`,
        opacity: tw(f, 280, 286),
        display: "flex",
        filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.45))",
      }}
    >
      <div
        style={{
          flex: 1,
          background: C.sand,
          borderRadius: "28px 0 0 28px",
          padding: "40px 46px",
          position: "relative",
          color: C.ink,
          WebkitMaskImage: "radial-gradient(circle at 100% 0, transparent 22px, black 23px), radial-gradient(circle at 100% 100%, transparent 22px, black 23px)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: "0.22em", color: C.ink2 }}>CORNER COFFEE · REWARD</div>
        <div style={{ fontFamily: FONT.display, fontSize: 92, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 20 }}>
          Free coffee
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 30, color: C.ink2, marginTop: 8 }}>of your choice</div>
        <div
          style={{
            marginTop: 30,
            display: "inline-block",
            fontFamily: FONT.mono,
            fontSize: 46,
            letterSpacing: "0.06em",
            padding: "12px 22px",
            borderRadius: 14,
            border: `2px dashed ${C.border}`,
            background: C.white,
          }}
        >
          {code}
        </div>
        <div style={{ marginTop: 18, fontFamily: FONT.mono, fontSize: 22, color: C.coralDeep, letterSpacing: "0.08em" }}>
          SINGLE USE · VALID {mm}:{ss}
        </div>
        {/* staff confirms: ink stamp slam */}
        <div
          style={{
            position: "absolute",
            right: 20,
            top: 70,
            width: 270,
            height: 270,
            borderRadius: "50%",
            border: `9px solid ${C.coralDeep}`,
            boxShadow: `inset 0 0 0 8px ${C.sand}, inset 0 0 0 12px ${C.coralDeep}`,
            display: "grid",
            placeItems: "center",
            rotate: "-16deg",
            scale: `${ss_}`,
            opacity: so * 0.9,
            color: C.coralDeep,
            fontFamily: FONT.mono,
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textAlign: "center",
            lineHeight: 1.3,
            mixBlendMode: "multiply",
          }}
        >
          <div>
            REDEEMED
            <div style={{ fontSize: 18, letterSpacing: "0.2em" }}>POINTS SETTLED</div>
          </div>
        </div>
      </div>
      <div
        style={{
          width: 230,
          background: C.coral,
          borderRadius: "0 28px 28px 0",
          borderLeft: `4px dashed rgba(246,241,227,0.7)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Mark size={120} stroke={C.sand} style={{ rotate: `${tw(f, 284, 320, -200, 0)}deg` }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: "0.2em", color: C.sand }}>9 OF 9</div>
      </div>
    </div>
  );
};

export const PhoneStory: React.FC<{ f: number }> = ({ f }) => {
  if (f < 60 || f > 372) return null;

  // phone choreography
  const rise = tw(f, 64, 98, 0, 1, EO);
  const zoom = tw(f, 150, 172, 0, 1, EIO);
  const out = tw(f, 266, 296, 0, 1, EIO);
  const scale = 1 + zoom * 0.25 - out * (1.25 - 0.74);
  const ty = (1 - rise) * 1300 + zoom * 120 + out * 420;
  let shake = 0;
  HITS.forEach((h) => (shake += kick(f, h, 7, 12)));

  // whip to the next scene
  const whip = tw(f, 350, 366, 0, 1, EI);
  const whipV = tw(f, 352, 366, 0, 1, EI) - tw(f, 350, 364, 0, 1, EI);

  const flash = tw(f, 146, 148) * (1 - tw(f, 148, 160));
  const qrO = 1 - tw(f, 147, 150);

  return (
    <AbsoluteFill style={{ translate: `0 ${-whip * 2200}px`, filter: `blur(${Math.abs(whipV) * 120}px)` }}>
      {/* captions */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 430, textAlign: "center" }}>
        <div style={{ ...displayText(116), position: "absolute", left: 0, right: 0, top: 0 }}>
          <Line f={f} inAt={102} outAt={168}>
            Scan.
          </Line>
        </div>
        <div style={{ ...displayText(116), position: "absolute", left: 0, right: 0, top: 0 }}>
          <Line f={f} inAt={174} outAt={256}>
            Stamp.
          </Line>
        </div>
        <div style={{ ...displayText(94), position: "absolute", left: 0, right: 0, top: 10 }}>
          <Line f={f} inAt={266}>
            Free coffee, <Em>earned.</Em>
          </Line>
        </div>
      </div>

      <Coupon f={f} />

      {/* phone */}
      <div
        style={{
          position: "absolute",
          left: 280,
          top: 600,
          width: 520,
          height: 1080,
          perspective: 1800,
          translate: `${shake}px ${ty + shake * 0.4}px`,
        }}
      >
        <div
          style={{
            width: 520,
            height: 1080,
            borderRadius: 70,
            background: "#0B1712",
            padding: 14,
            boxShadow: "0 60px 120px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)",
            rotate: `${(1 - rise) * -8}deg`,
            transform: `rotateX(${(1 - rise) * 38}deg)`,
            scale: `${scale}`,
            transformOrigin: `260px ${14 + 225 * K}px`,
          }}
        >
          <div style={{ width: 492, height: 1052, borderRadius: 56, overflow: "hidden", position: "relative", background: C.sand }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 390,
                height: 834,
                scale: `${K}`,
                transformOrigin: "0 0",
                fontFamily: FONT.sans,
                color: C.ink,
                background: C.sand,
              }}
            >
              <div style={{ position: "absolute", inset: 0, opacity: 1 - qrO }}>
                <CardView f={f} />
              </div>
              {qrO > 0 && (
                <div style={{ position: "absolute", inset: 0, opacity: qrO, scale: `${1 + tw(f, 146, 152, 0, 0.15)}` }}>
                  <QrView f={f} />
                </div>
              )}
            </div>
            {/* dynamic island */}
            <div style={{ position: "absolute", left: 186, top: 14, width: 120, height: 34, borderRadius: 20, background: "#0B1712" }} />
            <div style={{ position: "absolute", inset: 0, background: C.white, opacity: flash }} />
          </div>
        </div>
      </div>

      <AbsoluteFill style={{ background: C.white, opacity: flash * 0.35, pointerEvents: "none" }} />
      <Burst f={f} at={264} x={540} y={1018} />
    </AbsoluteFill>
  );
};
