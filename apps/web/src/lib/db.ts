import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { createDb, createDevDb, SEED_IDS, type KembaliDb } from "@kembali/db";

/**
 * Database singleton. Production: real Postgres via DATABASE_URL (the
 * connection user must be a member of `kembali_app`). Development without
 * DATABASE_URL: embedded PGlite, migrated + seeded on first boot -
 * zero-setup local testing (this machine has no Docker/Postgres).
 */
const g = globalThis as typeof globalThis & { __kembaliDb?: Promise<KembaliDb> };

export function getDb(): Promise<KembaliDb> {
  if (!g.__kembaliDb) {
    const url = process.env["DATABASE_URL"];
    if (url) {
      g.__kembaliDb = Promise.resolve(createDb(url) as unknown as KembaliDb);
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL is required in production");
      }
      // dev server cwd is apps/web; fall back to repo root just in case
      const migrations = [
        path.resolve(process.cwd(), "../../packages/db/drizzle"),
        path.resolve(process.cwd(), "packages/db/drizzle"),
      ].find(existsSync);
      if (!migrations) throw new Error("Could not locate packages/db/drizzle");
      g.__kembaliDb = createDevDb(".pglite", migrations);
    }
  }
  return g.__kembaliDb;
}

/** v1 tenant resolution: the seeded demo merchant. Subdomain/custom-domain
 * resolution arrives with white-labeling (ROADMAP Phase 5). */
export const DEMO_TENANT_ID = SEED_IDS.tenant;
