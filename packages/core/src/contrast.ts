/* WCAG 2.x colour-contrast maths. Dependency-free and pure, so the same
 * functions drive the platform-admin theming preview, the customer-facing
 * theme derivation, and the marketing card simulator. Everything works in
 * sRGB hex; alpha is not considered (loyalty surfaces are opaque). */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// Brand ink (BRAND.md --color-text) is the "near-black" alternative to white
// when picking a legible colour to sit on a filled surface.
const NEAR_BLACK = "#16261E";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

/** Parse `#rgb` / `#rrggbb` (with or without the hash) into 0-255 channels.
 * Malformed input falls back to black so callers never throw mid-render;
 * hex is validated with zod at every boundary before it reaches here. */
export function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channelToHex(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}

/** Canonical lowercase `#rrggbb` for a colour (clamps out-of-range input). */
export function normalizeHex(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function toLinear(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black/white). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Legible ink to place ON a filled colour: white or the near-black brand
 * ink, whichever has the higher contrast against the background. */
export function onColor(bg: string): string {
  return contrastRatio(WHITE, bg) >= contrastRatio(NEAR_BLACK, bg)
    ? WHITE
    : NEAR_BLACK;
}

function mixToward(from: Rgb, to: Rgb, t: number): string {
  return `#${channelToHex(from.r + (to.r - from.r) * t)}${channelToHex(
    from.g + (to.g - from.g) * t,
  )}${channelToHex(from.b + (to.b - from.b) * t)}`;
}

/** Darken or lighten `fg` step by step until it clears `min` contrast against
 * `bg`. Moves toward whichever extreme (black or white) can reach the target,
 * so for any background at least one direction succeeds at the 4.5 default. */
export function ensureReadable(fg: string, bg: string, min = 4.5): string {
  if (contrastRatio(fg, bg) >= min) return normalizeHex(fg);
  const target =
    contrastRatio(WHITE, bg) >= contrastRatio(BLACK, bg)
      ? parseHex(WHITE)
      : parseHex(BLACK);
  const start = parseHex(fg);
  for (let step = 1; step <= 20; step++) {
    const candidate = mixToward(start, target, step / 20);
    if (contrastRatio(candidate, bg) >= min) return candidate;
  }
  return mixToward(start, target, 1);
}
