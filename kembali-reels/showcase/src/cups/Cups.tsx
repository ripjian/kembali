import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C, FONT, tw, EO, EI, EIO, BACK, rand } from "../lib";
import { useFonts, Grain } from "../swarm/shared";
import { StandardEnd, endSfx, endDuck } from "../endcards/StandardEnd";
import { Cup, CupSpec, LogoArt } from "./art";
import { SurfaceView, Surface } from "./surfaces";

// Rec2 Funk 0:00 → 0:28. Measured 129.8 BPM: beat k at 0.72 + 13.872k frames.
// The drop lands exactly on beat 32 (14.83 s).
const b = (k: number) => Math.round(0.72 + 13.872 * k);
const DROP = b(32);
const CX = 540;
const CY = 1010;

type Scene = { s: Surface; cup: CupSpec; day: string; word: string; ink: string; friend?: boolean };
const SCENES: Scene[] = [
  { s: "wood", cup: { drink: "latte", art: "rosetta", ceramic: "#F6F3EE", handle: 32 }, day: "MONDAY · 08:12", word: "one", ink: C.sand },
  { s: "slate", cup: { drink: "americano", art: "none", ceramic: "#E6DFD2", handle: 140 }, day: "WEDNESDAY · RAIN", word: "two", ink: C.sand },
  { s: "marble", cup: { drink: "latte", art: "tulip", ceramic: "#FBFBF8", rim: "#2E7D5B", handle: 20 }, day: "FRIDAY · LUNCH RUSH", word: "three", ink: C.ink },
  { s: "terrazzo", cup: { drink: "latte", art: "heart", ceramic: "#A9C2AA", handle: 200 }, day: "SUNDAY · WITH A FRIEND", word: "four", ink: C.ink, friend: true },
  { s: "news", cup: { drink: "takeaway", art: "none", ceramic: "#FFFFFF", handle: 0 }, day: "TUESDAY · TAKEAWAY", word: "five", ink: C.ink },
  { s: "enamel", cup: { drink: "mocha", art: "cocoa", ceramic: "#F7F4EE", handle: 60 }, day: "THURSDAY · 3PM", word: "six", ink: C.sand },
  { s: "night", cup: { drink: "latte", art: "rosetta", ceramic: "#2B2724", handle: 150 }, day: "SATURDAY · LATE", word: "seven", ink: C.sand },
  { s: "tile", cup: { drink: "matcha", art: "none", ceramic: "#FFFFFF", handle: 0 }, day: "MONDAY AGAIN", word: "eight", ink: C.ink },
  { s: "pandan", cup: { drink: "latte", art: "logo", ceramic: "#F3ECDC", handle: 38 }, day: "FRIDAY · 10:04", word: "nine", ink: C.sand },
];

const AT = [b(0), b(8), b(16), b(24), DROP, b(34), b(36), b(38), b(40)];
const SLAM = [b(5), b(13), b(21), b(28), DROP + 2, b(34) + 2, b(36) + 2, b(38) + 2, b(42)];
const STUT = [b(29), DROP]; // build: flashes of what's coming
const PULL = [b(44), b(48)]; // zoom out to the full card
const MERGE = b(50);
// Standard end card: the foam loop (608px at 540, 860 after the merge) is carried in and
// lands (start + 18) on beat 53; 84 frames of hold.
const END = b(53) - 18;

const pourT = (i: number, f: number) => (i < 4 ? tw(f, AT[i] + 8, AT[i] + 62, 0, 1, EIO) : i < 8 ? tw(f, AT[i], AT[i] + 14, 0, 1, EO) : tw(f, AT[8] + 2, SLAM[8] - 2, 0, 1, EIO));

// ink stamp left on the table for each visit
const Stamp: React.FC<{ n: number; t: number; big?: boolean }> = ({ n, t, big }) => {
  const r = big ? 110 : 88;
  const rot = -18 + rand(n * 13) * 30;
  return (
    <div
      style={{
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `9px solid ${C.coral}`,
        boxShadow: `inset 0 0 0 7px transparent, inset 0 0 0 10px ${C.coral}`,
        display: "grid",
        placeItems: "center",
        color: C.coral,
        rotate: `${rot}deg`,
        scale: `${tw(t, 0, 1, 1.8, 1, EI)}`,
        opacity: t > 0 ? 0.92 : 0,
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontFamily: FONT.mono, fontSize: big ? 20 : 16, letterSpacing: "0.3em" }}>VISIT</div>
        <div style={{ fontFamily: FONT.display, fontSize: big ? 84 : 66, lineHeight: 0.9, fontWeight: 600 }}>{n}</div>
      </div>
    </div>
  );
};

