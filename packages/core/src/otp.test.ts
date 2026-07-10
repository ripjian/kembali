import { describe, expect, it } from "vitest";

import {
  assertOtpDeliverable,
  isDeliverableOtpProvider,
  showsDevOtpNotice,
} from "./otp";
import { needsRegistration } from "./registration";

describe("isDeliverableOtpProvider", () => {
  it("treats none/empty as non-delivering and any named provider as delivering", () => {
    expect(isDeliverableOtpProvider("none")).toBe(false);
    expect(isDeliverableOtpProvider("")).toBe(false);
    expect(isDeliverableOtpProvider("  ")).toBe(false);
    expect(isDeliverableOtpProvider("whatsapp")).toBe(true);
    expect(isDeliverableOtpProvider("sms")).toBe(true);
  });
});

describe("assertOtpDeliverable", () => {
  it("throws in production when no real provider is configured", () => {
    expect(() => assertOtpDeliverable("none", true)).toThrow(/production/i);
    expect(() => assertOtpDeliverable("", true)).toThrow(/production/i);
  });

  it("allows a real provider in production and any provider outside production", () => {
    expect(() => assertOtpDeliverable("whatsapp", true)).not.toThrow();
    expect(() => assertOtpDeliverable("none", false)).not.toThrow();
    expect(() => assertOtpDeliverable("whatsapp", false)).not.toThrow();
  });
});

describe("showsDevOtpNotice", () => {
  it("shows only when there is no provider AND the build is non-production", () => {
    expect(showsDevOtpNotice("none", false)).toBe(true);
    expect(showsDevOtpNotice("none", true)).toBe(false); // never in production
    expect(showsDevOtpNotice("whatsapp", false)).toBe(false); // real provider
    expect(showsDevOtpNotice("whatsapp", true)).toBe(false);
  });
});

describe("needsRegistration", () => {
  it("is true for a brand-new or nameless customer", () => {
    expect(needsRegistration(null)).toBe(true);
    expect(needsRegistration(undefined)).toBe(true);
    expect(needsRegistration({ name: null })).toBe(true);
    expect(needsRegistration({ name: "" })).toBe(true);
    expect(needsRegistration({ name: "   " })).toBe(true);
  });

  it("is false for a returning customer who already gave a name", () => {
    expect(needsRegistration({ name: "Aisyah" })).toBe(false);
  });
});
