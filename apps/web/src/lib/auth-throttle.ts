import "server-only";

import { randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";

import {
  evaluateThrottle,
  hashAuthIdentifier,
  throttlePruneCutoff,
  type ThrottlePolicy,
  type ThrottleVerdict,
} from "@kembali/core";
import { schema, type KembaliDb } from "@kembali/db";
import { and, eq, gte, lt, or } from "drizzle-orm";
import { z } from "zod";

import { IS_PRODUCTION, qrTokenSecret } from "./config";

/* Storage and counting for auth throttling (SECURITY.md rule 6).
 * The policy arithmetic is pure and tested in `@kembali/core/throttle`.
 *
 * `auth_attempts` is global auth infrastructure like `sessions`: no tenant
 * column, so these queries run on the plain app connection without a tenant
 * GUC.
 *
 * The order of operations matters. Every guarded call *records its attempt
 * first*, then counts, then decides. Checking before writing looks tidier but
 * is a time-of-check/time-of-use hole: a hundred parallel requests would all
 * read zero failures and all be allowed, so a burst walks straight through a
 * cap that only ever stopped sequential guessing. */

type AttemptKind = (typeof schema.authAttempts.$inferInsert)["kind"];

/**
 * Pepper for identifier and address hashes.
 *
 * Reuses the app's HMAC secret so no new env var is needed, but refuses the
 * dev fallback whenever a real database is configured: hashing Malaysian
 * phone numbers under a published constant would be reversible in seconds
 * against a ~10^8 keyspace, which is exactly the PDPA exposure the hashing
 * exists to prevent.
 */
function pepper(): string {
  const secret = process.env["QR_TOKEN_SECRET"];
  if (secret) return secret;
  if (process.env["DATABASE_URL"]) {
    throw new Error(
      "QR_TOKEN_SECRET is required whenever DATABASE_URL is set: auth-attempt hashes must not use the dev pepper",
    );
  }
  // Ephemeral local PGlite only.
  return qrTokenSecret();
}

/** Domain-separated so a leak of one hash space says nothing about another,
 * and so a secret that also signs QR payloads cannot be used to mine this
 * table by hashing a phone book. */
const identityKey = (value: string) => hashAuthIdentifier(`authid:v1:${value}`, pepper());
const addressKey = (value: string) => hashAuthIdentifier(`ip:v1:${value}`, pepper());
const deviceHashOf = (value: string) => hashAuthIdentifier(`device:v1:${value}`, pepper());

/* ---- device key ------------------------------------------------------- */

/** Opaque, httpOnly, security-only. Not readable by scripts and never used
 * for analytics: it exists so a browser that has been grinding credentials
 * stays recognisable when its address changes. */
const DEVICE_COOKIE = "kb_dev";
const DEVICE_TTL_DAYS = 180;

/**
 * Read the browser's device key, minting one if this is a first visit.
 *
 * Returns null only when the caller sends no cookie *and* the response
 * cannot set one, which is the scripted-attacker case: those fall through to
 * the address limits by design. Absent devices are never bucketed together,
 * because a shared "unknown device" bucket would let one attacker lock out
 * every first-time visitor.
 */
export async function deviceKey(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE)?.value;
  if (existing) return deviceHashOf(existing);

  const minted = randomBytes(24).toString("base64url");
  try {
    store.set(DEVICE_COOKIE, minted, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      path: "/",
      maxAge: DEVICE_TTL_DAYS * 86400,
    });
  } catch {
    // Cookies cannot be set while rendering; the caller is a page, not an
    // auth entry point. Skip the device axis rather than fail the request.
    return null;
  }
  return deviceHashOf(minted);
}

const ipSchema = z.union([z.ipv4(), z.ipv6()]);

/** Shared bucket for requests whose address we cannot establish. Better than
 * dropping the address axis entirely: address-less callers at least share one
 * budget, so a misconfigured proxy degrades the limit instead of removing it. */
const UNKNOWN_ADDRESS = "unknown";

let warnedNoAddress = false;

