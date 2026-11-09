import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, FONT, tw, EO, EIO, BACK } from "../lib";
import { Mark } from "../common";

/* The standard end card for every reel: option 3, "Sand".
   One entrance, used everywhere (frames relative to `start`):
     1–12   sand canvas grows out of the mark's position (a clip-path disc, radius in px,
            ease-out: visible from the first frame, far corner on the twelfth)
     5–22   the return loop draws itself
     20–28  arrowhead pops          (END_HIT.arrow)
     23–31  coral dot pops          (first visible pixel on start+24 = END_HIT.dot; land that on a beat)
     14–32  wordmark letters rise, 1-frame stagger
     22–34  tagline
     28–38  mono line
   then it holds. Everything readable sits inside y 420–1500.

   Reels that BUILD the logo pass `from`: the card's pandan mark is revealed by the sand
   disc exactly where the built one stands (clipped to the disc, so each pixel is either
   the built mark on the reel or the pandan mark on sand — never a mix), and it is carried
   into place over 18 frames so it is at rest on start+18, where the impact lands. The
   reel must keep drawing the built mark underneath until the sand covers it. */

export const END_HIT = { canvas: 1, arrow: 20, dot: 24, settled: 38 };
export const END_MIN_HOLD = 60; // frames on screen after it settles

// Layout (centre column). Measured stack: mark 220 · 34 · word 170 · 34 · tagline 70 · 34 · mono 32.
const MARK = 220;
export const END_MARK = { x: 540, y: 773, size: MARK }; // mark centre on the card
const WORD_TOP = 663 + MARK + 34; // 917
const TAG_TOP = WORD_TOP + 170 + 34; // 1121
const MONO_TOP = TAG_TOP + 70 + 34; // 1225

const LIN = (x: number) => x;
const OUT2 = Easing.out(Easing.quad);

// Identical end sound for every reel. Measured envelopes (per frame, after the render's
// priming is trimmed — see out/end/render-all.sh):
//   whoosh-long.wav  (whoosh.wav stretched 0.4×)  body on frames 2–5, peak 4–5
//   impactSoft       energy in its first frame
//   impactBell       energy in its first frame (no soft attack)
export const endSfx = (start: number, carried = false) => [
  { at: start - 4, src: "sfx/web/whoosh-long.wav", vol: 0.7 }, // peaks on start..start+1, as the disc appears
  carried
    ? { at: start + 18, src: "sfx/impact/impactSoft_medium_001.ogg", vol: 0.45 } // the mark comes to rest here
    : { at: start + END_HIT.dot, src: "sfx/impact/impactBell_heavy_000.ogg", vol: 0.6 }, // first visible dot pixel
];

// Music duck under the end hits so the whoosh and the landing read over the song:
// multiply a reel's music volume by this. Linear ramps (an eased release let the
// music back to full before the hit), held until the card has settled.
export const endDuck = (fr: number, start: number) =>
  1 - 0.5 * (tw(fr, start - 8, start - 3, 0, 1, LIN) - tw(fr, start + 32, start + 50, 0, 1, LIN));

export type EndFrom = { x: number; y: number; size: number; stroke?: string; rotate?: number };

