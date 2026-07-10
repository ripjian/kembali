import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";

import type { KembaliDb } from "./client";
import * as schema from "./schema";
import { seed } from "./seed-data";

/**
 * Zero-setup development database: embedded Postgres (PGlite) persisted to
 * `dataDir`, migrated and seeded on boot, then locked to the `kembali_app`
 * role so RLS applies exactly like production. NEVER used when
 * DATABASE_URL is set - production requires a real Postgres.
 *
 * `migrationsFolder` is passed by the caller as a plain runtime path
 * (bundlers can't statically resolve this package's drizzle/ directory).
 */
export async function createDevDb(
  dataDir: string,
  migrationsFolder: string,
): Promise<KembaliDb> {
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  await seed(db); // idempotent - fixed ids + ON CONFLICT DO NOTHING
  await db.execute(sql`set role kembali_app`);
  return db as KembaliDb;
}