/**
 * Hashed client address.
 *
 * Reads `x-forwarded-for` first (the header platforms actually rewrite) and
 * takes its leftmost entry, which on Vercel is the real client because the
 * edge overwrites the header. `x-real-ip` is a fallback for proxies that set
 * only that. Entries are validated as IP literals, so an empty or junk header
 * cannot masquerade as an address, and empty values fall through instead of
 * silently disabling the axis.
 *
 * Trust caveat (documented in SECURITY.md): behind a proxy that forwards
 * client-supplied headers unmodified, this is attacker-controlled and the
 * address axis degrades to advisory. The pair and identity axes never depend
 * on it, which is why no limit rests on the address alone.
 */
export async function clientAddressKey(): Promise<string> {
  const store = await headers();
  const candidates = [
    ...(store.get("x-forwarded-for")?.split(",") ?? []),
    store.get("x-real-ip") ?? "",
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 45);

  for (const candidate of candidates) {
    if (ipSchema.safeParse(candidate).success) return addressKey(candidate);
  }

  if (!warnedNoAddress) {
    warnedNoAddress = true;
    console.warn(
      "[auth] no client address available from x-forwarded-for or x-real-ip; address limits are sharing one bucket. Check the proxy configuration.",
    );
  }
  return addressKey(UNKNOWN_ADDRESS);
}

export interface ConsumeInput {
  kind: AttemptKind;
  /** Email or phone being targeted. */
  identifier: string;
  addressKey: string;
  /** Browser key, or null when this caller keeps no cookies. */
  deviceKey: string | null;
  /** Tight limit on this account from this address. */
  pairPolicy: ThrottlePolicy;
  /** Backstop for the account across all addresses. */
  identityPolicy: ThrottlePolicy;
  /** Limit for the address across all accounts. */
  ipPolicy: ThrottlePolicy;
  /** Tight limit on this account from this browser. */
  devicePairPolicy: ThrottlePolicy;
  /** Limit for the browser across all accounts. */
  devicePolicy: ThrottlePolicy;
}

export interface ConsumeResult extends ThrottleVerdict {
  /** Which limit tripped, for the log line. Never surfaced to the caller: the
   * message stays identical so a lockout leaks no account list. */
  axis: "device-pair" | "device" | "pair" | "identity" | "ip" | null;
}

/**
 * Record one attempt and return whether the caller is now over a limit.
 *
 * Records first so the verdict includes this request (see the note at the top
 * about check-then-act). Runs in a transaction so the insert and the count
 * cannot interleave with a concurrent prune.
 */
export async function consumeAuthAttempt(
  db: KembaliDb,
  input: ConsumeInput,
): Promise<ConsumeResult> {
  const now = new Date();
  const idHash = identityKey(input.identifier);
  const device = input.deviceKey;
  const policies = [
    input.pairPolicy,
    input.identityPolicy,
    input.ipPolicy,
    input.devicePairPolicy,
    input.devicePolicy,
  ];
  const since = throttlePruneCutoff(policies, now);

  return db.transaction(async (tx) => {
    await tx.insert(schema.authAttempts).values({
      kind: input.kind,
      identifierHash: idHash,
      ipHash: input.addressKey,
      deviceHash: device,
      succeeded: false,
    });

    const rows = await tx
      .select({
        identifierHash: schema.authAttempts.identifierHash,
        ipHash: schema.authAttempts.ipHash,
        deviceHash: schema.authAttempts.deviceHash,
        createdAt: schema.authAttempts.createdAt,
      })
      .from(schema.authAttempts)
      .where(
        and(
          eq(schema.authAttempts.kind, input.kind),
          eq(schema.authAttempts.succeeded, false),
          gte(schema.authAttempts.createdAt, since),
          or(
            eq(schema.authAttempts.identifierHash, idHash),
            eq(schema.authAttempts.ipHash, input.addressKey),
            ...(device ? [eq(schema.authAttempts.deviceHash, device)] : []),
          ),
        ),
      );

    const times = (predicate: (r: (typeof rows)[number]) => boolean) =>
      rows.filter(predicate).map((r) => r.createdAt);

    // Device first: it is the most precise signal and the only key nobody
    // can forge onto someone else, so a lock here is never collateral damage.
    if (device) {
      const devicePair = evaluateThrottle(
        times((r) => r.identifierHash === idHash && r.deviceHash === device),
        input.devicePairPolicy,
        now,
      );
      if (devicePair.locked) return { ...devicePair, axis: "device-pair" as const };

      const deviceAll = evaluateThrottle(
        times((r) => r.deviceHash === device),
        input.devicePolicy,
        now,
      );
      if (deviceAll.locked) return { ...deviceAll, axis: "device" as const };
    }

    const pair = evaluateThrottle(
      times((r) => r.identifierHash === idHash && r.ipHash === input.addressKey),
      input.pairPolicy,
      now,
    );
    if (pair.locked) return { ...pair, axis: "pair" as const };

    const identity = evaluateThrottle(
      times((r) => r.identifierHash === idHash),
      input.identityPolicy,
      now,
    );
    if (identity.locked) return { ...identity, axis: "identity" as const };

    const ip = evaluateThrottle(
      times((r) => r.ipHash === input.addressKey),
      input.ipPolicy,
      now,
    );
    if (ip.locked) return { ...ip, axis: "ip" as const };

    return {
      locked: false,
      retryAfterSeconds: 0,
      failures: Math.max(pair.failures, identity.failures, ip.failures),
      axis: null,
    };
  });
}

