/**
 * Referral program tables (Phase 5): invite codes are unique per store,
 * referral rows stay inside their tenant, and a "referral" point event moves
 * the balance projection like any other ledger row. First-access flags for
 * staff and customers start null.
 */
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import { isUniqueViolation } from "../errors";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

const A = SEED_IDS.tenant;
const B = SEED_IDS.starterTenant;
const B_CUST = "bbbbbbbb-0000-4000-8000-0000000000b9";
const A_FRIEND = "aaaaaaaa-0000-4000-8000-0000000000a9";

let db: TestDb;

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seed(db);
  await db.execute(sql`set role kembali_app`);
  await withTenant(db, B, (tx) =>
    tx.insert(schema.customers).values({ id: B_CUST, tenantId: B, phone: "+60199000001" }),
  );
  await withTenant(db, A, (tx) =>
    tx.insert(schema.customers).values({ id: A_FRIEND, tenantId: A, phone: "+60199000002" }),
  );
});

afterAll(async () => {
  await db.execute(sql`reset role`);
});

describe("invite codes", () => {
  it("seeded members carry codes and the same code is refused twice in one store", async () => {
    const [aisyah] = await withTenant(db, A, (tx) =>
      tx
        .select({ code: schema.customers.referralCode })
        .from(schema.customers)
        .where(eq(schema.customers.id, SEED_IDS.customers.aisyah)),
    );
    expect(aisyah?.code).toBe("ASY7K2");
    let caught: unknown = null;
    try {
      await withTenant(db, A, (tx) =>
        tx
          .update(schema.customers)
          .set({ referralCode: "ASY7K2" })
          .where(eq(schema.customers.id, A_FRIEND)),
      );
    } catch (err) {
      caught = err;
    }
    expect(isUniqueViolation(caught, "customers_tenant_referral_code_uq")).toBe(true);
  });

  it("another store may reuse the same code (uniqueness is per tenant)", async () => {
    await withTenant(db, B, (tx) =>
      tx
        .update(schema.customers)
        .set({ referralCode: "ASY7K2" })
        .where(eq(schema.customers.id, B_CUST)),
    );
    const [row] = await withTenant(db, B, (tx) =>
      tx
        .select({ code: schema.customers.referralCode })
        .from(schema.customers)
        .where(eq(schema.customers.id, B_CUST)),
    );
    expect(row?.code).toBe("ASY7K2");
  });

  it("a code lookup never crosses tenants", async () => {
    const seen = await withTenant(db, B, (tx) =>
      tx
        .select({ id: schema.customers.id })
        .from(schema.customers)
        .where(eq(schema.customers.referralCode, "TMW4P9")),
    );
    expect(seen).toHaveLength(0);
  });
});

describe("referral rows", () => {
  it("are written pending, closed as rewarded, and invisible to other stores", async () => {
    const [ref] = await withTenant(db, A, (tx) =>
      tx
        .insert(schema.referrals)
        .values({
          tenantId: A,
          referrerCustomerId: SEED_IDS.customers.aisyah,
          refereeCustomerId: A_FRIEND,
        })
        .returning(),
    );
    expect(ref?.state).toBe("pending");
    await withTenant(db, A, (tx) =>
      tx
        .update(schema.referrals)
        .set({
          state: "rewarded",
          qualifiedAt: new Date(),
          referrerReward: { type: "points", points: 50 },
          refereeReward: { type: "voucher", rewardItemId: SEED_IDS.rewardItems.pastry },
        })
        .where(eq(schema.referrals.id, ref!.id)),
    );
    const fromB = await withTenant(db, B, (tx) => tx.select().from(schema.referrals));
    expect(fromB).toHaveLength(0);
    const fromA = await withTenant(db, A, (tx) => tx.select().from(schema.referrals));
    expect(fromA.map((r) => r.state)).toContain("rewarded");
  });

  it("a rejected row keeps its reason for the report", async () => {
    const [row] = await withTenant(db, A, (tx) =>
      tx
        .insert(schema.referrals)
        .values({
          tenantId: A,
          referrerCustomerId: SEED_IDS.customers.aisyah,
          refereeCustomerId: A_FRIEND,
          state: "rejected",
          note: "cap",
        })
        .returning(),
    );
    expect(row?.note).toBe("cap");
  });
});

describe("referral point events", () => {
  it("move the balance projection like any other source", async () => {
    const before = await withTenant(db, A, (tx) =>
      tx
        .select({ balance: schema.customers.pointsBalance })
        .from(schema.customers)
        .where(eq(schema.customers.id, SEED_IDS.customers.aisyah)),
    );
    await withTenant(db, A, (tx) =>
      tx.insert(schema.pointEvents).values({
        tenantId: A,
        customerId: SEED_IDS.customers.aisyah,
        delta: 50,
        source: "referral",
        reason: "Invite reward: a friend made their first visit",
      }),
    );
    const after = await withTenant(db, A, (tx) =>
      tx
        .select({ balance: schema.customers.pointsBalance })
        .from(schema.customers)
        .where(eq(schema.customers.id, SEED_IDS.customers.aisyah)),
    );
    expect(after[0]!.balance).toBe(before[0]!.balance + 50);
  });

  it("a free voucher is a zero-cost reserved redemption tagged with its grant", async () => {
    const [voucher] = await withTenant(db, A, (tx) =>
      tx
        .insert(schema.redemptions)
        .values({
          tenantId: A,
          rewardItemId: SEED_IDS.rewardItems.pastry,
          customerId: A_FRIEND,
          code: "KMB-TEST-VCH1",
          pointsCost: 0,
          expiresAt: new Date(Date.now() + 30 * 86_400_000),
          grantSource: "referral",
        })
        .returning(),
    );
    expect(voucher?.pointsCost).toBe(0);
    expect(voucher?.grantSource).toBe("referral");
    expect(voucher?.state).toBe("reserved");
  });
});

describe("first-access flags", () => {
  it("start null for new staff and customers, and the seed marks the demo owner done", async () => {
    const [friend] = await withTenant(db, A, (tx) =>
      tx
        .select({ onboardedAt: schema.customers.onboardedAt })
        .from(schema.customers)
        .where(eq(schema.customers.id, A_FRIEND)),
    );
    expect(friend?.onboardedAt).toBeNull();
    const [nadia] = await withTenant(db, A, (tx) =>
      tx
        .select({ onboardedAt: schema.staffUsers.onboardedAt })
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.id, SEED_IDS.staffOwner)),
    );
    expect(nadia?.onboardedAt).toBeNull();
    const [lily] = await withTenant(db, B, (tx) =>
      tx
        .select({ onboardedAt: schema.staffUsers.onboardedAt })
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.id, SEED_IDS.starterStaffOwner)),
    );
    expect(lily?.onboardedAt).not.toBeNull();
  });
});
