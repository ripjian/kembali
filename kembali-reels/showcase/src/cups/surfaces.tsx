import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { C, rand } from "../lib";

export type Surface = "wood" | "slate" | "marble" | "terrazzo" | "news" | "enamel" | "night" | "tile" | "pandan";

const Noise: React.FC<{ freq: string; opacity: number; blend?: React.CSSProperties["mixBlendMode"]; seed?: number }> = ({ freq, opacity, blend = "multiply", seed = 2 }) => {
  const id = "n" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: blend }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};

const Marble: React.FC = () => {
  const id = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.008" numOctaves={5} seed={11} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.47  0 0 0 0 0.48  1 0 0 0 0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0 0 0 0.05 0.55 0.05 0 0 0 0" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="0.8" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};

export const SurfaceView: React.FC<{ s: Surface; f: number }> = ({ s, f }) => {
  switch (s) {
    case "wood":
      return (
        <AbsoluteFill style={{ background: "#7A5234" }}>
          <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 214px, rgba(30,15,5,0.45) 214px 218px), repeating-linear-gradient(90deg, rgba(255,230,200,0.05) 0 3px, transparent 3px 13px)" }} />
          <Noise freq="0.03 0.0012" opacity={0.55} />
          {/* morning window light */}
          <div
            style={{
              position: "absolute",
              left: -600,
              top: -600,
              width: 2900,
              height: 3700,
              rotate: "-24deg",
              translate: `${f * 0.9 - 200}px 0`,
              backgroundImage: "repeating-linear-gradient(90deg, rgba(255,236,200,0.28) 0 260px, transparent 260px 330px)",
              filter: "blur(22px)",
              mixBlendMode: "soft-light",
            }}
          />
          <AbsoluteFill style={{ background: "radial-gradient(900px 900px at 30% 30%, rgba(255,220,170,0.25), transparent 70%)" }} />
        </AbsoluteFill>
      );
    case "slate":
      return (
        <AbsoluteFill style={{ background: "#2C3337" }}>
          <Noise freq="0.9" opacity={0.25} blend="overlay" />
          {Array.from({ length: 46 }).map((_, i) => {
            const x = rand(i) * 1080;
            const y = 300 + rand(i + 50) * 1400;
            const r = 6 + rand(i + 9) * 16;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - r,
                  top: y - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), rgba(255,255,255,0.08) 45%, rgba(0,0,0,0.25) 100%)",
                }}
              />
            );
          })}
          {/* rain on the window glass, reflected */}
          {Array.from({ length: 70 }).map((_, i) => {
            const sp = 38 + rand(i + 3) * 30;
            const y = ((rand(i + 7) * 2200 + f * sp) % 2200) - 200;
            return (
              <div
                key={`r${i}`}
                style={{
                  position: "absolute",
                  left: rand(i + 1) * 1200 - 60 + y * 0.2,
                  top: y,
                  width: 2,
                  height: 70 + rand(i) * 60,
                  background: "linear-gradient(transparent, rgba(200,225,255,0.35))",
                  rotate: "-11deg",
                }}
              />
            );
          })}
          <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(120,160,200,0.18), transparent 60%)" }} />
        </AbsoluteFill>
      );
    case "marble":
      return (
        <AbsoluteFill style={{ background: "#EEEBE5" }}>
          <Marble />
          <Noise freq="0.7" opacity={0.08} />
          <AbsoluteFill style={{ background: "radial-gradient(1000px 1000px at 50% 40%, rgba(255,255,255,0.4), transparent 70%)" }} />
        </AbsoluteFill>
      );
    case "terrazzo":
      return (
        <AbsoluteFill style={{ background: "#E6DFCE" }}>
          {Array.from({ length: 220 }).map((_, i) => {
            const cols = ["#C8BFAA", "#8FA894", "#C4906F", "#5E6B63", "#F8F4EA", "#B7AE97"];
            const w = 10 + rand(i + 4) * 34;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: rand(i) * 1100 - 10,
                  top: rand(i + 300) * 1940 - 10,
                  width: w,
                  height: w * (0.5 + rand(i + 8) * 0.6),
                  borderRadius: `${30 + rand(i + 1) * 40}% ${20 + rand(i + 2) * 50}%`,
                  background: cols[i % cols.length],
                  rotate: `${rand(i + 5) * 180}deg`,
                }}
              />
            );
          })}
          <Noise freq="0.8" opacity={0.12} />
        </AbsoluteFill>
      );
    case "news":
      return (
        <AbsoluteFill style={{ background: "#DAD6CC" }}>
          <div style={{ position: "absolute", inset: -300, rotate: "-9deg", padding: 60, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 40 }}>
            {Array.from({ length: 5 }).map((_, c) => (
              <div key={c}>
                <div style={{ height: 60, background: "rgba(40,40,40,0.55)", width: `${60 + rand(c) * 40}%`, marginTop: 40 + c * 30 }} />
                {Array.from({ length: 70 }).map((_, j) => (
                  <div key={j} style={{ height: 9, marginTop: 13, background: "rgba(40,40,40,0.3)", width: `${75 + rand(c * 99 + j) * 25}%` }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 60, top: 1200, width: 300, height: 300, borderRadius: "50%", border: "14px solid rgba(110,70,30,0.2)" }} />
          <Noise freq="0.6" opacity={0.15} />
        </AbsoluteFill>
      );
    case "enamel":
      return (
        <AbsoluteFill style={{ background: "#35607F" }}>
          {Array.from({ length: 120 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: rand(i) * 1080, top: rand(i + 200) * 1920, width: 3 + rand(i + 3) * 5, height: 3 + rand(i + 3) * 5, borderRadius: "50%", background: "rgba(255,255,255,0.28)" }} />
          ))}
          <Noise freq="0.5" opacity={0.2} blend="overlay" />
          <AbsoluteFill style={{ background: "radial-gradient(1000px 1000px at 60% 35%, rgba(255,255,255,0.18), transparent 70%)" }} />
        </AbsoluteFill>
      );
    case "night":
      return (
        <AbsoluteFill style={{ background: "#120E0B" }}>
          <Noise freq="0.03 0.0015" opacity={0.35} blend="overlay" />
          <AbsoluteFill style={{ background: `radial-gradient(1100px 1100px at ${30 + Math.sin(f / 40) * 2}% 38%, rgba(255,168,88,0.42), rgba(255,140,60,0.08) 45%, transparent 70%)` }} />
        </AbsoluteFill>
      );
    case "tile":
      return (
        <AbsoluteFill style={{ background: "#CFE2D2" }}>
          <AbsoluteFill
            style={{
              backgroundImage: "linear-gradient(#F4F1E8 3px, transparent 3px), linear-gradient(90deg, #F4F1E8 3px, transparent 3px)",
              backgroundSize: "54px 54px",
            }}
          />
          {Array.from({ length: 90 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: Math.floor(rand(i) * 20) * 54 + 3, top: Math.floor(rand(i + 90) * 36) * 54 + 3, width: 51, height: 51, background: i % 3 ? "#B5D3BD" : "#E3EEE1" }} />
          ))}
          <Noise freq="0.7" opacity={0.1} />
        </AbsoluteFill>
      );
    case "pandan":
    default:
      return (
        <AbsoluteFill style={{ background: C.pandan }}>
          <Noise freq="0.02 0.0014" opacity={0.3} blend="overlay" />
          <AbsoluteFill style={{ background: "radial-gradient(1100px 1200px at 50% 50%, rgba(127,176,105,0.2), transparent 70%)" }} />
        </AbsoluteFill>
      );
  }
};