const Steam: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 5 }).map((_, i) => {
      const t = ((f + i * 11) % 55) / 55;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: CX - 60 + Math.sin(i * 2 + t * 4) * 50,
            top: CY - 40 - t * 260,
            width: 120 + t * 80,
            height: 90 + t * 60,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            filter: "blur(26px)",
            opacity: Math.sin(t * Math.PI) * 0.45,
          }}
        />
      );
    })}
  </>
);

// one table, one cup, one day
const SceneView: React.FC<{ i: number; f: number; spin?: number; preview?: boolean }> = ({ i, f, spin = 0, preview }) => {
  const sc = SCENES[i];
  const at = AT[i];
  const next = AT[i + 1] ?? 9999;
  const drift = tw(f, at, next, -2.5, 2.5, (x) => x) + spin;
  const hot = sc.cup.drink !== "matcha" && sc.cup.drink !== "iced";
  const friend = tw(f, at + 22, at + 40, 0, 1, EO);
  const slam = tw(f, SLAM[i], SLAM[i] + 5);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -300, top: -300, width: 1680, height: 2520, rotate: `${drift * 0.6}deg`, transformOrigin: `${CX + 300}px ${CY + 300}px` }}>
        <SurfaceView s={sc.s} f={f} />
      </div>
      {sc.friend && (
        <div style={{ position: "absolute", left: 740 + (1 - friend) * 600, top: 1180, scale: "0.62", transformOrigin: "0 0", rotate: `${(1 - friend) * 40}deg` }}>
          <Cup spec={{ drink: "latte", art: "rosetta", ceramic: "#F6F3EE", handle: 250 }} t={1} f={f} />
        </div>
      )}
      <div style={{ position: "absolute", left: 90, top: 1200 }}>
        <Stamp n={i + 1} t={slam} />
      </div>
      <div style={{ position: "absolute", left: CX - 360, top: CY - 360, rotate: `${drift}deg` }}>
        <Cup spec={sc.cup} t={preview ? 1 : pourT(i, f)} f={f} logo={{ arrow: tw(f, SLAM[8] - 2, SLAM[8] + 6, 0, 1, BACK), dot: tw(f, SLAM[8], SLAM[8] + 8, 0, 1, BACK) }} />
      </div>
      {hot && <Steam f={f} />}
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ f: number; i: number }> = ({ f, i }) => {
  const sc = SCENES[i];
  const at = AT[i];
  const next = i === 8 ? SLAM[8] + 4 : AT[i + 1];
  const pre = i < 4;
  const inA = at + (pre ? 6 : 1);
  const up = (a: number, o: number, d = pre ? 12 : 7) => ({
    translate: `0 ${tw(f, a, a + d, 110, 0, EO) + tw(f, o, o + 6, 0, -110, EI)}%`,
  });
  const out = next - (pre ? 8 : 3);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 440, textAlign: "center", color: sc.ink }}>
      <div style={{ overflow: "hidden" }}>
        <div style={{ ...up(inA, out), fontFamily: FONT.mono, fontSize: 28, letterSpacing: "0.26em", opacity: 0.85 }}>{sc.day}</div>
      </div>
      <div style={{ overflow: "hidden", marginTop: 10, paddingBottom: 12 }}>
        <div style={{ ...up(inA + 3, out + 1), fontFamily: FONT.display, fontWeight: 500, fontSize: 124, letterSpacing: "-0.035em", lineHeight: 1 }}>
          Visit <span style={{ fontStyle: "italic", fontWeight: 400, color: i === 8 ? C.coral : sc.ink }}>{sc.word}.</span>
        </div>
      </div>
    </div>
  );
};

