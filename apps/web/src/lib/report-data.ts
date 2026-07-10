import "server-only";

import { schema, withTenant, type KembaliDb } from "@kembali/db";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

/* Shared report queries used by BOTH the full-report pages and the CSV
 * export route, so the two never drift. Every function opens its own
 * tenant-scoped context (RLS applies). Date ranges bound the data;
 * per-source fetches are capped so a runaway range can't exhaust memory —
 * the cap is surfaced (never silently truncated). */

export const MAX_REPORT_ROWS = 5000;

export interface DateRange {
  from: Date;
  to: Date;
}

/** Parse ?from/?to (YYYY-MM-DD); default to the last 30 days. `to` is
 * inclusive (end of day). */
export function readDateRange(sp: {
  from?: string;
  to?: string;
}): DateRange {
  const to = sp.to ? new Date(`${sp.to}T23:59:59.999`) : new Date();
  const from = sp.from
    ? new Date(`${sp.from}T00:00:00`)
    : new Date(to.getTime() - 29 * 86_400_000);
  return {
    from: Number.isNaN(from.getTime()) ? new Date(to.getTime() - 29 * 86_400_000) : from,
    to: Number.isNaN(to.getTime()) ? new Date() : to,
  };
}

export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface CustomerReportRow {
  id: string;
  name: string;
  phone: string;
  joined: Date;
  visits: number;
  spendCents: number;
  points: number;
}

export function fetchCustomersReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
): Promise<CustomerReportRow[]> {
  return withTenant(db, tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        joined: schema.customers.createdAt,
        points: schema.customers.pointsBalance,
        visits: sql<number>`count(${schema.stampEvents.id})::int`,
        spendCents: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.customers)
      .leftJoin(schema.cards, eq(schema.cards.customerId, schema.customers.id))
      .leftJoin(
        schema.stampEvents,
        and(
          eq(schema.stampEvents.cardId, schema.cards.id),
          gte(schema.stampEvents.createdAt, range.from),
          lte(schema.stampEvents.createdAt, range.to),
        ),
      )
      .groupBy(schema.customers.id)
      .orderBy(desc(sql`count(${schema.stampEvents.id})`), schema.customers.name)
      .limit(MAX_REPORT_ROWS);
    return rows.map((r) => ({
      id: r.id,
      name: r.name ?? "—",
      phone: r.phone ?? "—",
      joined: r.joined,
      visits: r.visits,
      spendCents: r.spendCents,
      points: r.points,
    }));
  });
}

export type TxnKind = "stamp" | "earned" | "adjustment" | "redemption";
export type TxnTypeFilter = "all" | TxnKind;

export interface TransactionReportRow {
  at: Date;
  kind: TxnKind;
  customer: string;
  amountCents: number | null;
  points: number | null;
}

const POINT_SOURCE: Record<"transaction" | "adjustment" | "redemption", TxnKind> = {
  transaction: "earned",
  adjustment: "adjustment",
  redemption: "redemption",
};

export async function fetchTransactionsReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
  type: TxnTypeFilter,
): Promise<{ rows: TransactionReportRow[]; truncated: boolean }> {
  return withTenant(db, tenantId, async (tx) => {
    const out: TransactionReportRow[] = [];
    let truncated = false;

    if (type === "all" || type === "stamp") {
      const stamps = await tx
        .select({
          at: schema.stampEvents.createdAt,
          amountCents: schema.stampEvents.amountCents,
          name: schema.customers.name,
          phone: schema.customers.phone,
        })
        .from(schema.stampEvents)
        .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
        .innerJoin(schema.customers, eq(schema.cards.customerId, schema.customers.id))
        .where(
          and(
            gte(schema.stampEvents.createdAt, range.from),
            lte(schema.stampEvents.createdAt, range.to),
          ),
        )
        .orderBy(desc(schema.stampEvents.createdAt))
        .limit(MAX_REPORT_ROWS);
      if (stamps.length === MAX_REPORT_ROWS) truncated = true;
      for (const s of stamps) {
        out.push({
          at: s.at,
          kind: "stamp",
          customer: s.name ?? s.phone ?? "Customer",
          amountCents: s.amountCents,
          points: null,
        });
      }
    }

    const pointSources =
      type === "all"
        ? (["transaction", "adjustment", "redemption"] as const)
        : type === "earned"
          ? (["transaction"] as const)
          : type === "adjustment"
            ? (["adjustment"] as const)
            : type === "redemption"
              ? (["redemption"] as const)
              : ([] as const);

    if (pointSources.length) {
      const points = await tx
        .select({
          at: schema.pointEvents.createdAt,
          delta: schema.pointEvents.delta,
          source: schema.pointEvents.source,
          name: schema.customers.name,
          phone: schema.customers.phone,
        })
        .from(schema.pointEvents)
        .innerJoin(schema.customers, eq(schema.pointEvents.customerId, schema.customers.id))
        .where(
          and(
            gte(schema.pointEvents.createdAt, range.from),
            lte(schema.pointEvents.createdAt, range.to),
            inArray(schema.pointEvents.source, [...pointSources]),
          ),
        )
        .orderBy(desc(schema.pointEvents.createdAt))
        .limit(MAX_REPORT_ROWS);
      if (points.length === MAX_REPORT_ROWS) truncated = true;
      for (const p of points) {
        out.push({
          at: p.at,
          kind: POINT_SOURCE[p.source],
          customer: p.name ?? p.phone ?? "Customer",
          amountCents: null,
          points: p.delta,
        });
      }
    }

    out.sort((a, b) => b.at.getTime() - a.at.getTime());
    return { rows: out, truncated };
  });
}

export interface RewardReportRow {
  at: Date;
  reward: string;
  customer: string;
  pointsCost: number;
  state: string;
  staff: string;
}

export function fetchRewardsReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
): Promise<RewardReportRow[]> {
  return withTenant(db, tenantId, async (tx) => {
    const rows = await tx
      .select({
        at: schema.redemptions.createdAt,
        pointsCost: schema.redemptions.pointsCost,
        state: schema.redemptions.state,
        reward: schema.rewardItems.title,
        name: schema.customers.name,
        phone: schema.customers.phone,
        staff: schema.staffUsers.name,
      })
      .from(schema.redemptions)
      .innerJoin(schema.rewardItems, eq(schema.redemptions.rewardItemId, schema.rewardItems.id))
      .innerJoin(schema.customers, eq(schema.redemptions.customerId, schema.customers.id))
      .leftJoin(schema.staffUsers, eq(schema.redemptions.redeemedByStaffId, schema.staffUsers.id))
      .where(
        and(
          gte(schema.redemptions.createdAt, range.from),
          lte(schema.redemptions.createdAt, range.to),
        ),
      )
      .orderBy(desc(schema.redemptions.createdAt))
      .limit(MAX_REPORT_ROWS);
    return rows.map((r) => ({
      at: r.at,
      reward: r.reward,
      customer: r.name ?? r.phone ?? "Customer",
      pointsCost: r.pointsCost,
      state: r.state,
      staff: r.staff ?? "—",
    }));
  });
}

/** RFC-4180-ish CSV escaping. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
