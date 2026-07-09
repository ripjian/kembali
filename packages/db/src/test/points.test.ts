/**
 * Phase 2 ledger + redemption proofs (ROADMAP §7 Phase 2 exit criteria):
 *  - point_events / reward_items / redemptions are tenant-isolated under RLS
 *  - point_events is append-only for the app role AND the table owner
 *  - customers.points_balance is a read-only projection: direct UPDATEs are
 *    rejected, and after any mix of events it equals Σ point_events.delta
 *  - stamps reconcile too: cards.stamps_count = count(stamp_events)
 *  - redemption codes are single-use under concurrent confirm attempts
 */
import { generateRedemptionCode } from "@kembali/core";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

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
const B_REWARD_ITEM = "99999999-9999-4999-8999-999999999904";

let db: TestDb;
let client: Awaited<ReturnType<typeof createTestDb>>["client"];

beforeAll(async () => {
  ({ db, client } = await createTestDb());
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
  await db.insert(schema.rewardItems).values({
    id: B_REWARD_ITEM,
    tenantId: TENANT_B,
    title: "Rival reward",
    pointsCost: 10,
  });
  await db.insert(schema.pointEvents).values({
    tenantId: TENANT_B,
    customerId: B_CUSTOMER,
    delta: 500,
    source: "adjustment",
    reason: "rival seed",
  });
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await client?.close();
});

describe("RLS isolation for points & rewards tables", () => {
  it("sees only its own point events, reward items and redemptions", async () => {
    const { pointEvents, rewardItems, redemptions } = await withTenant(
      db,
      TENANT_A,
      async (tx) => ({
        pointEvents: await tx.select().from(schema.pointEvents),
        rewardItems: await tx.select().from(schema.rewardItems),
        redemptions: await tx.select().from(schema.redemptions),
      }),
    );
    expect(pointEvents.length).toBeGreaterThan(0);
    expect(pointEvents.every((e) => e.tenantId === TENANT_A)).toBe(true);
    expect(rewardItems).toHaveLength(4);
    expect(rewardItems.every((r) => r.tenantId === TENANT_A)).toBe(true);
    expect(redemptions.every((r) => r.tenantId === TENANT_A)).toBe(true);
  });

  it("cannot insert a point event tagged with another tenant", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx.insert(schema.pointEvents).values({
          tenantId: TENANT_B,
          customerId: B_CUSTOMER,
          delta: 9999,
          source: "adjustment",
          reason: "smuggled",
        }),
      ),
      /row-level security/i,
    );
  });

  it("cannot reserve a redemption against another tenant", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx.insert(schema.redemptions).values({
          tenantId: TENANT_B,
          rewardItemId: B_REWARD_ITEM,
          customerId: B_CUSTOMER,
          code: generateRedemptionCode(),
          pointsCost: 10,
          expiresAt: new Date(Date.now() + 60_000),
        }),
      ),
      /row-level security/i,
    );
  });
});

describe("point_events append-only ledger", () => {
  it("rejects UPDATE and DELETE as the app role", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx.update(schema.pointEvents).set({ delta: 0 }),
      ),
      /permission denied|append-only/i,
    );
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) => tx.delete(schema.pointEvents)),
      /permission denied|append-only/i,
    );
  });

  it("rejects UPDATE/DELETE even as the table owner", async () => {
    await db.execute(sql`reset role`);
    try {
      await expectRejectsWith(
        db.update(schema.pointEvents).set({ delta: 0 }),
        /append-only/i,
      );
      await expectRejectsWith(db.delete(schema.pointEvents), /append-only/i);
    } finally {
      await db.execute(sql`set role kembali_app`);
    }
  });
});

