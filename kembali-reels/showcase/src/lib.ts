import { Easing, interpolate } from "remotion";

// Brand tokens (brand/BRAND.md) + Corner Coffee's tenant colours from the seed.
export const C = {
  pandan: "#0F3D32",
  pandanDeep: "#0A2C24",
  coral: "#E0684B",
  coralDeep: "#A93E24",
  leaf: "#7FB069",
  sand: "#F6F1E3",
  sandAlt: "#EDE6D2",
  border: "#DCD5BF",
  ink: "#16261E",
  ink2: "#5C6B60",
  muted: "#8B9689",
  mist: "#AFBCA9",
  white: "#FFFFFF",
  shopStamp: "#D98A2B",
  shopBrown: "#5B3A29",
};

export const FONT = {
  display: "Fraunces, Georgia, serif",
  sans: "Jakarta, system-ui, sans-serif",
  mono: "PlexMono, monospace",
};

// Measured beats of music/track.mp3 (seconds) → frames at 30fps.
const BEATS_S = [
  0.56, 1.09, 1.64, 2.19, 2.73, 3.27, 3.82, 4.39, 4.91, 5.34, 6.0, 6.56, 7.09,
  7.64, 8.19, 8.74, 9.29, 9.83, 10.37, 10.93, 11.46, 12.02, 12.55, 13.11, 13.64,
  14.2, 14.73, 15.29, 15.84, 16.38, 16.93, 17.47, 18.02, 18.56, 19.1, 19.66,
];
export const BEAT = BEATS_S.map((s) => Math.round(s * 30));

export const EO = Easing.bezier(0.16, 1, 0.3, 1); // expo-ish out
export const EIO = Easing.bezier(0.76, 0, 0.24, 1); // strong in-out
export const EI = Easing.bezier(0.7, 0, 0.84, 0); // strong in
export const BACK = Easing.bezier(0.34, 1.7, 0.5, 1); // overshoot

export const tw = (
  f: number,
  a: number,
  b: number,
  from = 0,
  to = 1,
  ease: (t: number) => number = EO,
) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

// Deterministic PRNG — renders must be identical frame to frame.
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Damped spring-ish shake: amplitude decays after a hit at frame h.
export const kick = (f: number, h: number, amp = 1, len = 14) => {
  const t = f - h;
  if (t < 0 || t > len) return 0;
  return amp * Math.exp(-t / (len / 4)) * Math.cos(t * 1.9);
};