const Hud: React.FC<{ f: number; ink: string }> = ({ f, ink }) => {
  const done = SLAM.filter((s) => f >= s).length;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1405, display: "flex", justifyContent: "center", opacity: 1 - tw(f, PULL[0], PULL[0] + 8) }}>
      <div style={{ display: "flex", gap: 16, padding: "16px 24px", borderRadius: 99, background: "rgba(10,36,29,0.78)", backdropFilter: "blur(8px)" }}>
        {Array.from({ length: 9 }).map((_, k) => {
          const on = k < done;
          const pop = on ? tw(f, SLAM[k], SLAM[k] + 8, 1.8, 1, BACK) : 1;
          return <div key={k} style={{ width: 30, height: 30, borderRadius: "50%", background: on ? C.coral : "transparent", border: on ? "none" : `3px solid rgba(246,241,227,0.4)`, scale: `${pop}` }} />;
        })}
      </div>
      {ink === "x" && null}
    </div>
  );
};

// the reveal: all nine cups on one table, laid out like the card
const GRID = (() => {
  const cells: { i: number; dx: number; dy: number }[] = [];
  let k = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) cells.push({ i: 8, dx, dy });
      else cells.push({ i: k++, dx, dy });
    }
  return cells;
})();
const SP = 800;

const Finale: React.FC<{ f: number }> = ({ f }) => {
  const out = tw(f, PULL[0], PULL[1], 0, 1, EIO);
  const merge = tw(f, MERGE, MERGE + 18, 0, 1, EIO);
  // the grid shrinks the cups away first, then the foam logo grows: no zoom-then-snap
  const growT = tw(f, MERGE + 4, MERGE + 18, 0, 1, EIO);
  const scale = interpolate(out, [0, 1], [1, 0.33]) * (1 - growT) + growT * 1.9;
  const ty = growT * -150;
  // the outer cups fade as they converge so nothing is left inside the ring; the centre cup
  // fades under its own foam logo
  const outerFade = 1 - tw(f, MERGE, MERGE + 6, 0, 1, (x) => x);
  const cupFade = 1 - tw(f, MERGE, MERGE + 6, 0, 1, (x) => x); // linear, with the outer cups (EO dropped it 58 % on its first frame)
  return (
    <AbsoluteFill>
      <SurfaceView s="pandan" f={f} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, scale: `${scale}`, translate: `0 ${ty}px`, transformOrigin: `${CX}px ${CY}px` }}>
        {GRID.map(({ i, dx, dy }) => {
          const center = i === 8;
          const pull = center ? 0 : merge;
          const x = CX + dx * SP * (1 - pull);
          const y = CY + dy * SP * (1 - pull);
          const s = center ? 1 : 1 - pull;
          if (s <= 0.01) return null;
          return (
            <div key={i} style={{ position: "absolute", left: x - 360, top: y - 360, scale: `${s}`, opacity: center ? cupFade : outerFade }}>
              <Cup spec={SCENES[i].cup} t={1} f={f} logo={{ arrow: 1, dot: 1 }} />
              <div style={{ position: "absolute", left: 470, top: -10, opacity: tw(f, PULL[0] + 10 + i * 2, PULL[0] + 16 + i * 2) }}>
                <Stamp n={i + 1} t={1} big />
              </div>
            </div>
          );
        })}
        {/* the foam loop stays behind as the logo */}
        <svg viewBox="-360 -360 720 720" width={720} height={720} style={{ position: "absolute", left: CX - 360, top: CY - 360, overflow: "visible", opacity: merge > 0 ? 1 : 0 }}>
          <LogoArt t={1} arrow={1} dot={1} stroke={C.sand} width={24} /> {/* same stroke as the card's Mark (6/80) */}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const EndText: React.FC<{ f: number }> = ({ f }) => {
  const word = "kembali".split("");
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 440, textAlign: "center", color: C.sand, fontFamily: FONT.display, fontSize: 104, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.04 }}>
        {[
          ["The tenth one", false, SLAM[8] + 6],
          ["is free.", true, SLAM[8] + 10],
        ].map(([t, em, a]) => (
          <div key={String(t)} style={{ overflow: "hidden", paddingBottom: 8 }}>
            <div style={{ translate: `0 ${tw(f, a as number, (a as number) + 10, 110, 0, EO) + tw(f, PULL[0] + 4, PULL[0] + 12, 0, -110, EI)}%`, fontStyle: em ? "italic" : "normal", fontWeight: em ? 400 : 500, color: em ? C.coral : C.sand }}>
              {t as string}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 440, textAlign: "center", color: C.sand, fontFamily: FONT.display, fontSize: 104, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.04 }}>
        <div style={{ overflow: "hidden", paddingBottom: 8, fontSize: 92, whiteSpace: "nowrap" }}>
          <div style={{ translate: `0 ${tw(f, PULL[1] - 14, PULL[1] - 4, 110, 0, EO) + tw(f, MERGE - 8, MERGE, 0, -110, EI)}%` }}>
            Every cup, <span style={{ fontStyle: "italic", fontWeight: 400, color: C.coral }}>counted.</span>
          </div>
        </div>
      </div>
    </>
  );
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={50} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
const SOUND = [
  ...SLAM.map((s, i) => ({ at: s - 1, src: i < 4 ? "sfx/impact/impactSoft_medium_001.ogg" : "sfx/impact/impactGeneric_light_000.ogg", vol: i < 4 ? 0.55 : 0.45 })),
  ...[1, 2, 3].map((i) => ({ at: AT[i] - 2, src: "sfx/web/whoosh.wav", vol: 0.22 })),
  { at: AT[3] + 22, src: "sfx/casino/card-place-1.ogg", vol: 0.5 },
  { at: AT[7] + 4, src: "sfx/impact/impactGlass_heavy_002.ogg", vol: 0.2 },
  { at: SLAM[8], src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.25 },
  { at: PULL[0] - 2, src: "sfx/web/whoosh.wav", vol: 0.35 },
  { at: MERGE - 2, src: "sfx/web/whip.wav", vol: 0.3 },
  ...endSfx(END, true),
];

