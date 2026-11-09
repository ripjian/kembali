import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../lib";
import { useFonts } from "../swarm/shared";
import { Mark } from "../common";

// Five candidate end cards for every reel. Everything readable sits inside y 420–1500.
const CORAL_I = "color-mix(in srgb, #E0684B 84%, #F6F1E3)";

const Word: React.FC<{ size: number; color?: string; iColor?: string }> = ({ size, color = C.sand, iColor = CORAL_I }) => (
  <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: size, letterSpacing: "-0.045em", lineHeight: 1, color }}>
    kembal<span style={{ color: iColor }}>i</span>
  </div>
);
const Tagline: React.FC<{ size?: number; color?: string }> = ({ size = 56, color = C.sand }) => (
  <div style={{ fontFamily: FONT.display, fontStyle: "italic", fontSize: size, color }}>Loyalty your customers will love.</div>
);
const MonoLine: React.FC<{ text: string; color?: string }> = ({ text, color = C.sand }) => (
  <div style={{ fontFamily: FONT.mono, fontSize: 26, letterSpacing: "0.24em", color, opacity: 0.75 }}>{text}</div>
);
const Pandan: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.pandan }}>
    <AbsoluteFill style={{ background: "radial-gradient(1100px 1200px at 50% 48%, #1C5A48 0%, #0F3D32 58%, #082119 100%)" }} />
    {children}
  </AbsoluteFill>
);
const Center: React.FC<{ children: React.ReactNode; gap?: number; top?: number }> = ({ children, gap = 34, top = 0 }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, paddingTop: top }}>{children}</AbsoluteFill>
);

// 1 · Stacked: mark over wordmark, the calm default
const V1 = () => (
  <Pandan>
    <Center>
      <Mark size={230} stroke={C.sand} />
      <Word size={170} />
      <Tagline />
    </Center>
  </Pandan>
);

// 2 · Horizontal lockup (BRAND.md: mark left of the wordmark) with a hairline and a mono line
const V2 = () => (
  <Pandan>
    <Center gap={40}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Mark size={160} stroke={C.sand} />
        <Word size={160} />
      </div>
      <div style={{ width: 640, height: 2, background: "rgba(246,241,227,0.25)" }} />
      <Tagline size={54} />
      <MonoLine text="DIGITAL STAMP CARDS FOR SMALL BUSINESSES" />
    </Center>
  </Pandan>
);

// 3 · Sand: the light, editorial version
const V3 = () => (
  <AbsoluteFill style={{ background: C.sand }}>
    <AbsoluteFill style={{ background: "radial-gradient(1000px 1100px at 50% 45%, #FFFFFF 0%, #F6F1E3 60%, #EDE6D2 100%)" }} />
    <Center>
      <Mark size={220} stroke={C.pandan} />
      <Word size={170} color={C.pandan} iColor={C.coral} />
      <Tagline color={C.pandan} />
      <MonoLine text="NO APP TO INSTALL" color={C.ink2} />
    </Center>
  </AbsoluteFill>
);

// 4 · Big mark: an oversized return loop wraps the wordmark
const V4 = () => (
  <Pandan>
    <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative", width: 860, height: 860, marginTop: -80 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.95 }}>
          <Mark size={860} stroke="rgba(246,241,227,0.14)" dot={0} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: C.coral }} />
          <Word size={170} />
          <Tagline size={52} />
        </div>
      </div>
    </AbsoluteFill>
  </Pandan>
);

// 5 · Stamp card: nine visits, the ninth stamp is the logo's dot
const V5 = () => (
  <Pandan>
    <Center gap={44}>
      <div style={{ width: 640, padding: "38px 44px", borderRadius: 34, background: C.sand, boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 22, letterSpacing: "0.2em", color: C.ink2 }}>
          <span>YOUR CARD</span>
          <span>9 / 9</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26, marginTop: 30, justifyItems: "center" }}>
          {Array.from({ length: 9 }).map((_, i) =>
            i < 8 ? (
              <div key={i} style={{ width: 120, height: 120, borderRadius: "50%", background: C.pandan, display: "grid", placeItems: "center" }}>
                <Mark size={78} stroke={C.sand} dot={0} />
              </div>
            ) : (
              <div key={i} style={{ width: 120, height: 120, display: "grid", placeItems: "center" }}>
                <Mark size={120} stroke={C.pandan} />
              </div>
            ),
          )}
        </div>
      </div>
      <Word size={150} />
      <Tagline size={52} />
    </Center>
  </Pandan>
);

const VARIANTS = [V1, V2, V3, V4, V5];

export const EndCards: React.FC<{ variant: number }> = ({ variant }) => {
  useFonts();
  const V = VARIANTS[variant - 1] ?? V1;
  return <V />;
};
