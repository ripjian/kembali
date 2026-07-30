import { evaluateThrottle, LOGIN_PAIR_POLICY } from "@kembali/core";
import { and, eq, gte, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../schema";
import { createTestDb, type TestDb } from "./helpers";

/* `auth_attempts` is global auth infrastructure (SECURITY.md §4), like
 * `sessions`: no tenant column, reachable by the app role without a tenant
 * GUC, and never a place where personal data is stored in the clear. These
 * tests pin the storage contract the throttle relies on; the policy
 * arithmetic itself is unit-tested in @kembali/core. */

let db: TestDb;
let close: () => Promise<void>;

beforeEach(async () => {
  const created = await createTestDb();
  db = created.db;
  close = () => created.client.close();
});

afterEach(async () => {
  await close();
});

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const IP_A = "c".repeat(64);

async function seedFailures(count: number, at: Date, ipHash: string | null = IP_A) {
  for (let i = 0; i < count; i += 1) {
    await db.insert(schema.authAttempts).values({
      kind: "login",
      identifierHash: HASH_A,
      ipHash,
      succeeded: false,
      createdAt: at,
    });
  }
}

describe("auth_attempts storage", () => {
  it("has no tenant column: it is global, not tenant-scoped", () => {
    // Login attempts for platform admins belong to no tenant, so a
    // tenant_id here would be unfillable. Guards against someone "fixing"
    // this table by adding tenant scoping later.
    expect("tenantId" in schema.authAttempts).toBe(false);
  });

  it("is reachable without a tenant GUC set", async () => {
    await db.execute(sql`select set_config('app.tenant_id', '', true)`);
    await seedFailures(1, new Date());
    const rows = await db.select().from(schema.authAttempts);
    expect(rows).toHaveLength(1);
  });

  it("defaults succeeded to false so a bare insert counts against the limit", async () => {
    await db.insert(schema.authAttempts).values({
      kind: "login",
      identifierHash: HASH_A,
    });
    const [row] = await db.select().from(schema.authAttempts);
    expect(row?.succeeded).toBe(false);
    expect(row?.ipHash).toBeNull();
  });

  it("counts failures per identity, and the policy refuses the sixth", async () => {
    const now = new Date();
    // Six recorded attempts: the allowance is five, and the count includes
    // the attempt being judged, so this is the one that gets refused.
    await seedFailures(6, new Date(now.getTime() - 30_000));

    const rows = await db
      .select({ createdAt: schema.authAttempts.createdAt })
      .from(schema.authAttempts)
      .where(
        and(
          eq(schema.authAttempts.kind, "login"),
          eq(schema.authAttempts.identifierHash, HASH_A),
          eq(schema.authAttempts.succeeded, false),
        ),
      );

    const verdict = evaluateThrottle(
      rows.map((r) => r.createdAt),
      LOGIN_PAIR_POLICY,
      now,
    );
    expect(verdict.locked).toBe(true);
    expect(verdict.failures).toBe(6);
  });

  it("keeps identities separate: one locked account never locks another", async () => {
    const now = new Date();
    await seedFailures(5, new Date(now.getTime() - 30_000));
    await db.insert(schema.authAttempts).values({
      kind: "login",
      identifierHash: HASH_B,
      ipHash: null,
      succeeded: false,
    });

    const others = await db
      .select({ createdAt: schema.authAttempts.createdAt })
      .from(schema.authAttempts)
      .where(eq(schema.authAttempts.identifierHash, HASH_B));

    expect(
      evaluateThrottle(
        others.map((r) => r.createdAt),
        LOGIN_PAIR_POLICY,
        now,
      ).locked,
    ).toBe(false);
  });

  it("supports the success-clears-failures write the app relies on", async () => {
    await seedFailures(3, new Date());
    await db.insert(schema.authAttempts).values({
      kind: "login",
      identifierHash: HASH_A,
      ipHash: IP_A,
      succeeded: true,
    });
    await db
      .delete(schema.authAttempts)
      .where(
        and(
          eq(schema.authAttempts.kind, "login"),
          eq(schema.authAttempts.identifierHash, HASH_A),
          eq(schema.authAttempts.succeeded, false),
        ),
      );

    const remaining = await db.select().from(schema.authAttempts);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.succeeded).toBe(true);
  });

  it("prunes rows older than the window", async () => {
    const now = new Date();
    await seedFailures(2, new Date(now.getTime() - 3600_000));
    await seedFailures(1, now);

    const cutoff = new Date(now.getTime() - LOGIN_PAIR_POLICY.windowSeconds * 1000);
    await db.delete(schema.authAttempts).where(sql`created_at < ${cutoff}`);

    const rows = await db
      .select({ createdAt: schema.authAttempts.createdAt })
      .from(schema.authAttempts)
      .where(gte(schema.authAttempts.createdAt, cutoff));
    expect(rows).toHaveLength(1);
  });

  it("separates the three attempt kinds", async () => {
    const now = new Date();
    for (const kind of ["login", "otp_request", "otp_verify"] as const) {
      await db.insert(schema.authAttempts).values({
        kind,
        identifierHash: HASH_A,
        ipHash: IP_A,
        succeeded: false,
        createdAt: now,
      });
    }
    const logins = await db
      .select()
      .from(schema.authAttempts)
      .where(eq(schema.authAttempts.kind, "login"));
    expect(logins).toHaveLength(1);
  });
});
