import "server-only";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** HMAC secret for customer QR tokens. Required in production (env.ts
 * enforces it); a fixed dev value keeps local setup zero-config. */
export function qrTokenSecret(): string {
  const secret = process.env["QR_TOKEN_SECRET"];
  if (secret) return secret;
  if (IS_PRODUCTION) throw new Error("QR_TOKEN_SECRET is required in production");
  return "kembali-dev-qr-secret-not-for-production";
}

/** OTP dev bypass (888888) — hard-disabled in production builds
 * (SECURITY.md). Real SMS/WhatsApp delivery is a Phase 1 remaining item. */
export const OTP_BYPASS_ENABLED = !IS_PRODUCTION;

export const CUSTOMER_SESSION_TTL_DAYS = 30;
export const ADMIN_SESSION_TTL_HOURS = 12;