/**
 * Clear this account's failures from this address after a genuine success.
 *
 * Scoped to the address on purpose: clearing every address would let a
 * victim's ordinary login refund an attacker's budget on the address axis.
 */
export async function clearAuthFailures(
  db: KembaliDb,
  input: {
    kind: AttemptKind;
    identifier: string;
    addressKey: string;
    deviceKey: string | null;
  },
): Promise<void> {
  const idHash = identityKey(input.identifier);
  await db
    .delete(schema.authAttempts)
    .where(
      and(
        eq(schema.authAttempts.kind, input.kind),
        // Always scoped to the account that just succeeded, so a success can
        // never refund an attacker's budget against a different account.
        eq(schema.authAttempts.identifierHash, idHash),
        eq(schema.authAttempts.succeeded, false),
        or(
          eq(schema.authAttempts.ipHash, input.addressKey),
          ...(input.deviceKey
            ? [eq(schema.authAttempts.deviceHash, input.deviceKey)]
            : []),
        ),
      ),
    );
}

/**
 * Drop rows of one kind that can no longer affect any verdict.
 *
 * Takes every policy for the kind: pruning against the shortest span would
 * unlock accounts a longer limit still holds. The `kind` filter matters for
 * the same reason, since login windows are minutes and OTP windows are hours.
 */
export async function pruneAuthAttempts(
  db: KembaliDb,
  kind: AttemptKind,
  policies: readonly ThrottlePolicy[],
): Promise<void> {
  const cutoff = throttlePruneCutoff(policies, new Date());
  await db
    .delete(schema.authAttempts)
    .where(and(eq(schema.authAttempts.kind, kind), lt(schema.authAttempts.createdAt, cutoff)));
}

/** Non-PII log line for a lockout: a short hash prefix is enough to correlate
 * lines during an incident and useless for identifying anyone
 * (SECURITY.md rule 10). */
export function logLockout(
  kind: AttemptKind,
  result: ConsumeResult,
  keys: { identifier: string; addressKey: string; deviceKey: string | null },
): void {
  const idPrefix = identityKey(keys.identifier).slice(0, 10);
  const ipPrefix = keys.addressKey.slice(0, 10);
  const devPrefix = keys.deviceKey ? keys.deviceKey.slice(0, 10) : "none";
  console.warn(
    `[auth] ${kind} locked on ${result.axis} axis after ${result.failures} failures ` +
      `(id:${idPrefix} addr:${ipPrefix} dev:${devPrefix}); retry in ${result.retryAfterSeconds}s`,
  );
}
