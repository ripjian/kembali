import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Backdrop, Grain } from "./common";
import { Hook } from "./Hook";
import { PhoneStory, HITS } from "./PhoneStory";
import { Features, FS } from "./Features";
import { StandardEnd, endSfx, endDuck } from "./endcards/StandardEnd";

const END = 500; // dot pops on the 17.47s beat (frame 524)

const FONTS: [string, string, FontFaceDescriptors][] = [
  ["Fraunces", "fonts/fraunces.woff2", { weight: "100 900", style: "normal" }],
  ["Fraunces", "fonts/fraunces-italic.woff2", { weight: "100 900", style: "italic" }],
  ["Jakarta", "fonts/jakarta.woff2", { weight: "200 800" }],
  ["PlexMono", "fonts/plexmono500.woff2", { weight: "500" }],
];

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      FONTS.map(async ([fam, src, desc]) => {
        const face = new FontFace(fam, `url(${staticFile(src)}) format("woff2")`, desc);
        await face.load();
        document.fonts.add(face);
      }),
    ).then(() => continueRender(handle));
  }, [handle]);
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.6 }) => (
  <Sequence from={at} durationInFrames={60} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

const SOUND: { at: number; src: string; vol?: number }[] = [
  { at: 7, src: "sfx/casino/card-place-1.ogg", vol: 0.7 },
  { at: 13, src: "sfx/casino/card-place-1.ogg", vol: 0.6 },
  { at: 19, src: "sfx/casino/card-place-1.ogg", vol: 0.55 },
  { at: 42, src: "sfx/web/whoosh.wav", vol: 0.45 },
  { at: 64, src: "sfx/web/whoosh.wav", vol: 0.3 },
  { at: 104, src: "sfx/ui/switch1.ogg", vol: 0.6 },
  { at: 145, src: "sfx/web/shutter-modern.wav", vol: 0.55 },
  ...HITS.map((h) => ({ at: h - 1, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.9 })),
  { at: 263, src: "sfx/web/ding.wav", vol: 0.45 },
  { at: 278, src: "sfx/web/whip.wav", vol: 0.35 },
  ...Array.from({ length: 12 }).map((_, i) => ({ at: 292 + i * 3, src: `sfx/keyboard/keypress-00${(i % 3) + 1}.wav`, vol: 0.25 })),
  { at: 341, src: "sfx/impact/impactMetal_heavy_000.ogg", vol: 0.55 },
  { at: 349, src: "sfx/web/whip.wav", vol: 0.45 },
  ...FS.slice(1).map((s, i) => ({ at: s - 2, src: `sfx/ui/switch${(i % 4) + 1}.ogg`, vol: 0.5 })),
  ...endSfx(END),
];

export const Showcase: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0F3D32", overflow: "hidden" }}>
      <Backdrop f={f} />
      <Hook f={f} />
      <PhoneStory f={f} />
      <Features f={f} />
      <Grain f={f} />
      <StandardEnd f={f} start={END} />

      <Audio
        src={staticFile("music/track.mp3")}
        volume={(fr) => endDuck(fr, END) * interpolate(fr, [0, 6, 548, 596], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {SOUND.map((s, i) => (
        <Sfx key={i} {...s} />
      ))}
    </AbsoluteFill>
  );
};
