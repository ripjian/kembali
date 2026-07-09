import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

let db: TestDb;
let client: Awaited<ReturnType<typeof createTestDb>>["client"];

beforeAll(async () => {
  ({ db, client } = await createTestDb());
});

afterAll(async () => {
  await client?.close();
});

describe("seed script", () => {
  it("runs clean on an empty database", async () => {
    const summary = await seed(db);
    expect(summary.tenants).toBe(1);
    expect(summary.customers).toBe(3);
    expect(summary.cards).toBe(3);
    expect(summary.stampEvents).toBe(14);
  });

  it("is idempotent — re-running does not duplicate rows or balances", async () => {
    await seed(db);
    const customers = await db.select().from(schema.customers);
    const events = await db.select().from(schema.stampEvents);
    const pointEvents = await db.select().from(schema.pointEvents);
    expect(customers).toHaveLength(3);
    expect(events).toHaveLength(14);
    expect(pointEvents).toHaveLength(15);
    // Re-running must not have re-fired the balance projection trigger.
    for (const customer of customers) {
      const [row] = await db
        .select({ total: sql<number>`coalesce(sum(delta), 0)::int` })
        .from(schema.pointEvents)
        .where(sql`${schema.pointEvents.customerId} = ${customer.id}`);
      expect(customer.pointsBalance).toBe(row?.total);
    }
  });

  it("keeps stamps_count consistent with the stamp_events ledger", async () => {
    const cards = await db.select().from(schema.cards);
    for (const card of cards) {
      const [row] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.stampEvents)
        .where(sql`${schema.stampEvents.cardId} = ${card.id}`);
      expect(row?.n).toBe(card.stampsCount);
    }
  });

  it("completed card earned a reward", async () => {
    const rewards = await db.select().from(schema.rewards);
    expect(rewards).toHaveLength(1);
    expect(rewards[0]?.cardId).toBe(SEED_IDS.cards.mingWei);
    expect(rewards[0]?.state).toBe("earned");
  });
});
