import "server-only";

import { cookies } from "next/headers";

import { schema } from "@kembali/db";
import { and, asc, eq } from "drizzle-orm";

/* The cashier's "serving outlet of the day". Stored in a cookie scoped to
 * tenant + date so it resets each day and never crosses stores. Every
 * stamp/point/redemption event is attributed to this outlet
 * (Decision Log 2026-07-11). */

const SERVING_COOKIE = "kb_serving";
/** A shift's worth — the embedded date is what actually enforces "today". */
const MAX_AGE_SECONDS = 20 * 60 * 60;

function todayStr(): string {
  // Malaysia has no DST; a fixed +08:00 offset gives a stable local day.
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}

export function servingCookieValue(tenantId: string, outletId: string): {
  name: string;
  value: string;
  maxAge: number;
} {
  return {
    name: SERVING_COOKIE,
    value: `${tenantId}:${outletId}:${todayStr()}`,
    maxAge: MAX_AGE_SECONDS,
  };
}

/** The outlet id chosen for today for this tenant, or null if none/stale. */
export async function readServingOutletId(tenantId: string): Promise<string | null> {
  const raw = (await cookies()).get(SERVING_COOKIE)?.value;
  if (!raw) return null;
  const [ten, outlet, date] = raw.split(":");
  if (ten !== tenantId || date !== todayStr() || !outlet) return null;
  return outlet;
}

/** Pick the outlet to attribute an event to, inside a tenant-scoped tx:
 * `preferredId` if it belongs to this tenant (RLS enforces that), else the
 * tenant's first outlet. Pure DB — no cookie — so it's unit-testable. */
export async function pickOutletId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural drizzle tx; only select() is used
  tx: any,
  preferredId: string | null,
): Promise<string | null> {
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

/** Resolve the serving outlet (cookie of the day) for an event; RLS
 * guarantees a cookie from another tenant can't win. */
export async function resolveEventOutletId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural drizzle tx
  tx: any,
  tenantId: string,
): Promise<string | null> {
  return pickOutletId(tx, await readServingOutletId(tenantId));
}
