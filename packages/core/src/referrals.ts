import { randomInt } from "node:crypto";

import { z } from "zod";

/* Referral program rules (ROADMAP §7 Phase 5, DEVSPEC §17). Pure: the
 * merchant's settings, a referrer's recent count and the two customer ids
 * go in; a verdict comes out. The database work (referral rows, point
 * events, voucher coupons) lives in the app and is tested on PGlite.
 *
 * Both sides are rewarded when the FRIEND'S FIRST STAMP lands, never at
 * sign-up: a fake sign-up earns nothing, a real first visit earns both. */

/** What one side receives. Points go straight to the ledger; a voucher is a
 * free coupon for one catalog item (a zero-cost redemption the cashier
 * confirms like any other). */
export const referralRewardSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("points"), points: z.number().int().min(1).max(100_000) }),
  z.object({ type: z.literal("voucher"), rewardItemId: z.uuid() }),
]);
export type ReferralReward = z.infer<typeof referralRewardSchema>;

export const referralSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  /** Reward for the existing member who invited. */
  referrer: referralRewardSchema.default({ type: "none" }),
  /** Reward for the friend who joined. */
  referee: referralRewardSchema.default({ type: "none" }),
  /** How many rewarded invites one member may earn per window (0 = no cap). */
  maxPerReferrer: z.number().int().min(0).max(1000).default(10),
  windowDays: z.number().int().min(1).max(365).default(30),
  /** Days a voucher stays valid once granted. */
  voucherValidDays: z.number().int().min(1).max(365).default(30),
});
export type ReferralSettings = z.infer<typeof referralSettingsSchema>;

export const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = referralSettingsSchema.parse({});

/** Merge stored JSON over the defaults; garbage never breaks the page. */
export function parseReferralSettings(raw: unknown): ReferralSettings {
  const parsed = referralSettingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : DEFAULT_REFERRAL_SETTINGS;
}

/* Personal invite codes: 6 characters from an alphabet without 0/O/1/I/L
 * so they survive being read out loud at a counter. Unique per tenant
 * (customers_tenant_referral_code_uq); a clash on insert is retried. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 6;

export function generateReferralCode(): string {
  let out = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isReferralCode(code: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`).test(code);
}

export type ReferralVerdict =
  | { ok: true }
  | { ok: false; reason: "disabled" | "self" | "cap" | "no_reward" };

/** May this invite be recorded at the friend's sign-up? `recentCount` is
 * how many invites the referrer already has (pending or rewarded) inside
 * the window. Self-invites are refused outright. */
export function evaluateReferral(input: {
  settings: ReferralSettings;
  referrerId: string;
  refereeId: string;
  recentCount: number;
}): ReferralVerdict {
  const { settings } = input;
  if (!settings.enabled) return { ok: false, reason: "disabled" };
  if (input.referrerId === input.refereeId) return { ok: false, reason: "self" };
  if (settings.referrer.type === "none" && settings.referee.type === "none") {
    return { ok: false, reason: "no_reward" };
  }
  if (settings.maxPerReferrer > 0 && input.recentCount >= settings.maxPerReferrer) {
    return { ok: false, reason: "cap" };
  }
  return { ok: true };
}

/** Start of the cap window, relative to `now`. */
export function referralWindowStart(settings: ReferralSettings, now: Date = new Date()): Date {
  return new Date(now.getTime() - settings.windowDays * 86_400_000);
}

/** When a granted voucher stops working. */
export function referralVoucherExpiry(settings: ReferralSettings, now: Date = new Date()): Date {
  return new Date(now.getTime() + settings.voucherValidDays * 86_400_000);
}