describe("points_balance read-only projection", () => {
  it("rejects direct UPDATEs to points_balance, even as the owner", async () => {
    await expectRejectsWith(
      withTenant(db, TENANT_A, (tx) =>
        tx
          .update(schema.customers)
          .set({ pointsBalance: 1_000_000 })
          .where(sql`${schema.customers.id} = ${SEED_IDS.customers.aisyah}`),
      ),
      /read-only projection/i,
    );
    await db.execute(sql`reset role`);
    try {
      await expectRejectsWith(
        db
          .update(schema.customers)
          .set({ pointsBalance: 1_000_000 })
          .where(sql`${schema.customers.id} = ${SEED_IDS.customers.aisyah}`),
        /read-only projection/i,
      );
    } finally {
      await db.execute(sql`set role kembali_app`);
    }
  });

  it("still allows unrelated customer edits", async () => {
    const [row] = await withTenant(db, TENANT_A, (tx) =>
      tx
        .update(schema.customers)
        .set({ name: "Aisyah binti Yusof" })
        .where(sql`${schema.customers.id} = ${SEED_IDS.customers.aisyah}`)
        .returning({ name: schema.customers.name }),
    );
    expect(row?.name).toBe("Aisyah binti Yusof");
  });

  it("moves with inserted ledger events and reconciles to Σ deltas", async () => {
    const read = () =>
      withTenant(db, TENANT_A, async (tx) => {
        const [customer] = await tx
          .select({ balance: schema.customers.pointsBalance })
          .from(schema.customers)
          .where(sql`${schema.customers.id} = ${SEED_IDS.customers.priya}`);
        const [total] = await tx
          .select({ sum: sql<number>`coalesce(sum(delta), 0)::int` })
          .from(schema.pointEvents)
          .where(sql`${schema.pointEvents.customerId} = ${SEED_IDS.customers.priya}`);
        return { balance: customer!.balance, sum: total!.sum };
      });

    const before = await read();
    expect(before.balance).toBe(before.sum);

    await withTenant(db, TENANT_A, async (tx) => {
      await tx.insert(schema.pointEvents).values([
        {
          tenantId: TENANT_A,
          customerId: SEED_IDS.customers.priya,
          delta: 40,
          source: "adjustment",
          reason: "test top-up",
          staffId: SEED_IDS.staffOwner,
        },
        {
          tenantId: TENANT_A,
          customerId: SEED_IDS.customers.priya,
          delta: -15,
          source: "adjustment",
          reason: "test deduction",
          staffId: SEED_IDS.staffOwner,
        },
      ]);
    });

    const after = await read();
    expect(after.balance).toBe(before.balance + 25);
    expect(after.balance).toBe(after.sum);
  });
});

describe("ledger reconciliation (stamps AND points, Phase 2 exit criteria)", () => {
  it("every card's stamps_count equals its stamp_events count", async () => {
    const results = await withTenant(db, TENANT_A, async (tx) => {
      const cards = await tx.select().from(schema.cards);
      const counts = [];
      for (const card of cards) {
        const [row] = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(schema.stampEvents)
          .where(sql`${schema.stampEvents.cardId} = ${card.id}`);
        counts.push({ projected: card.stampsCount, ledger: row!.n });
      }
      return counts;
    });
    expect(results.length).toBeGreaterThan(0);
    for (const { projected, ledger } of results) {
      expect(projected).toBe(ledger);
    }
  });

  it("every customer's points_balance equals Σ point_events.delta", async () => {
    const results = await withTenant(db, TENANT_A, async (tx) => {
      const customers = await tx.select().from(schema.customers);
      const rows = [];
      for (const customer of customers) {
        const [total] = await tx
          .select({ sum: sql<number>`coalesce(sum(delta), 0)::int` })
          .from(schema.pointEvents)
          .where(sql`${schema.pointEvents.customerId} = ${customer.id}`);
        rows.push({ projected: customer.pointsBalance, ledger: total!.sum });
      }
      return rows;
    });
    expect(results.length).toBeGreaterThan(0);
    for (const { projected, ledger } of results) {
      expect(projected).toBe(ledger);
    }
  });
});

describe("redemption codes are single-use", () => {
  it("only one of many concurrent confirms wins", async () => {
    const code = generateRedemptionCode();
    await withTenant(db, TENANT_A, (tx) =>
      tx.insert(schema.redemptions).values({
        tenantId: TENANT_A,
        rewardItemId: SEED_IDS.rewardItems.pastry,
        customerId: SEED_IDS.customers.mingWei,
        code,
        pointsCost: 80,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      }),
    );

    // The confirm statement used by the API: the state='reserved' guard on
    // an atomic UPDATE means whichever statement runs first flips the row
    // and every rival matches zero rows.
    const confirm = () =>
      withTenant(db, TENANT_A, (tx) =>
        tx
          .update(schema.redemptions)
          .set({
            state: "redeemed",
            redeemedAt: new Date(),
            redeemedByStaffId: SEED_IDS.staffCashier,
          })
          .where(
            sql`${schema.redemptions.code} = ${code} and ${schema.redemptions.state} = 'reserved'`,
          )
          .returning({ id: schema.redemptions.id }),
      );

    const results = await Promise.all([confirm(), confirm(), confirm(), confirm()]);
    const winners = results.filter((rows) => rows.length > 0);
    expect(winners).toHaveLength(1);

    // …and the code can never be spent again afterwards.
    const retry = await confirm();
    expect(retry).toHaveLength(0);
  });
});
