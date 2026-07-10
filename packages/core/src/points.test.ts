import { describe, expect, it } from "vitest";

import { pointsForAmount, sumPointDeltas } from "./points";
import {
  generateRedemptionCode,
  isRedemptionCode,
  normalizeRedemptionCode,
  redemptionExpiry,
  REDEMPTION_TTL_MINUTES,
} from "./redemptions";

describe("pointsForAmount", () => {
  it("converts sen to points at the tenant rate", () => {
    expect(pointsForAmount(1550, 1)).toBe(15); // RM15.50 @ 1 pt/RM
    expect(pointsForAmount(1550, 2)).toBe(31); // RM15.50 @ 2 pt/RM
    expect(pointsForAmount(1000, 0.5)).toBe(5); // RM10 @ 0.5 pt/RM
  });

  it("always rounds down - never give away an unconfigured point", () => {
    expect(pointsForAmount(199, 1)).toBe(1);
    expect(pointsForAmount(99, 1)).toBe(0);
    expect(pointsForAmount(150, 0.5)).toBe(0);
  });

  it("returns 0 for paused rates, zero, negatives and garbage", () => {
    expect(pointsForAmount(1000, 0)).toBe(0);
    expect(pointsForAmount(0, 2)).toBe(0);
    expect(pointsForAmount(-500, 2)).toBe(0);
    expect(pointsForAmount(1000, -1)).toBe(0);
    expect(pointsForAmount(Number.NaN, 1)).toBe(0);
    expect(pointsForAmount(1000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("sumPointDeltas", () => {
  it("reconciles a mixed ledger", () => {
    expect(sumPointDeltas([12, 15, -20, 50, -7])).toBe(50);
    expect(sumPointDeltas([])).toBe(0);
  });
});

describe("redemption codes", () => {
  it("generates well-formed, unambiguous codes", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRedemptionCode();
      expect(isRedemptionCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("does not repeat across a batch", () => {
    const batch = new Set(
      Array.from({ length: 1000 }, () => generateRedemptionCode()),
    );
    expect(batch.size).toBe(1000);
  });

  it("normalizes scanner and typed input the same way", () => {
    expect(normalizeRedemptionCode("  kmb-7gxa-q2zm ")).toBe("KMB-7GXA-Q2ZM");
    expect(isRedemptionCode(" kmb-7gxa-q2zm ")).toBe(true);
    expect(isRedemptionCode("KMB-7GXA")).toBe(false);
    expect(isRedemptionCode("not-a-code")).toBe(false);
  });

  it("expires TTL minutes after reserve", () => {
    const now = new Date("2026-07-10T10:00:00Z");
    expect(redemptionExpiry(now).getTime() - now.getTime()).toBe(
      REDEMPTION_TTL_MINUTES * 60_000,
    );
  });
});
