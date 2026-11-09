import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, tw, EO, EI } from "./lib";

// Backdrop: pandan canvas, drifting leaf glow, stamp-dot grid, grain, vignette.
export const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  const gx = 540 + Math.sin(f / 70) * 220;
  const gy = 900 + Math.cos(f / 55) * 260;
  const gx2 = 540 + Math.cos(f / 90) * 300;
  const gy2 = 1500 + Math.sin(f / 80) * 200;
  return (
    <AbsoluteFill style={{ background: C.pandan, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${gx}px ${gy}px, rgba(127,176,105,0.26), rgba(15,61,50,0) 70%),
            radial-gradient(700px 700px at ${gx2}px ${gy2}px, rgba(224,104,75,0.13), rgba(15,61,50,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(246,241,227,0.09) 2.2px, transparent 2.6px)",
          backgroundSize: "54px 54px",
          backgroundPosition: `0px ${-f * 0.6}px`,
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(4,20,15,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width="1080" height="1920">
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={1 + (f % 7)} /* feTurbulence renders seed 0 and 1 the same */ />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

// Return-loop mark. `draw` 0→1 strokes the arc, `arrow` scales the head, `dot` the stamp dot.
export const Mark: React.FC<{
  size: number;
  stroke?: string;
  draw?: number;
  arrow?: number;
  dot?: number;
  style?: React.CSSProperties;
}> = ({ size, stroke = C.sand, draw = 1, arrow = 1, dot = 1, style }) => (
  <svg viewBox="0 0 80 80" width={size} height={size} style={{ overflow: "visible", ...style }}>
    <path
      d="M64 40 A24 24 0 1 1 57 23"
      fill="none"
      stroke={stroke}
      strokeWidth={6}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
      opacity={draw > 0 ? 1 : 0}
    />
    <polygon
      points="62.7,28.7 60.5,19.5 53.5,26.5"
      fill={stroke}
      style={{ transformOrigin: "58.1px 27.6px", scale: `${arrow}` }}
    />
    <circle cx="40" cy="40" r="8" fill={C.coral} style={{ transformBox: "fill-box", transformOrigin: "50% 50%", scale: `${dot}` }} />
  </svg>
);

// Masked line: rises into its slot at `inAt`, leaves upward at `outAt`.
export const Line: React.FC<{
  f: number;
  inAt: number;
  outAt?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
}> = ({ f, inAt, outAt = 1e9, children, style, dur = 14 }) => {
  const y = tw(f, inAt, inAt + dur, 110, 0, EO) + tw(f, outAt, outAt + 10, 0, -115, EI);
  const rot = tw(f, inAt, inAt + dur, 6, 0, EO);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
      <div
        style={{
          translate: `0 ${y}%`,
          rotate: `${rot}deg`,
          transformOrigin: "0% 100%",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Em: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontStyle: "italic", fontWeight: 400, color: C.coral }}>{children}</span>
);

export const Photo: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ objectFit: "cover", ...style }} />
);

export const displayText = (size: number): React.CSSProperties => ({
  fontFamily: FONT.display,
  fontWeight: 500,
  fontSize: size,
  lineHeight: 1.02,
  letterSpacing: "-0.03em",
  color: C.sand,
});
