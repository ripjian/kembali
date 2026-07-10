/**
 * Tenant theming: brand colours are per-tenant and isolated by RLS, and the
 * shared @kembali/core derivation keeps every colour pairing accessible for a
 * set of hostile input colours (WCAG AA text, AA UI for lines/icons).
 */
import { AA_TEXT, AA_UI, contrastRatio, deriveTenantTheme } from "@kembali/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../client";
import * as schema from "../schema";
import { seed, SEED_IDS } from "../seed-data";
import { createTestDb, type TestDb } from "./helpers";

const A = SEED_IDS.tenant; // Corner Coffee, custom brown/amber theme
const B = SEED_IDS.starterTenant; // Bloom Bakery, Kembali default (null)

const SURFACES = ["#ffffff", "#182b23"]; // light + dark card surface (BRAND.md)

// Deliberately hostile brand-colour choices a merchant might pick.
const HOSTILE = [
  "#ffff00",
  "#00ff00",
  "#808080",
  "#7fb069",
  "#fff8b0",
  "#123abc",
  "#000000",
  "#ffffff",
];

let db: TestDb;

beforeAll(async () => {
  ({ db } = await createTestDb());
  await seed(db);
  // Drop from the table owner to the app role so RLS is actually enforced,
  // exactly as production connects (see rls.test.ts / createDevDb).
  await db.execute(sql`set role kembali_app`);
});

afterAll(async () => {
  await db.execute(sql`reset role`);
});

describe("tenant brand colours are isolated by RLS", () => {
  it("each tenant reads only its own colours", async () => {
    const a = await withTenant(db, A, async (tx) => {
      const [t] = await tx
        .select({
          primary: schema.tenants.brandPrimary,
          accent: schema.tenants.brandAccent,
        })
        .from(schema.tenants);
      return t;
    });
    expect(a?.primary).toBe("#5b3a29");
    expect(a?.accent).toBe("#d98a2b");

    const b = await withTenant(db, B, async (tx) => {
      const [t] = await tx
        .select({
          primary: schema.tenants.brandPrimary,
          accent: schema.tenants.brandAccent,
        })
        .from(schema.tenants);
      return t;
    });
    // Bloom Bakery keeps the Kembali default: no custom colours.
    expect(b?.primary).toBeNull();
    expect(b?.accent).toBeNull();
  });

  it("one tenant cannot read another tenant's brand colours", async () => {
    const leak = await withTenant(db, B, async (tx) =>
      tx
        .select({ primary: schema.tenants.brandPrimary })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, A)),
    );
    expect(leak).toHaveLength(0);
  });
});

describe("derived theme stays accessible for hostile colours", () => {
  it("keeps text >= 4.5:1 and UI lines >= 3:1 on light and dark surfaces", () => {
    // Seed the sweep with the real custom tenant colours plus the hostile set.
    const primaries = ["#5b3a29", ...HOSTILE];
    const accents = ["#d98a2b", ...HOSTILE];
    for (const surface of SURFACES) {
      for (const primary of primaries) {
        for (const accent of accents) {
          const t = deriveTenantTheme(primary, accent, surface);
          expect(contrastRatio(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.primaryText, surface)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.accentDeep, surface)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(t.primaryLine, surface)).toBeGreaterThanOrEqual(AA_UI);
          expect(contrastRatio(t.accentLine, surface)).toBeGreaterThanOrEqual(AA_UI);
        }
      }
    }
  });
});
