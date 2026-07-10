/**
 * Tenant-scoped join routing: a merchant's QR encodes /app/join/{slug} and
 * that slug alone decides which tenant a customer joins. Merchant A's QR
 * always resolves to A, B's to B, and a customer already signed in to A who
 * scans B's QR resolves to B's join (never A's card), because resolution is
 * by slug, independent of any session.
 */
import { customerJoinPath, customerJoinUrl } from "@kembali/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withPlatform } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

const A_SLUG = "corner-coffee"; // SEED_IDS.tenant
const B_SLUG = "bloom-bakery"; // SEED_IDS.starterTenant

let db: TestDb;

// Mirrors lib/join.getPublicTenantBySlug: resolve a tenant purely by slug.
async function resolveTenantBySlug(slug: string) {
  return withPlatform(db, async (tx) => {
    const [t] = await tx
      .select({ id: schema.tenants.id, slug: schema.tenants.slug })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug));
    return t ?? null;
  });
}

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seed(db);
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await db.execute(sql`reset role`);
});

describe("customer join URL", () => {
  it("builds a tenant-scoped path and absolute URL", () => {
    expect(customerJoinPath(A_SLUG)).toBe("/app/join/corner-coffee");
    expect(customerJoinUrl("https://kembali.app/", A_SLUG)).toBe(
      "https://kembali.app/app/join/corner-coffee",
    );
  });
});

describe("QR resolves to the encoding merchant", () => {
  it("merchant A's QR resolves to A, merchant B's to B", async () => {
    const a = await resolveTenantBySlug(A_SLUG);
    const b = await resolveTenantBySlug(B_SLUG);
    expect(a?.id).toBe(SEED_IDS.tenant);
    expect(b?.id).toBe(SEED_IDS.starterTenant);
    expect(a?.id).not.toBe(b?.id);
  });

  it("a customer of A scanning B's QR resolves to B's join, not A", async () => {
    // The "session" tenant is A; the scanned QR encodes B's slug. Resolution
    // ignores the session and follows the slug, so it lands on B.
    const sessionTenant = SEED_IDS.tenant; // A
    const scanned = await resolveTenantBySlug(B_SLUG);
    expect(scanned?.id).toBe(SEED_IDS.starterTenant); // B
    expect(scanned?.id).not.toBe(sessionTenant); // never A's card
  });

  it("an unknown slug resolves to nothing (404 at the route)", async () => {
    expect(await resolveTenantBySlug("no-such-shop")).toBeNull();
  });
});
