import {
  createHmac,
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { z } from "zod";

/* Auth primitives (SECURITY.md rules 5–6). Pure node:crypto - no native
 * dependencies. Server-only. */

/* ---- passwords (scrypt) --------------------------------------------- */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---- session tokens --------------------------------------------------- */

/** Raw token goes in the httpOnly cookie; only its sha256 is stored. */
export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ---- customer QR tokens (signed, short TTL - SECURITY.md rule 5) ------ */

const qrPayloadSchema = z.object({
  cardId: z.uuid(),
  tenantId: z.uuid(),
  exp: z.number().int(),
});

export type QrPayload = z.infer<typeof qrPayloadSchema>;

export const QR_TOKEN_TTL_SECONDS = 90;

function qrSignature(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signQrToken(
  payload: { cardId: string; tenantId: string },
  secret: string,
  now: Date = new Date(),
): string {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(now.getTime() / 1000) + QR_TOKEN_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${body}.${qrSignature(body, secret)}`;
}

export type QrVerifyResult =
  | { ok: true; payload: QrPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyQrToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): QrVerifyResult {
  const [body, signature] = token.split(".");
  if (!body || !signature) return { ok: false, reason: "malformed" };
  const expected = qrSignature(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const result = qrPayloadSchema.safeParse(parsed);
  if (!result.success) return { ok: false, reason: "malformed" };
  if (result.data.exp * 1000 < now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true, payload: result.data };
}

/* ---- OTP -------------------------------------------------------------- */

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash bound to the phone so a code can't be replayed for another number. */
export function hashOtpCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

/**
 * Development bypass code (founder-requested): accepted ONLY when the
 * caller passes `devBypassEnabled: true`, which the app derives from
 * non-production env (SECURITY.md - must never be enabled in production).
 */
export const OTP_DEV_BYPASS_CODE = "888888";

export function isOtpBypass(code: string, devBypassEnabled: boolean): boolean {
  return devBypassEnabled && code === OTP_DEV_BYPASS_CODE;
}
