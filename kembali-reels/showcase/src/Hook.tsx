import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, tw, EO, EI, BACK, rand } from "./lib";
import { Line, Em, displayText } from "./common";

// A worn paper stamp card, the thing Kembali replaces.
const PaperCard: React.FC<{ tint: string; stamps: number; name: string }> = ({ tint, stamps, name }) => (
  <div
    style={{
      width: 600,
      height: 350,
      borderRadius: 18,
      background: tint,
      boxShadow: "0 30px 60px rgba(0,0,0,0.35), inset 0 0 60px rgba(120,90,50,0.18)",
      padding: "34px 40px",
      fontFamily: FONT.display,
      color: "#4A3526",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>{name}</div>
    <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: "0.2em", marginTop: 6, opacity: 0.7 }}>
      BUY 9, GET 1 FREE
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 76px)", gap: "18px 26px", marginTop: 34 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            border: "3px dashed rgba(74,53,38,0.35)",
            position: "relative",
          }}
        >
          {i < stamps && (
            <div
              style={{
                position: "absolute",
                inset: 6,
                borderRadius: "50%",
                border: "5px solid rgba(169,62,36,0.75)",
                rotate: `${rand(i + stamps) * 60 - 30}deg`,
                opacity: 0.6 + rand(i * 3) * 0.4,
                display: "grid",
                placeItems: "center",
                fontFamily: FONT.mono,
                fontSize: 14,
                color: "rgba(169,62,36,0.8)",
              }}
            >
              ✓
            </div>
          )}
        </div>
      ))}
    </div>
    {/* coffee ring stain */}
    <div
      style={{
        position: "absolute",
        right: -40,
        top: -50,
        width: 220,
        height: 220,
        borderRadius: "50%",
        border: "10px solid rgba(120,80,40,0.16)",
      }}
    />
  </div>
);

const CARDS = [
  { tint: "#EFE3C8", stamps: 4, name: "Coffee card", land: 8, x: -30, y: -40, r: -11, gone: 44 },
  { tint: "#F3E9D4", stamps: 7, name: "Bakery card", land: 14, x: 40, y: 60, r: 8, gone: 48 },
  { tint: "#E9DCC0", stamps: 2, name: "Salon card", land: 20, x: -10, y: 170, r: -3, gone: 52 },
];

export const Hook: React.FC<{ f: number }> = ({ f }) => {
  if (f > 110) return null;
  return (
    <AbsoluteFill>
      {/* headline slot */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 470 }}>
        <div style={{ ...displayText(160), position: "absolute", left: 0, top: 0 }}>
          <Line f={f} inAt={3} outAt={62}>Paper cards</Line>
          <Line f={f} inAt={30} outAt={64}>
            get <Em>lost.</Em>
          </Line>
        </div>
        <div style={{ ...displayText(150), position: "absolute", left: 0, right: 0, top: -30, textAlign: "center" }}>
          <Line f={f} inAt={66} outAt={94}>
            Phones <Em>don&apos;t.</Em>
          </Line>
        </div>
      </div>

      {/* paper cards: tossed onto the table, then swept away */}
      <div style={{ position: "absolute", left: 240, top: 1130, perspective: 1600 }}>
        {CARDS.map((c, i) => {
          const land = tw(f, c.land - 8, c.land, 0, 1, EI);
          const settle = tw(f, c.land, c.land + 10, 0, 1, BACK);
          const gone = tw(f, c.gone, c.gone + 18, 0, 1, EI);
          const vel = tw(f, c.gone + 4, c.gone + 18, 0, 1, EI) - tw(f, c.gone + 2, c.gone + 16, 0, 1, EI);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x - 60,
                top: c.y - 175,
                opacity: land,
                translate: `${gone * 1500}px ${-gone * 380 + (1 - land) * -120}px`,
                rotate: `${c.r + gone * 70 + (1 - settle) * 14}deg`,
                scale: `${1 + (1 - land) * 0.5 - settle * 0 + (1 - settle) * 0.04}`,
                filter: `blur(${Math.min(18, Math.abs(vel) * 90)}px)`,
              }}
            >
              <PaperCard tint={c.tint} stamps={c.stamps} name={c.name} />
            </div>
          );
        })}
      </div>

      {/* dust flecks that follow the sweep */}
      {Array.from({ length: 22 }).map((_, i) => {
        const s = 46 + rand(i) * 10;
        const t = tw(f, s, s + 22, 0, 1, EO);
        if (t <= 0 || t >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 300 + rand(i + 9) * 400 + t * (700 + rand(i + 2) * 500),
              top: 950 + rand(i + 4) * 500 - t * (200 + rand(i + 5) * 300),
              width: 8 + rand(i + 7) * 14,
              height: 8 + rand(i + 7) * 14,
              borderRadius: 3,
              background: i % 3 ? "#EFE3C8" : C.coral,
              opacity: 1 - t,
              rotate: `${t * 400}deg`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 830,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 28,
          letterSpacing: "0.3em",
          color: C.mist,
          opacity: tw(f, 10, 20) * (1 - tw(f, 58, 64)),
        }}
      >
        9 STAMPS, 1 LOST CARD
      </div>
    </AbsoluteFill>
  );
};
