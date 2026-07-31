import {
  ADMIN_SESSION_POLICY,
  CUSTOMER_SESSION_POLICY,
  evaluateSession,
  previousTokenCutoff,
} from "@kembali/core";
import { and, eq, isNotNull, lt, or, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import * as schema from "../schema";
import { createTestDb, type TestDb } from "./helpers";

/* Storage contract for session rotation. The lifetime arithmetic is unit
 * tested in @kembali/core; what needs a real database is the part that has to
 * hold under concurrency: a rotation must be a compare-and-set, so two
 * requests crossing the rotation boundary at the same moment cannot both win
 * and leave the browser holding a token the table never kept. */

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

const SUBJECT = "11111111-1111-1111-1111-111111111111";
const hash = (label: string) => label.padEnd(64, "0");

async function seedSession(overrides: Partial<typeof schema.sessions.$inferInsert> = {}) {
  const now = new Date();
  const [row] = await db
    .insert(schema.sessions)
    .values({
      tokenHash: hash("current"),
      kind: "platform",
      subjectId: SUBJECT,
      tenantId: null,
      expiresAt: new Date(now.getTime() + ADMIN_SESSION_POLICY.absoluteSeconds * 1000),
      ...overrides,
    })
    .returning();
  return row!;
}

/** The compare-and-set the app performs when it replaces a token. */
async function rotate(id: string, from: string, to: string, now = new Date()) {
  return db
    .update(schema.sessions)
    .set({
      tokenHash: to,
      previousTokenHash: from,
      previousValidUntil: new Date(now.getTime() + ADMIN_SESSION_POLICY.graceSeconds * 1000),
      rotatedAt: now,
      lastUsedAt: now,
      // The replacement has not been seen yet: it only counts as confirmed
      // once somebody presents it.
      tokenConfirmedAt: null,
    })
    .where(and(eq(schema.sessions.id, id), eq(schema.sessions.tokenHash, from)))
    .returning({ id: schema.sessions.id });
}

describe("session rotation storage", () => {
  it("starts the idle and rotation clocks at creation", async () => {
    const row = await seedSession();
    expect(row.lastUsedAt).toBeInstanceOf(Date);
    expect(row.rotatedAt).toBeInstanceOf(Date);
    expect(row.previousTokenHash).toBeNull();
    expect(row.previousValidUntil).toBeNull();
  });

  it("keeps the session row identity across a rotation", async () => {
    // The person stays signed in; only the value in their cookie changes.
    const row = await seedSession();
    await rotate(row.id, hash("current"), hash("next"));
    const [after] = await db.select().from(schema.sessions);
    expect(after?.id).toBe(row.id);
    expect(after?.subjectId).toBe(SUBJECT);
    expect(after?.tokenHash).toBe(hash("next"));
    expect(after?.previousTokenHash).toBe(hash("current"));
  });

  it("does not extend the absolute cap when the token rotates", async () => {
    const row = await seedSession();
    await rotate(row.id, hash("current"), hash("next"));
    const [after] = await db.select().from(schema.sessions);
    expect(after?.expiresAt.getTime()).toBe(row.expiresAt.getTime());
  });

  it("lets only one of two concurrent rotations win", async () => {
    const row = await seedSession();
    const [a, b] = await Promise.all([
      rotate(row.id, hash("current"), hash("racer-a")),
      rotate(row.id, hash("current"), hash("racer-b")),
    ]);
    // The loser gets no row back and must not write its token to the cookie.
    expect(a.length + b.length).toBe(1);

    const [after] = await db.select().from(schema.sessions);
    const winner = a.length === 1 ? hash("racer-a") : hash("racer-b");
    expect(after?.tokenHash).toBe(winner);
    expect(after?.previousTokenHash).toBe(hash("current"));
  });

  it("finds a session by either the current or the superseded hash", async () => {
    const row = await seedSession();
    await rotate(row.id, hash("current"), hash("next"));

    for (const presented of [hash("next"), hash("current")]) {
      const found = await db
        .select()
        .from(schema.sessions)
        .where(
          or(
            eq(schema.sessions.tokenHash, presented),
            eq(schema.sessions.previousTokenHash, presented),
          ),
        );
      expect(found).toHaveLength(1);
    }
  });

  it("accepts the superseded token during grace and calls it theft after", async () => {
    const now = new Date();
    const row = await seedSession();
    await rotate(row.id, hash("current"), hash("next"), now);
    const [after] = await db.select().from(schema.sessions);

    const state = {
      createdAt: after!.createdAt,
      lastUsedAt: after!.lastUsedAt,
      rotatedAt: after!.rotatedAt,
      presentedPrevious: true,
      previousValidUntil: after!.previousValidUntil,
      // The replacement is in use, so a late replay is a second holder.
      tokenConfirmed: true,
    };
    expect(evaluateSession(state, ADMIN_SESSION_POLICY, now).status).toBe("live");

    const late = new Date(now.getTime() + (ADMIN_SESSION_POLICY.graceSeconds + 1) * 1000);
    expect(evaluateSession(state, ADMIN_SESSION_POLICY, late).status).toBe("stolen");
  });

  it("clears a superseded hash once replaying it can teach us nothing", async () => {
    const now = new Date();
    const stale = new Date(now.getTime() - (ADMIN_SESSION_POLICY.reuseWindowSeconds + 60) * 1000);
    const row = await seedSession({
      previousTokenHash: hash("ancient"),
      previousValidUntil: stale,
    });
    const cutoff = previousTokenCutoff(ADMIN_SESSION_POLICY, now);

    await db
      .update(schema.sessions)
      .set({
        lastUsedAt: now,
        previousTokenHash: sql`case when ${schema.sessions.previousValidUntil} < ${cutoff} then null else ${schema.sessions.previousTokenHash} end`,
      })
      .where(eq(schema.sessions.id, row.id));

    const [after] = await db.select().from(schema.sessions);
    expect(after?.previousTokenHash).toBeNull();
  });

  it("keeps a superseded hash that is still inside the reuse window", async () => {
    const now = new Date();
    const row = await seedSession({
      previousTokenHash: hash("recent"),
      previousValidUntil: new Date(now.getTime() - 60_000),
    });
    const cutoff = previousTokenCutoff(ADMIN_SESSION_POLICY, now);

    await db
      .update(schema.sessions)
      .set({
        previousTokenHash: sql`case when ${schema.sessions.previousValidUntil} < ${cutoff} then null else ${schema.sessions.previousTokenHash} end`,
      })
      .where(eq(schema.sessions.id, row.id));

    const [after] = await db.select().from(schema.sessions);
    expect(after?.previousTokenHash).toBe(hash("recent"));
  });

  it("signs out on the superseded hash as well as the current one", async () => {
    const row = await seedSession();
    await rotate(row.id, hash("current"), hash("next"));
    // A sign-out that raced a rotation still carries the old cookie value.
    const presented = hash("current");
    await db
      .delete(schema.sessions)
      .where(
        or(
          eq(schema.sessions.tokenHash, presented),
          eq(schema.sessions.previousTokenHash, presented),
        ),
      );
    expect(await db.select().from(schema.sessions)).toHaveLength(0);
  });

  it("prunes sessions past their absolute cap and leaves live ones alone", async () => {
    const now = new Date();
    await seedSession({
      tokenHash: hash("dead"),
      expiresAt: new Date(now.getTime() - 1000),
    });
    await seedSession({ tokenHash: hash("alive") });

    await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now));
    const rows = await db.select().from(schema.sessions);
    expect(rows.map((r) => r.tokenHash)).toEqual([hash("alive")]);
  });

  it("ages out superseded hashes on sessions that stopped rotating", async () => {
    const now = new Date();
    const cutoff = previousTokenCutoff(CUSTOMER_SESSION_POLICY, now);
    await seedSession({
      tokenHash: hash("idle-tab"),
      previousTokenHash: hash("long-gone"),
      previousValidUntil: new Date(cutoff.getTime() - 1000),
    });

    await db
      .update(schema.sessions)
      .set({ previousTokenHash: null, previousValidUntil: null })
      .where(
        and(
          isNotNull(schema.sessions.previousTokenHash),
          lt(schema.sessions.previousValidUntil, cutoff),
        ),
      );

    const [after] = await db.select().from(schema.sessions);
    expect(after?.previousTokenHash).toBeNull();
    expect(after?.tokenHash).toBe(hash("idle-tab"));
  });

  it("marks a rotated token unconfirmed until somebody presents it", async () => {
    // Null here is what lets a dropped rotation reply be told apart from a
    // replayed token: with nobody using the replacement, a browser still on
    // the old one is the same browser, not a thief.
    const row = await seedSession({ tokenConfirmedAt: new Date() });
    await rotate(row.id, hash("current"), hash("next"));
    const [after] = await db.select().from(schema.sessions);
    expect(after?.tokenConfirmedAt).toBeNull();

    const now = new Date();
    const state = {
      createdAt: after!.createdAt,
      lastUsedAt: after!.lastUsedAt,
      rotatedAt: after!.rotatedAt,
      presentedPrevious: true,
      previousValidUntil: after!.previousValidUntil,
      tokenConfirmed: after!.tokenConfirmedAt !== null,
    };
    const late = new Date(now.getTime() + (ADMIN_SESSION_POLICY.graceSeconds + 1) * 1000);
    expect(evaluateSession(state, ADMIN_SESSION_POLICY, late).status).toBe("live");

    // The browser that received it uses it, and the same replay is now theft.
    await db
      .update(schema.sessions)
      .set({ tokenConfirmedAt: now })
      .where(eq(schema.sessions.id, row.id));
    const [confirmed] = await db.select().from(schema.sessions);
    expect(
      evaluateSession(
        { ...state, tokenConfirmed: confirmed!.tokenConfirmedAt !== null },
        ADMIN_SESSION_POLICY,
        late,
      ).status,
    ).toBe("stolen");
  });

  it("clears both halves of a superseded token, never just the hash", async () => {
    // A row with a dangling validity and no hash is a state no read path
    // produces and the cleanup query cannot reach, since it filters on the
    // hash being present.
    const now = new Date();
    const cutoff = previousTokenCutoff(ADMIN_SESSION_POLICY, now);
    const row = await seedSession({
      previousTokenHash: hash("ancient"),
      previousValidUntil: new Date(cutoff.getTime() - 1000),
    });
    await db
      .update(schema.sessions)
      .set({
        previousTokenHash: sql`case when ${schema.sessions.previousValidUntil} < ${cutoff} then null else ${schema.sessions.previousTokenHash} end`,
        previousValidUntil: sql`case when ${schema.sessions.previousValidUntil} < ${cutoff} then null else ${schema.sessions.previousValidUntil} end`,
      })
      .where(eq(schema.sessions.id, row.id));
    const [after] = await db.select().from(schema.sessions);
    expect(after?.previousTokenHash).toBeNull();
    expect(after?.previousValidUntil).toBeNull();
  });

  it("gives each session kind its own reuse window", async () => {
    // Staff hashes kept to the customer window would sit on file for twice as
    // long as the policy says.
    const now = new Date();
    await seedSession({
      tokenHash: hash("staff"),
      kind: "staff",
      previousTokenHash: hash("old-staff"),
      // Older than the admin window (12h), newer than the customer one (24h).
      previousValidUntil: new Date(now.getTime() - 18 * 3600 * 1000),
    });

    await db
      .update(schema.sessions)
      .set({ previousTokenHash: null, previousValidUntil: null })
      .where(
        and(
          eq(schema.sessions.kind, "staff"),
          isNotNull(schema.sessions.previousTokenHash),
          lt(schema.sessions.previousValidUntil, previousTokenCutoff(ADMIN_SESSION_POLICY, now)),
        ),
      );

    const [after] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.tokenHash, hash("staff")));
    expect(after?.previousTokenHash).toBeNull();
  });

  it("still stores no raw token: every column holding one is a hash", async () => {
    const row = await seedSession({ previousTokenHash: hash("old") });
    expect(row.tokenHash).toHaveLength(64);
    expect(row.previousTokenHash).toHaveLength(64);
    expect("token" in row).toBe(false);
  });
});
