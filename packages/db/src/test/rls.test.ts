/**
 * Cross-tenant isolation proof (CLAUDE.md definition of done).
 *
 * Connects as the `kembali_app` role (what the apps use in production) and
 * verifies RLS makes another tenant's data unreachable — reads, writes, and
 * even knowing a row's primary key. Also proves stamp_events is append-only
 * for everyone, including the table owner.
 */
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

/** Drizzle wraps DB errors in DrizzleQueryError ("Failed query: …") with the
 * Postgres error in `.cause` — match the pattern anywhere in the chain. */
async function expectRejectsWith(promise: Promise<unknown>, pattern: RegExp) {
  let thrown: unknown;
  try {
    await promise;
  } catch (err) {
    thrown = err;
  }
  expect(thrown, "expected the query to be rejected").toBeDefined();
  const messages: string[] = [];
  for (let e = thrown; e instanceof Error; e = e.cause) {
    messages.push(e.message);
  }
  expect(messages.join(" | ")).toMatch(pattern);
}

const TENANT_A = SEED_IDS.tenant;
const TENANT_B = "99999999-9999-4999-8999-999999999999";
const B_CUSTOMER = "99999999-9999-4999-8999-999999999901";
const B_PROGRAM = "99999999-9999-4999-8999-999999999902";
const B_CARD = "99999999-9999-4999-8999-999999999903";

let db: TestDb;
let client: Awaited<ReturnType<typeof createTestDb>>["client"];

beforeAll(async () => {
  ({ db, client } = await createTestDb());

  // Tenant A: full demo seed. Tenant B: a minimal second tenant.
  await seed(db);
  await db.insert(schema.tenants).values({
    id: TENANT_B,
    name: "Rival Coffee",
    slug: "rival-coffee",
  });
  await db.insert(schema.customers).values({
    id: B_CUSTOMER,
    tenantId: TENANT_B,
    phone: "+60199999901",
    name: "Rival Customer",
  });
  await db.insert(schema.programs).values({
    id: B_PROGRAM,
    tenantId: TENANT_B,
    name: "Rival Card",
    stampsRequired: 10,
  });
  await db.insert(schema.cards).values({
    id: B_CARD,
    tenantId: TENANT_B,
    customerId: B_CUSTOMER,
    programId: B_PROGRAM,
    stampsCount: 2,
  });

  // Everything below runs as the unprivileged app role, like production.
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await client?.close();
});

describe("RLS tenant isolation (as kembali_app)", () => {
  it("sees no rows at all when no tenant context is set", async () => {
    const rows = await db.select().from(schema.customers);
    expect(rows).toHaveLength(0);
  });

  it("sees only its own tenant's customers", async () => {
    const rows = await withTenant(db, TENANT_A, (tx) =>
      tx.select().from(schema.customers),
    );
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.tenantId === TENANT_A)).toBe(true);
  });

  it("cannot read another tenant's row even by primary key", async () => {
    const rows = await withTenant(db, TENANT_A, (tx) =>
      tx
        .select()
        .from(schema.customers)
        .where(sql`${schema.customers.id} = ${B_CUSTOMER}`),
    );
    expect(rows).toHaveLength(0);
  });

  it("cannot see the other tenant in the tenants table", async () => {
    const rows = await withTenant(db, TENANT_A, (tx) =>
      tx.select().from(schema.tenants),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(TENANT_A);
  });

  it("cannot insert rows tagged with another tenant's id", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx.insert(schema.customers).values({
          tenantId: TENANT_B,
          phone: "+60100000000",
          name: "Smuggled Customer",
        }),
      ),
      /row-level security/i,
    );
  });

  it("cannot update another tenant's card (0 rows matched)", async () => {
    const updated = await withTenant(db, TENANT_A, (tx) =>
      tx
        .update(schema.cards)
        .set({ stampsCount: 999 })
        .where(sql`${schema.cards.id} = ${B_CARD}`)
        .returning(),
    );
    expect(updated).toHaveLength(0);

    // …and tenant B's card is untouched.
    const [bCard] = await withTenant(db, TENANT_B, (tx) =>
      tx.select().from(schema.cards),
    );
    expect(bCard?.stampsCount).toBe(2);
  });

  it("cannot delete another tenant's data", async () => {
    const deleted = await withTenant(db, TENANT_A, (tx) =>
      tx
        .delete(schema.rewards)
        .where(sql`${schema.rewards.tenantId} = ${TENANT_B}`)
        .returning(),
    );
    expect(deleted).toHaveLength(0);
  });

  it("can insert stamp events for its own tenant", async () => {
    await withTenant(db, TENANT_A, (tx) =>
      tx.insert(schema.stampEvents).values({
        tenantId: TENANT_A,
        cardId: SEED_IDS.cards.priya,
        outletId: SEED_IDS.outlet,
        staffId: SEED_IDS.staffCashier,
        source: "qr",
      }),
    );
    const events = await withTenant(db, TENANT_A, (tx) =>
      tx
        .select()
        .from(schema.stampEvents)
        .where(sql`${schema.stampEvents.cardId} = ${SEED_IDS.cards.priya}`),
    );
    expect(events).toHaveLength(2);
  });
});

describe("GUC edge cases", () => {
  it("returns zero rows (not an error) after a tenant transaction reverts", async () => {
    // Postgres quirk: after a transaction-local set_config reverts, the GUC
    // reads as '' (not NULL). Policies must nullif() the cast — regression
    // for the '""::uuid' crash hit by platform-session queries.
    await withTenant(db, TENANT_A, (tx) => tx.select().from(schema.customers));
    const rows = await db.select().from(schema.staffUsers);
    expect(rows).toHaveLength(0);
  });
});

describe("stamp_events append-only ledger", () => {
  // As the app role, UPDATE/DELETE die on the missing grant (permission
  // denied) before the trigger can even fire — two independent layers.
  it("rejects UPDATE as the app role", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx.update(schema.stampEvents).set({ source: "manual" }),
      ),
      /permission denied|append-only/i,
    );
  });

  it("rejects DELETE as the app role", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) => tx.delete(schema.stampEvents)),
      /permission denied|append-only/i,
    );
  });

  it("rejects UPDATE/DELETE even as the table owner", async () => {
    await db.execute(sql`reset role`);
    try {
      await expectRejectsWith(
        db.update(schema.stampEvents).set({ source: "manual" }),
        /append-only/i,
      );
      await expectRejectsWith(db.delete(schema.stampEvents), /append-only/i);
    } finally {
      await db.execute(sql`set role kembali_app`);
    }
  });
});
