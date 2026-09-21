import { describe, expect, it } from "vitest";

import {
  DEFAULT_REFERRAL_SETTINGS,
  evaluateReferral,
  generateReferralCode,
  isReferralCode,
  normalizeReferralCode,
  parseReferralSettings,
  referralVoucherExpiry,
  referralWindowStart,
} from "./referrals";

const enabled = parseReferralSettings({
  enabled: true,
  referrer: { type: "points", points: 50 },
  referee: { type: "points", points: 20 },
  maxPerReferrer: 2,
  windowDays: 30,
});

describe("referral settings", () => {
  it("defaults to off with no rewards", () => {
    expect(DEFAULT_REFERRAL_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_REFERRAL_SETTINGS.referrer).toEqual({ type: "none" });
  });
  it("garbage falls back to the defaults, partial input is merged", () => {
    expect(parseReferralSettings("nope")).toEqual(DEFAULT_REFERRAL_SETTINGS);
    expect(parseReferralSettings({ enabled: true }).maxPerReferrer).toBe(10);
    expect(parseReferralSettings({ referrer: { type: "points", points: 0 } })).toEqual(
      DEFAULT_REFERRAL_SETTINGS,
    );
  });
});

describe("invite codes", () => {
  it("are 6 characters without look-alike letters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferralCode();
      expect(isReferralCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });
  it("normalise what a person types", () => {
    expect(normalizeReferralCode(" ab-cd ef ")).toBe("ABCDEF");
    expect(isReferralCode("ABCDEF")).toBe(true);
    expect(isReferralCode("ABC")).toBe(false);
  });
});

describe("evaluateReferral", () => {
  const base = { settings: enabled, referrerId: "a", refereeId: "b", recentCount: 0 };
  it("accepts a fresh invite", () => {
    expect(evaluateReferral(base)).toEqual({ ok: true });
  });
  it("refuses when the program is off", () => {
    expect(evaluateReferral({ ...base, settings: DEFAULT_REFERRAL_SETTINGS })).toEqual({
      ok: false,
      reason: "disabled",
    });
  });
  it("refuses self-invites", () => {
    expect(evaluateReferral({ ...base, refereeId: "a" })).toEqual({ ok: false, reason: "self" });
  });
  it("refuses once the cap for the window is reached, unless the cap is 0", () => {
    expect(evaluateReferral({ ...base, recentCount: 2 })).toEqual({ ok: false, reason: "cap" });
    const uncapped = { ...enabled, maxPerReferrer: 0 };
    expect(evaluateReferral({ ...base, settings: uncapped, recentCount: 999 })).toEqual({ ok: true });
  });
  it("refuses a program that rewards nobody", () => {
    const none = { ...enabled, referrer: { type: "none" as const }, referee: { type: "none" as const } };
    expect(evaluateReferral({ ...base, settings: none })).toEqual({ ok: false, reason: "no_reward" });
  });
  it("window and voucher expiry derive from the settings", () => {
    const now = new Date("2026-09-21T00:00:00Z");
    expect(referralWindowStart(enabled, now).toISOString()).toBe("2026-08-22T00:00:00.000Z");
    expect(referralVoucherExpiry(enabled, now).toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });
});
