import { contrastRatio, ensureReadable, normalizeHex, onColor } from "./contrast";

/* Per-tenant theme derivation. Given a merchant's chosen primary and accent
 * plus the surface they sit on, produce a full set of colour variables where
 * every text pairing clears WCAG AA (4.5:1) and every UI line/icon pairing
 * clears 3:1. The customer app injects these as CSS custom properties and the
 * marketing simulator reuses the exact same maths, so a preview matches
 * production rendering. */

export interface TenantTheme {
  /** Brand primary, used as a button/fill background. */
  primary: string;
  /** Legible text/icon colour ON the primary fill (>= 4.5:1). */
  onPrimary: string;
  /** Primary re-tuned to read as text/links on the surface (>= 4.5:1). */
  primaryText: string;
  /** Primary re-tuned for UI lines/borders/icons on the surface (>= 3:1). */
  primaryLine: string;
  /** Brand accent, used as a stamp/reward fill. */
  accent: string;
  /** Legible text/icon colour ON the accent fill (>= 4.5:1). */
  onAccent: string;
  /** Accent re-tuned to read as text on the surface (>= 4.5:1). */
  accentDeep: string;
  /** Accent re-tuned for UI lines/borders/icons on the surface (>= 3:1). */
  accentLine: string;
}

/** WCAG AA thresholds: normal text vs large-text/graphical objects. */
export const AA_TEXT = 4.5;
export const AA_UI = 3;

export function deriveTenantTheme(
  primary: string,
  accent: string,
  surface: string,
): TenantTheme {
  return {
    primary: normalizeHex(primary),
    onPrimary: ensureReadable(onColor(primary), primary, AA_TEXT),
    primaryText: ensureReadable(primary, surface, AA_TEXT),
    primaryLine: ensureReadable(primary, surface, AA_UI),
    accent: normalizeHex(accent),
    onAccent: ensureReadable(onColor(accent), accent, AA_TEXT),
    accentDeep: ensureReadable(accent, surface, AA_TEXT),
    accentLine: ensureReadable(accent, surface, AA_UI),
  };
}

/** Convenience for a live badge in the admin picker: the raw ratio plus
 * whether it clears the given AA threshold. */
export function contrastCheck(
  fg: string,
  bg: string,
  min = AA_TEXT,
): { ratio: number; passes: boolean } {
  const ratio = contrastRatio(fg, bg);
  return { ratio, passes: ratio >= min };
}
