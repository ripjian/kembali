import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  ensureReadable,
  normalizeHex,
  onColor,
  parseHex,
  relativeLuminance,
} from "./contrast";
import { AA_TEXT, AA_UI, deriveTenantTheme } from "./theme";

const SURFACE_LIGHT = "#FFFFFF";
const SURFACE_DARK = "#182B23"; // BRAND.md dark --color-surface

// A deliberately hostile spread: mid-tones near the black/white crossover,
// a pure primary that fails white, near-invisible pastels, and both extremes.
const HOSTILE = [
  "#767676", // classic WCAG worst-case mid grey
  "#808080",
  "#ffff00", // pure yellow: fails white text badly
  "#00ff00", // pure green
  "#e0684b", // Kembali coral
  "#0f3d32", // Kembali pandan
  "#fff8b0", // pale yellow pastel
  "#c9f5d0", // pale mint pastel
  "#000000",
  "#ffffff",
  "#123abc",
];

describe("parseHex / normalizeHex", () => {
  it("expands 3-digit hex and tolerates a missing hash", () => {
    expect(parseHex("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
  });

  it("falls back to black on malformed input rather than throwing", () => {
    expect(parseHex("nope")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("relativeLuminance", () => {
  it("anchors black at 0 and white at 1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("gives 21:1 for black on white and 1:1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#3a3a3a", "#3a3a3a")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    expect(contrastRatio("#123456", "#abcdef")).toBeCloseTo(
      contrastRatio("#abcdef", "#123456"),
      6,
    );
  });
});

describe("onColor", () => {
  it("picks near-black on light fills and white on dark fills", () => {
    expect(relativeLuminance(onColor("#ffffff"))).toBeLessThan(0.5);
    expect(onColor("#0f3d32")).toBe("#FFFFFF");
  });

  it("always returns white or the near-black brand ink", () => {
    for (const c of HOSTILE) {
      expect(["#FFFFFF", "#16261E"]).toContain(onColor(c));
    }
  });
});

describe("ensureReadable", () => {
  it("leaves an already-passing colour untouched (normalised)", () => {
    // pandan on white already clears AA
    expect(contrastRatio("#0f3d32", "#ffffff")).toBeGreaterThan(AA_TEXT);
    expect(ensureReadable("#0f3d32", "#ffffff")).toBe("#0f3d32");
  });

  it("leaves the boundary grey #767676 (4.54:1) alone", () => {
    // #767676 is the lightest grey that still clears AA on white.
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ensureReadable("#767676", "#ffffff")).toBe("#767676");
  });

  it("darkens a failing mid grey until it passes on white", () => {
    expect(contrastRatio("#808080", "#ffffff")).toBeLessThan(AA_TEXT);
    const fixed = ensureReadable("#808080", "#ffffff");
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("tames pure yellow into a readable colour on white", () => {
    const fixed = ensureReadable("#ffff00", "#ffffff");
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("handles both extremes without moving them", () => {
    expect(ensureReadable("#000000", "#ffffff")).toBe("#000000");
    expect(ensureReadable("#ffffff", "#000000")).toBe("#ffffff");
  });

  it("reaches AA against any background for every hostile colour", () => {
    for (const bg of HOSTILE) {
      const fixed = ensureReadable(bg, bg); // worst case: fg === bg (ratio 1)
      expect(contrastRatio(fixed, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});

describe("deriveTenantTheme", () => {
  it("keeps every text pairing >= 4.5 and every UI line >= 3 on light and dark", () => {
    for (const surface of [SURFACE_LIGHT, SURFACE_DARK]) {
      for (const primary of HOSTILE) {
        for (const accent of HOSTILE) {
          const t = deriveTenantTheme(primary, accent, surface);
          // text on fills
          expect(contrastRatio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(AA_TEXT);
          // brand colours re-tuned as text on the surface
          expect(contrastRatio(t.primaryText, surface)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.accentDeep, surface)).toBeGreaterThanOrEqual(AA_TEXT);
          // UI lines / icons on the surface
          expect(contrastRatio(t.primaryLine, surface)).toBeGreaterThanOrEqual(AA_UI);
          expect(contrastRatio(t.accentLine, surface)).toBeGreaterThanOrEqual(AA_UI);
        }
      }
    }
  });

  it("passes the raw primary/accent straight through as fills", () => {
    const t = deriveTenantTheme("#e0684b", "#7fb069", SURFACE_LIGHT);
    expect(t.primary).toBe("#e0684b");
    expect(t.accent).toBe("#7fb069");
  });
});
