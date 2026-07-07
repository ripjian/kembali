import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "../schema";

export type TestDb = PgliteDatabase<typeof schema>;

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

/** Fresh in-process Postgres with all migrations applied — no external DB
 * needed, so the RLS suite runs identically on laptops and CI. */
export async function createTestDb(): Promise<{ db: TestDb; client: PGlite }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db, client };
}
