/**
 * Merchant-side settings (2026-09-21): outlets retire instead of deleting,
 * programs record their last edit, and the platform admin can read billing
 * audit rows across tenants while a tenant still sees only its own.
 */
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withPlatform, withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

const A = SEED_IDS.tenant;
const B = SEED_IDS.starterTenant;

let db: TestDb;

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seed(db);
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await db.execute(sql`reset role`);
});

describe("outlets", () => {
  it("start active, can be retired, and events still reference them", async () => {
    await withTenant(db, A, (tx) =>
      tx.update(schema.outlets).set({ active: false }).where(eq(schema.outlets.id, SEED_IDS.outlet2)),
    );
    const rows = await withTenant(db, A, (tx) =>
      tx.select({ id: schema.outlets.id, active: schema.outlets.active }).from(schema.outlets),
    );
    expect(rows.find((o) => o.id === SEED_IDS.outlet)?.active).toBe(true);
    expect(rows.find((o) => o.id === SEED_IDS.outlet2)?.active).toBe(false);
    const [stamp] = await withTenant(db, A, (tx) =>
      tx.insert(schema.stampEvents).values({
        tenantId: A,
        cardId: SEED_IDS.cards.priya,
        outletId: SEED_IDS.outlet2,
        source: "manual",
      }).returning({ outletId: schema.stampEvents.outletId }),
    );
    expect(stamp?.outletId).toBe(SEED_IDS.outlet2);
  });

  it("another tenant cannot retire or rename them", async () => {
    const updated = await withTenant(db, B, (tx) =>
      tx
        .update(schema.outlets)
        .set({ name: "Hijacked" })
        .where(eq(schema.outlets.id, SEED_IDS.outlet))
        .returning({ id: schema.outlets.id }),
    );
    expect(updated).toHaveLength(0);
  });
});

describe("program edits", () => {
  it("record updated_at and keep the program row", async () => {
    await withTenant(db, A, (tx) =>
      tx
        .update(schema.programs)
        .set({ stampsRequired: 6, updatedAt: new Date() })
        .where(eq(schema.programs.id, SEED_IDS.program)),
    );
    const [p] = await withTenant(db, A, (tx) =>
      tx.select().from(schema.programs).where(eq(schema.programs.id, SEED_IDS.program)),
    );
    expect(p?.stampsRequired).toBe(6);
    expect(p?.updatedAt).not.toBeNull();
  });
});

describe("billing audit rows", () => {
  it("are readable across tenants by the platform admin only", async () => {
    await withTenant(db, A, (tx) =>
      tx.insert(schema.auditLog).values({
        tenantId: A,
        actorType: "staff",
        actorId: SEED_IDS.staffOwner,
        action: "outlet.created",
        entity: "outlet",
        entityId: SEED_IDS.outlet2,
        meta: { name: "Bangsar Village", billing: true },
      }),
    );
    const platformView = await withPlatform(db, (tx) =>
      tx.select({ tenantId: schema.auditLog.tenantId }).from(schema.auditLog).where(eq(schema.auditLog.action, "outlet.created")),
    );
    expect(platformView.some((r) => r.tenantId === A)).toBe(true);
    const fromB = await withTenant(db, B, (tx) =>
      tx.select().from(schema.auditLog).where(eq(schema.auditLog.action, "outlet.created")),
    );
    expect(fromB).toHaveLength(0);
  });
});
