import { sql, type SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

/** Driver-agnostic database type — postgres-js in prod, PGlite in dev/tests. */
export type KembaliDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Create a postgres-js backed Drizzle client. The connection should log in
 * as a member of the `kembali_app` role (never the table owner) so RLS is
 * always in force. */
export function createDb(databaseUrl: string): Db {
  const url = z.url().parse(databaseUrl);
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

const tenantIdSchema = z.uuid();

interface TxLike {
  execute(query: SQL): Promise<unknown>;
}

interface DbLike<TTx extends TxLike> {
  transaction<R>(fn: (tx: TTx) => Promise<R>): Promise<R>;
}

/**
 * Run `fn` inside a transaction scoped to one tenant. Sets the
 * `app.tenant_id` GUC (transaction-local) that every RLS policy checks —
 * this is the ONLY sanctioned way to touch tenant data (CLAUDE.md).
 * Works with any Drizzle Postgres driver (postgres-js in prod, PGlite in
 * tests).
 */
export async function withTenant<TTx extends TxLike, T>(
  db: DbLike<TTx>,
  tenantId: string,
  fn: (tx: TTx) => Promise<T>,
): Promise<T> {
  const validTenantId = tenantIdSchema.parse(tenantId);
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${validTenantId}, true)`,
    );
    return fn(tx);
  });
}

/**
 * Run `fn` with the platform-admin RLS bypass (tenants + staff_users
 * policies only). Call ONLY after verifying a `platform` session —
 * privileged actions inside must be audit-logged (SECURITY.md rule 9).
 */
export async function withPlatform<TTx extends TxLike, T>(
  db: DbLike<TTx>,
  fn: (tx: TTx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.platform_admin', 'true', true)`,
    );
    return fn(tx);
  });
}
