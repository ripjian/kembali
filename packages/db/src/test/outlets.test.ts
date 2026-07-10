/**
 * Outlet attribution (Decision Log 2026-07-11): every stamp/point/redemption
 * event carries an outlet_id, and the "serving outlet" pick is tenant-safe -
 * a cookie/outlet id from another tenant can never attribute your events
 * (RLS makes it unreachable, so the pick falls back to your own outlet).
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

/** Mirror of apps/web pickOutletId: preferred outlet if it belongs to this
 * tenant (RLS-scoped select), else the tenant's first outlet. */
async function pickOutletId(tx: TestDb, preferredId: string | null) {
  if (preferredId) {
    const [match] = await tx
      .select({ id: schema.outlets.id })
      .from(schema.outlets)
      .where(and(eq(schema.outlets.id, preferredId)));
    if (match) return match.id;
  }
  const [first] = await tx
    .select({ id: schema.outlets.id })
    .from(schema.outlets)
    .orderBy(asc(schema.outlets.createdAt))
    .limit(1);
  return first?.id ?? null;
}

const TENANT_A = SEED_IDS.tenant;
const TENANT_B = "99999999-9999-4999-8999-999999999999";
const B_OUTLET = "99999999-9999-4999-8999-9999999999a1";

let db: TestDb;
let client: Awaited<ReturnType<typeof createTestDb>>["client"];

beforeAll(async () => {
  ({ db, client } = await createTestDb());
  await seed(db);
  await db.insert(schema.tenants).values({ id: TENANT_B, name: "Rival", slug: "rival" });
  await db
    .insert(schema.outlets)
    .values({ id: B_OUTLET, tenantId: TENANT_B, name: "Rival outlet" });
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await client?.close();
});

describe("event outlet attribution", () => {
  it("seeded transaction point-events all carry an outlet", async () => {
    const rows = await withTenant(db, TENANT_A, (tx) =>
      tx
        .select({ outletId: schema.pointEvents.outletId })
        .from(schema.pointEvents)
        .where(eq(schema.pointEvents.source, "transaction")),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.outletId === SEED_IDS.outlet)).toBe(true);
  });

  it("attributes a stamp and its points to the chosen outlet", async () => {
    const chosen = SEED_IDS.outlet2; // the second Corner Coffee outlet
    const { stampOutlet, pointOutlet } = await withTenant(db, TENANT_A, async (tx) => {
      const outletId = await pickOutletId(tx, chosen);
      const [stamp] = await tx
        .insert(schema.stampEvents)
        .values({
          tenantId: TENANT_A,
          cardId: SEED_IDS.cards.priya,
          outletId: outletId!,
          staffId: SEED_IDS.staffCashier,
          source: "qr",
          amountCents: 500,
        })
        .returning({ id: schema.stampEvents.id, outletId: schema.stampEvents.outletId });
      const [pt] = await tx
        .insert(schema.pointEvents)
        .values({
          tenantId: TENANT_A,
          customerId: SEED_IDS.customers.priya,
          delta: 5,
          source: "transaction",
          stampEventId: stamp!.id,
          outletId,
        })
        .returning({ outletId: schema.pointEvents.outletId });
      return { stampOutlet: stamp!.outletId, pointOutlet: pt!.outletId };
    });
    expect(stampOutlet).toBe(chosen);
    expect(pointOutlet).toBe(chosen);
  });

  it("falls back to the tenant's own outlet when the preferred id is foreign", async () => {
    // B_OUTLET belongs to another tenant → invisible under A's RLS → the
    // pick falls back to one of A's own outlets, never B's.
    const picked = await withTenant(db, TENANT_A, (tx) => pickOutletId(tx, B_OUTLET));
    expect(picked).not.toBe(B_OUTLET);
    expect([SEED_IDS.outlet, SEED_IDS.outlet2]).toContain(picked);
  });

  it("uses the preferred outlet when it belongs to the tenant", async () => {
    const picked = await withTenant(db, TENANT_A, (tx) => pickOutletId(tx, SEED_IDS.outlet2));
    expect(picked).toBe(SEED_IDS.outlet2);
  });
});
