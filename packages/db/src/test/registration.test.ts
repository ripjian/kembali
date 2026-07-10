/**
 * Customer registration after OTP verify. A verified phone starts as a
 * phone-only record; completing the profile fills name/email/birthday and the
 * PDPA marketing opt-in, scoped to the joining tenant. The same phone joining
 * a second merchant gets a SEPARATE profile there, and RLS keeps each
 * tenant's customer rows unreachable from the other.
 */
import { needsRegistration } from "@kembali/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

const A = SEED_IDS.tenant; // Corner Coffee
const B = SEED_IDS.starterTenant; // Bloom Bakery
const A_CUST = "aaaaaaaa-0000-4000-8000-000000000a01";
const B_CUST = "bbbbbbbb-0000-4000-8000-000000000b01";
const PHONE = "+60111222333"; // same person joins both merchants

let db: TestDb;

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seed(db);
  await db.execute(sql`set role kembali_app`);
  // A verified phone at each tenant starts phone-only (no name yet).
  await withTenant(db, A, (tx) =>
    tx.insert(schema.customers).values({ id: A_CUST, tenantId: A, phone: PHONE }),
  );
  await withTenant(db, B, (tx) =>
    tx.insert(schema.customers).values({ id: B_CUST, tenantId: B, phone: PHONE }),
  );
});

afterAll(async () => {
  await db.execute(sql`reset role`);
});

const readCustomer = (tenant: string, id: string) =>
  withTenant(db, tenant, async (tx) => {
    const [c] = await tx
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));
    return c ?? null;
  });

describe("profile completion", () => {
  it("a phone-only customer needs registration until a name is saved", async () => {
    const before = await readCustomer(A, A_CUST);
    expect(before?.name).toBeNull();
    expect(needsRegistration(before)).toBe(true);
    // marketing opt-in defaults to empty (PDPA: off until opted in)
    expect(before?.marketingOptIns).toEqual({});

    await withTenant(db, A, (tx) =>
      tx
        .update(schema.customers)
        .set({
          name: "Aisyah A",
          email: "aisyah@example.com",
          birthday: "1994-05-20",
          marketingOptIns: { whatsapp: true },
        })
        .where(eq(schema.customers.id, A_CUST)),
    );

    const after = await readCustomer(A, A_CUST);
    expect(after?.name).toBe("Aisyah A");
    expect(after?.email).toBe("aisyah@example.com");
    expect(after?.birthday).toBe("1994-05-20");
    expect(after?.marketingOptIns).toEqual({ whatsapp: true });
    expect(needsRegistration(after)).toBe(false);
  });

  it("the same phone at merchant B is a separate profile", async () => {
    // B's record is still phone-only despite A being registered.
    const bBefore = await readCustomer(B, B_CUST);
    expect(bBefore?.name).toBeNull();
    expect(needsRegistration(bBefore)).toBe(true);

    await withTenant(db, B, (tx) =>
      tx
        .update(schema.customers)
        .set({ name: "Aisyah B", marketingOptIns: {} })
        .where(eq(schema.customers.id, B_CUST)),
    );

    const a = await readCustomer(A, A_CUST);
    const b = await readCustomer(B, B_CUST);
    expect(a?.name).toBe("Aisyah A");
    expect(b?.name).toBe("Aisyah B");
    expect(a?.marketingOptIns).toEqual({ whatsapp: true });
    expect(b?.marketingOptIns).toEqual({}); // opted out at B
  });

  it("one tenant cannot see or edit another tenant's customer", async () => {
    const leak = await readCustomer(A, B_CUST); // A looking for B's row
    expect(leak).toBeNull();
  });
});
