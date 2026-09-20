/* Postgres error helpers. Drivers (postgres.js in production, PGlite in dev
 * and tests) surface the SQLSTATE and the violated constraint under
 * slightly different property names, and drizzle wraps the driver error in
 * a DrizzleQueryError whose `cause` is the original. Route handlers and
 * server actions use this to turn a unique-index race into a friendly
 * message instead of a 500 (SECURITY.md rule 9: never leak driver errors). */

const UNIQUE_VIOLATION = "23505";

type PgErrorLike = {
  code?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  cause?: unknown;
};

function unwrap(err: unknown): PgErrorLike | null {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const e = current as PgErrorLike;
    if (e.code === UNIQUE_VIOLATION) return e;
    current = e.cause;
  }
  return null;
}

/** True when `err` is (or wraps) a unique-constraint violation - for the
 * named constraint/index when `constraint` is given, else for any. */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = unwrap(err);
  if (!e) return false;
  if (!constraint) return true;
  const name = e.constraint ?? e.constraint_name;
  return name === constraint;
}
