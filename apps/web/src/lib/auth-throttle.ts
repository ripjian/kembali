import "server-only";

import { headers } from "next/headers";

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

import { qrTokenSecret } from "./config";

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
  /** Tight limit on this account from this address. */
  pairPolicy: ThrottlePolicy;
  /** Backstop for the account across all addresses. */
  identityPolicy: ThrottlePolicy;
  /** Limit for the address across all accounts. */
  ipPolicy: ThrottlePolicy;
}

export interface ConsumeResult extends ThrottleVerdict {
  /** Which limit tripped, for the log line. Never surfaced to the caller: the
   * message stays identical so a lockout leaks no account list. */
  axis: "pair" | "identity" | "ip" | null;
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
  const policies = [input.pairPolicy, input.identityPolicy, input.ipPolicy];
  const since = throttlePruneCutoff(policies, now);

  return db.transaction(async (tx) => {
    await tx.insert(schema.authAttempts).values({
      kind: input.kind,
      identifierHash: idHash,
      ipHash: input.addressKey,
      succeeded: false,
    });

    const rows = await tx
      .select({
        identifierHash: schema.authAttempts.identifierHash,
        ipHash: schema.authAttempts.ipHash,
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
          ),
        ),
      );

    const times = (predicate: (r: (typeof rows)[number]) => boolean) =>
      rows.filter(predicate).map((r) => r.createdAt);

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
  input: { kind: AttemptKind; identifier: string; addressKey: string },
): Promise<void> {
  await db
    .delete(schema.authAttempts)
    .where(
      and(
        eq(schema.authAttempts.kind, input.kind),
        eq(schema.authAttempts.identifierHash, identityKey(input.identifier)),
        eq(schema.authAttempts.ipHash, input.addressKey),
        eq(schema.authAttempts.succeeded, false),
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
  keys: { identifier: string; addressKey: string },
): void {
  const idPrefix = identityKey(keys.identifier).slice(0, 10);
  const ipPrefix = keys.addressKey.slice(0, 10);
  console.warn(
    `[auth] ${kind} locked on ${result.axis} axis after ${result.failures} failures ` +
      `(id:${idPrefix} addr:${ipPrefix}); retry in ${result.retryAfterSeconds}s`,
  );
}
