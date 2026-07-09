import { randomBytes } from "node:crypto";

/* Reward redemption rules (ROADMAP §7 Phase 2).
 *
 * Lifecycle: reserved (coupon shown to the customer) → redeemed (staff
 * confirm) | expired (never scanned in time) | cancelled (customer backed
 * out). Points are deducted at CONFIRM, not at reserve — an abandoned
 * coupon costs nothing and needs no refund ledger entry. The balance is
 * re-checked atomically inside the confirm transaction. */

/** Reserved coupons are meant to be scanned at the counter right away. */
export const REDEMPTION_TTL_MINUTES = 15;

/** No 0/O, 1/I/L — cashiers may have to read the fallback code out loud. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Unguessable single-use coupon code, e.g. KMB-7GXA-Q2ZM. Uniqueness is
 * ultimately enforced by the DB unique index; 31^8 ≈ 8.5e11 keeps
 * collisions and guessing impractical for short-lived coupons. */
export function generateRedemptionCode(): string {
  const bytes = randomBytes(8);
  let body = "";
  for (const b of bytes) body += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `KMB-${body.slice(0, 4)}-${body.slice(4)}`;
}

export function isRedemptionCode(value: string): boolean {
  return /^KMB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value.trim().toUpperCase());
}

/** Normalize what a scanner or a typing cashier produces. */
export function normalizeRedemptionCode(value: string): string {
  return value.trim().toUpperCase();
}

export function redemptionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + REDEMPTION_TTL_MINUTES * 60_000);
}