export const StandardEnd: React.FC<{
  f: number;
  start: number;
  from?: EndFrom;
  mono?: React.ReactNode; // replaces "NO APP TO INSTALL" (the Tutorial keeps its joke here)
}> = ({ f, start, from, mono = "NO APP TO INSTALL" }) => {
  const t = f - start;
  if (t < 1) return null; // nothing on `start` itself: the disc first shows on start+1

  // Canvas: a sand disc whose radius grows (in px) from the mark's starting point to the
  // far corner over 12 frames. Ease-out so the first frame is already past the built mark
  // (whose outer edge is 0.34·size) and the corners are still being covered on the last. The radial glow is painted inside the
  // disc from the first frame, so the canvas never changes once it is down.
  const ox = from ? from.x : END_MARK.x;
  const oy = from ? from.y : END_MARK.y;
  const far = Math.hypot(Math.max(ox, 1080 - ox), Math.max(oy, 1920 - oy));
  const r0 = from ? from.size * 0.25 : 0; // never shown (nothing renders on `start`); sets where frame 1 lands
  const r = tw(t, 0, 12, r0, far + 1, OUT2);
  const clip = `circle(${r}px at ${ox}px ${oy}px)`;

  // Mark: drawn fresh, or carried in from the reel's own build.
  const carry = from ? tw(t, 0, 18, 0, 1, EIO) : 1;
  const mx = from ? from.x + (END_MARK.x - from.x) * carry : END_MARK.x;
  const my = from ? from.y + (END_MARK.y - from.y) * carry : END_MARK.y;
  const msize = from ? from.size + (MARK - from.size) * carry : MARK;
  const mrot = from ? (from.rotate ?? 0) * (1 - carry) : 0;
  const draw = from ? 1 : tw(t, 5, 22, 0, 1, OUT2);
  const arrow = from ? 1 : tw(t, 20, 28, 0, 1, BACK);
  const dot = from ? 1 : tw(t, 23, 31, 0, 1, BACK);

  const letters = "kembali".split("");
  const rise = (a: number, b: number, d = 28) => ({
    opacity: tw(t, a, b, 0, 1, LIN),
    translate: `0 ${tw(t, a, b, d, 0, EO)}px`,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ clipPath: clip, background: "radial-gradient(1000px 1100px at 50% 45%, #FFFFFF 0%, #F6F1E3 60%, #EDE6D2 100%)" }} />

      {/* mark: the pandan loop lives inside the disc; the coral dot sits over the built one */}
      <AbsoluteFill style={{ clipPath: clip }}>
        <div style={{ position: "absolute", left: mx - msize / 2, top: my - msize / 2, width: msize, height: msize, rotate: `${mrot}deg` }}>
          <Mark size={msize} stroke={C.pandan} draw={draw} arrow={arrow} dot={0} />
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: mx - msize / 2, top: my - msize / 2, width: msize, height: msize }}>
        <div style={{ position: "absolute", left: "40%", top: "40%", width: "20%", height: "20%", borderRadius: "50%", background: C.coral, scale: `${dot}` }} />
      </div>

      {/* wordmark */}
      <div style={{ position: "absolute", left: 0, right: 0, top: WORD_TOP, display: "flex", justifyContent: "center", overflow: "hidden", height: 190 }}>
        <div style={{ display: "flex", fontFamily: FONT.sans, fontWeight: 500, fontSize: 170, letterSpacing: "-0.045em", lineHeight: 1, color: C.pandan }}>
          {letters.map((ch, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                translate: `0 ${tw(t, 14 + i, 30 + i, 115, 0, EO)}%`,
                color: i === letters.length - 1 ? C.coral : C.pandan,
                // the trailing letter-spacing would otherwise shift the centred ink right
                marginRight: i === letters.length - 1 ? "0.045em" : 0,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* tagline */}
      <div style={{ position: "absolute", left: 60, right: 60, top: TAG_TOP, textAlign: "center", paddingLeft: 4 /* italic overhang: ink measured 2 px left of centre */, fontFamily: FONT.display, fontStyle: "italic", fontSize: 56, lineHeight: 1.25, color: C.pandan, ...rise(22, 34) }}>
        Loyalty your customers will love.
      </div>

      {/* mono line */}
      <div style={{ position: "absolute", left: 60, right: 60, top: MONO_TOP, textAlign: "center", fontFamily: FONT.mono, fontSize: 26, letterSpacing: "0.24em", paddingLeft: "0.24em" /* balances the trailing spacing */, color: C.ink2, ...rise(28, 38, 16), opacity: 0.75 * tw(t, 28, 38, 0, 1, LIN) }}>
        {mono}
      </div>
    </AbsoluteFill>
  );
};
