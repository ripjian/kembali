import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, tw, EO, EI, BACK, kick } from "./lib";
import { Mark } from "./common";

const CX = 540;
const CY = 780;
const MARK = 280; // dot radius = 8/80 * MARK = 28

// Signature transition: the coral stamp dot swallows the frame, then shrinks
// back into the logo's dot.
export const Iris: React.FC<{ f: number }> = ({ f }) => {
  if (f < 494) return null;
  const grow = tw(f, 494, 510, 0, 1, EI);
  const shrink = tw(f, 514, 532, 0, 1, EO);
  const r = 2 + grow * 1400 - shrink * (1400 - 26);
  const land = kick(f, 532, 0.25, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: CX - r,
        top: CY - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: C.coral,
        scale: `${1 + land} ${1 - land}`,
      }}
    />
  );
};

export const EndCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < 510) return null;
  const draw = tw(f, 530, 554, 0, 1, EO);
  const spin = tw(f, 530, 560, -140, 0, EO);
  const arrow = tw(f, 548, 558, 0, 1, BACK);
  const word = "kembali".split("");
  const orbit = tw(f, 552, 572, 0, 1, EO);
  return (
    <AbsoluteFill>
      {/* nine stamp dots orbiting the mark: a full card */}
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2 + f / 40 - Math.PI / 2;
        const R = 190 + (1 - orbit) * 120;
        const s = tw(f, 552 + i * 1.5, 562 + i * 1.5, 0, 1, BACK);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * R - 9,
              top: CY + Math.sin(a) * R - 9,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: i % 3 === 2 ? C.coral : C.leaf,
              opacity: 0.8 * s,
              scale: `${s}`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: CX - MARK / 2, top: CY - MARK / 2, width: MARK, height: MARK, rotate: `${spin}deg` }}>
        <Mark size={MARK} stroke={C.sand} draw={draw} arrow={arrow} dot={0} />
      </div>

      <div style={{ position: "absolute", left: 60, right: 60, top: 1000, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: FONT.sans, fontWeight: 500, fontSize: 180, letterSpacing: "-0.04em", lineHeight: 1.05, color: C.sand, overflow: "hidden", paddingBottom: 10 }}>
          {word.map((ch, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                translate: `0 ${tw(f, 544 + i * 2.2, 560 + i * 2.2, 110, 0, EO)}%`,
                rotate: `${tw(f, 544 + i * 2.2, 560 + i * 2.2, 12, 0, EO)}deg`,
                color: i === word.length - 1 ? "color-mix(in srgb, #E0684B 84%, #F6F1E3)" : C.sand,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontSize: 60,
            fontWeight: 400,
            color: C.sand,
            opacity: tw(f, 562, 574),
            translate: `0 ${tw(f, 562, 578, 30, 0)}px`,
          }}
        >
          Loyalty your customers will love.
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: FONT.mono,
            fontSize: 26,
            letterSpacing: "0.26em",
            color: C.mist,
            opacity: tw(f, 572, 584),
          }}
        >
          STAMPS · POINTS · REWARDS · REPORTS
        </div>
      </div>
    </AbsoluteFill>
  );
};
