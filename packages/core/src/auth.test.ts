import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  signQrToken,
  verifyQrToken,
  hashOtpCode,
  isOtpBypass,
} from "./auth";
import { checkStampVelocity, earnsReward } from "./stamping";

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const stored = hashPassword("CornerCoffee1!");
    expect(verifyPassword("CornerCoffee1!", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
    expect(verifyPassword("CornerCoffee1!", "garbage")).toBe(false);
  });
});

describe("session tokens", () => {
  it("issues unique tokens with stable hashes", () => {
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).toHaveLength(64);
  });
});

describe("QR tokens", () => {
  const payload = {
    cardId: "66666666-6666-4666-8666-666666666601",
    tenantId: "11111111-1111-4111-8111-111111111111",
  };

  it("round-trips a valid token", () => {
    const token = signQrToken(payload, "secret");
    const result = verifyQrToken(token, "secret");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.cardId).toBe(payload.cardId);
  });

  it("rejects a tampered or wrong-secret token", () => {
    const token = signQrToken(payload, "secret");
    expect(verifyQrToken(token, "other").ok).toBe(false);
    expect(verifyQrToken(`${token}x`, "secret").ok).toBe(false);
  });

  it("rejects an expired token", () => {
    const past = new Date(Date.now() - 10 * 60 * 1000);
    const token = signQrToken(payload, "secret", past);
    const result = verifyQrToken(token, "secret");
    expect(result).toEqual({ ok: false, reason: "expired" });
  });
});

describe("OTP", () => {
  it("binds the hash to the phone number", () => {
    expect(hashOtpCode("+60123456701", "123456")).not.toBe(
      hashOtpCode("+60123456702", "123456"),
    );
  });

  it("accepts the dev bypass only when enabled", () => {
    expect(isOtpBypass("888888", true)).toBe(true);
    expect(isOtpBypass("888888", false)).toBe(false);
    expect(isOtpBypass("123456", true)).toBe(false);
  });
});

describe("stamp velocity", () => {
  it("blocks a second stamp within a minute", () => {
    const now = new Date();
    const check = checkStampVelocity([new Date(now.getTime() - 20_000)], now);
    expect(check).toEqual({ allowed: false, reason: "too_soon" });
  });

  it("blocks past the daily cap", () => {
    const now = new Date("2026-07-08T18:00:00");
    const today = Array.from(
      { length: 10 },
      (_, i) => new Date(`2026-07-08T0${i}:05:00`),
    );
    expect(checkStampVelocity(today, now)).toEqual({
      allowed: false,
      reason: "daily_limit",
    });
  });

  it("allows a normal stamp and detects earned rewards", () => {
    const now = new Date();
    const check = checkStampVelocity([new Date(now.getTime() - 3_600_000)], now);
    expect(check).toEqual({ allowed: true });
    expect(earnsReward(9, 9)).toBe(true);
    expect(earnsReward(18, 9)).toBe(true);
    expect(earnsReward(8, 9)).toBe(false);
  });
});