export const Cups: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  let i = 0;
  AT.forEach((a, k) => {
    if (f >= a) i = k;
  });

  // build before the drop: stutter flashes of cups 5–8, camera creeping in
  let show = i;
  if (f >= STUT[0] && f < STUT[1]) {
    const k = Math.floor((f - STUT[0]) / 7);
    if ((f - STUT[0]) % 7 < 3) show = 4 + (k % 4);
  }
  const creep = tw(f, b(28), DROP, 0, 0.1, EI) * (f < DROP ? 1 : 0);
  // after the drop every cut punches
  const cut = f >= DROP && i >= 4 && i <= 8 ? f - AT[i] : 99;
  const punch = cut < 8 ? (1 - cut / 8) ** 2 * 0.12 : 0;
  const flash = cut < 5 ? (1 - cut / 5) * 0.45 : 0;

  // before the drop, a circular wipe opens each new day from the rim of the cup
  const wipe = i >= 1 && i <= 3 ? tw(f, AT[i], AT[i] + 12, 0, 1, EIO) : 1;
  const finale = f >= PULL[0];

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: `${1 + creep + punch}`, transformOrigin: `${CX}px ${CY}px` }}>
        {finale ? (
          <Finale f={f} />
        ) : (
          <>
            {wipe < 1 && <SceneView i={i - 1} f={f} />}
            <AbsoluteFill style={{ clipPath: wipe < 1 ? `circle(${interpolate(wipe, [0, 1], [196, 1300])}px at ${CX}px ${CY}px)` : undefined }}>
              <SceneView i={show} f={f} spin={wipe < 1 ? (1 - wipe) * -30 : 0} preview={show !== i} />
            </AbsoluteFill>
          </>
        )}
      </AbsoluteFill>
      {!finale && show === i && <Headline f={f} i={i} />}
      {f >= SLAM[8] && <EndText f={f} />}
      <Hud f={f} ink={SCENES[i].ink} />
      <AbsoluteFill style={{ background: C.white, opacity: flash, mixBlendMode: "overlay" }} />
      <Grain f={f} />
      <StandardEnd f={f} start={END} from={{ x: CX, y: CY - 150, size: 320 * 1.9, stroke: C.sand }} />
      <Audio src={staticFile("music/rec2-funk.mp3")} volume={(fr) => endDuck(fr, END) * interpolate(fr, [0, 2, 790, 836], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SOUND.map((s, k) => (
        <Sfx key={k} {...s} />
      ))}
    </AbsoluteFill>
  );
};
