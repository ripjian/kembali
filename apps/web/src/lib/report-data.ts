import "server-only";

import { schema, withTenant, type KembaliDb } from "@kembali/db";
import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";

/* Shared report queries used by BOTH the full-report pages and the CSV
 * export route, so the two never drift. Every function opens its own
 * tenant-scoped context (RLS applies). Date ranges bound the data;
 * per-source fetches are capped so a runaway range can't exhaust memory -
 * the cap is surfaced (never silently truncated). */

export const MAX_REPORT_ROWS = 5000;

export interface DateRange {
  from: Date;
  to: Date;
}

/* Merchants think in Malaysian calendar days (no DST, fixed +08:00), and
 * production servers run in UTC, so the range is parsed and printed with an
 * explicit offset rather than the server's local zone. Otherwise a
 * `from` of the 1st renders back as the 31st on reload and every filter
 * link slides the range one day further. */
const MY_OFFSET = "+08:00";
const MY_OFFSET_MS = 8 * 3600_000;

/** Parse ?from/?to (YYYY-MM-DD, Malaysian days); default to the last 30
 * days. `to` is inclusive (end of day). */
export function readDateRange(sp: {
  from?: string;
  to?: string;
}): DateRange {
  // Anything that is not a valid YYYY-MM-DD falls back to the default, and
  // the `from` fallback is computed from the SAFE `to`, so a bad `to` can
  // never leak an Invalid Date into the page (it would crash on render).
  const parse = (value: string | undefined, time: string): Date | null => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = new Date(`${value}T${time}${MY_OFFSET}`);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const to = parse(sp.to, "23:59:59.999") ?? new Date();
  const from = parse(sp.from, "00:00:00") ?? new Date(to.getTime() - 29 * 86_400_000);
  // A reversed range is a typo, not a query: swap rather than return nothing.
  return from <= to ? { from, to } : { from: to, to: from };
}

/** The Malaysian calendar day of an instant, as a date-input value. */
export function toDateInput(d: Date): string {
  return new Date(d.getTime() + MY_OFFSET_MS).toISOString().slice(0, 10);
}

export interface CustomerReportRow {
  id: string;
  name: string;
  phone: string;
  joined: Date;
  visits: number;
  spendCents: number;
  points: number;
  /** Most recent visit ever (not just inside the range). */
  lastVisit: Date | null;
}

/** Who to list: everyone, members who joined in the range, members who
 * came back (2+ visits in the range), or lapsed members (visited before
 * but not in the last LAPSED_DAYS before the range end). */
export type CustomerSegment = "all" | "new" | "returning" | "lapsed";
export const CUSTOMER_SEGMENTS: { value: CustomerSegment; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "new", label: "New in period" },
  { value: "returning", label: "Came back (2+ visits)" },
  { value: "lapsed", label: "Lapsed (30+ days)" },
];
export const LAPSED_DAYS = 30;

export function readSegment(raw: string | undefined): CustomerSegment {
  return CUSTOMER_SEGMENTS.some((s) => s.value === raw) ? (raw as CustomerSegment) : "all";
}

export function fetchCustomersReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
  segment: CustomerSegment = "all",
): Promise<CustomerReportRow[]> {
  return withTenant(db, tenantId, async (tx) => {
    const lastVisits = await tx
      .select({
        customerId: schema.cards.customerId,
        last: sql<Date>`max(${schema.stampEvents.createdAt})`,
      })
      .from(schema.stampEvents)
      .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
      .groupBy(schema.cards.customerId);
    const lastByCustomer = new Map(lastVisits.map((r) => [r.customerId, new Date(r.last)]));
    const lapsedBefore = new Date(range.to.getTime() - LAPSED_DAYS * 86_400_000);
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
    return rows
      .map((r) => ({
        id: r.id,
        name: r.name ?? "-",
        phone: r.phone ?? "-",
        joined: r.joined,
        visits: r.visits,
        spendCents: r.spendCents,
        points: r.points,
        lastVisit: lastByCustomer.get(r.id) ?? null,
      }))
      .filter((r) => {
        if (segment === "new") return r.joined >= range.from && r.joined <= range.to;
        if (segment === "returning") return r.visits >= 2;
        if (segment === "lapsed") return r.lastVisit !== null && r.lastVisit < lapsedBefore;
        return true;
      });
  });
}

export type TxnKind = "stamp" | "earned" | "adjustment" | "redemption" | "referral";
export type TxnTypeFilter = "all" | TxnKind;

export interface TransactionReportRow {
  at: Date;
  kind: TxnKind;
  customer: string;
  amountCents: number | null;
  points: number | null;
  outlet: string | null;
  /** Staff member who served, when known. */
  staff: string | null;
}

export interface OutletOption {
  id: string;
  name: string;
}

/** Outlets for a tenant - used for the report/history outlet filter. */
export function fetchOutlets(db: KembaliDb, tenantId: string): Promise<OutletOption[]> {
  return withTenant(db, tenantId, (tx) =>
    tx
      .select({ id: schema.outlets.id, name: schema.outlets.name })
      .from(schema.outlets)
      .orderBy(schema.outlets.createdAt),
  );
}

const POINT_SOURCE: Record<"transaction" | "adjustment" | "redemption" | "referral", TxnKind> = {
  transaction: "earned",
  adjustment: "adjustment",
  redemption: "redemption",
  referral: "referral",
};

export interface StaffOption {
  id: string;
  name: string;
}

/** Staff of a tenant - for the "served by" filter on the transactions report. */
export function fetchStaffOptions(db: KembaliDb, tenantId: string): Promise<StaffOption[]> {
  return withTenant(db, tenantId, (tx) =>
    tx
      .select({ id: schema.staffUsers.id, name: schema.staffUsers.name })
      .from(schema.staffUsers)
      .orderBy(asc(schema.staffUsers.name)),
  );
}

export async function fetchTransactionsReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
  type: TxnTypeFilter,
  outletId?: string | null,
  staffId?: string | null,
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
          outlet: schema.outlets.name,
          staff: schema.staffUsers.name,
        })
        .from(schema.stampEvents)
        .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
        .innerJoin(schema.customers, eq(schema.cards.customerId, schema.customers.id))
        .leftJoin(schema.outlets, eq(schema.stampEvents.outletId, schema.outlets.id))
        .leftJoin(schema.staffUsers, eq(schema.stampEvents.staffId, schema.staffUsers.id))
        .where(
          and(
            gte(schema.stampEvents.createdAt, range.from),
            lte(schema.stampEvents.createdAt, range.to),
            outletId ? eq(schema.stampEvents.outletId, outletId) : undefined,
            staffId ? eq(schema.stampEvents.staffId, staffId) : undefined,
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
          outlet: s.outlet,
          staff: s.staff,
        });
      }
    }

    const pointSources =
      type === "all"
        ? (["transaction", "adjustment", "redemption", "referral"] as const)
        : type === "earned"
          ? (["transaction"] as const)
          : type === "adjustment"
            ? (["adjustment"] as const)
            : type === "redemption"
              ? (["redemption"] as const)
              : type === "referral"
                ? (["referral"] as const)
                : ([] as const);

    if (pointSources.length) {
      const points = await tx
        .select({
          at: schema.pointEvents.createdAt,
          delta: schema.pointEvents.delta,
          source: schema.pointEvents.source,
          name: schema.customers.name,
          phone: schema.customers.phone,
          outlet: schema.outlets.name,
          staff: schema.staffUsers.name,
        })
        .from(schema.pointEvents)
        .innerJoin(schema.customers, eq(schema.pointEvents.customerId, schema.customers.id))
        .leftJoin(schema.outlets, eq(schema.pointEvents.outletId, schema.outlets.id))
        .leftJoin(schema.staffUsers, eq(schema.pointEvents.staffId, schema.staffUsers.id))
        .where(
          and(
            gte(schema.pointEvents.createdAt, range.from),
            lte(schema.pointEvents.createdAt, range.to),
            inArray(schema.pointEvents.source, [...pointSources]),
            outletId ? eq(schema.pointEvents.outletId, outletId) : undefined,
            staffId ? eq(schema.pointEvents.staffId, staffId) : undefined,
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
          outlet: p.outlet,
          staff: p.staff,
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
      staff: r.staff ?? "-",
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

/* ---- activity (when the counter is busy) --------------------------------- */

export interface ActivityDayRow {
  day: string;
  visits: number;
  members: number;
  newMembers: number;
  salesCents: number;
  points: number;
}
export interface ActivityBucket {
  label: string;
  visits: number;
}

/* Inlined as a literal: bound as a parameter, Postgres cannot type it in
 * GROUP BY and the query fails. It is a constant, never user input. */
const MY_TZ = sql.raw("'Asia/Kuala_Lumpur'");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Visits by Malaysian day, hour of day and weekday for the range. */
export function fetchActivityReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
): Promise<{ byDay: ActivityDayRow[]; byHour: ActivityBucket[]; byWeekday: ActivityBucket[] }> {
  return withTenant(db, tenantId, async (tx) => {
    const local = sql`(${schema.stampEvents.createdAt} at time zone ${MY_TZ})`;
    const inRange = and(
      gte(schema.stampEvents.createdAt, range.from),
      lte(schema.stampEvents.createdAt, range.to),
    );
    const days = await tx
      .select({
        day: sql<string>`to_char(date_trunc('day', ${local}), 'YYYY-MM-DD')`,
        visits: sql<number>`count(*)::int`,
        members: sql<number>`count(distinct ${schema.stampEvents.cardId})::int`,
        salesCents: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.stampEvents)
      .where(inRange)
      .groupBy(sql`date_trunc('day', ${local})`)
      .orderBy(sql`date_trunc('day', ${local})`);
    const pointsLocal = sql`(${schema.pointEvents.createdAt} at time zone ${MY_TZ})`;
    const points = await tx
      .select({
        day: sql<string>`to_char(date_trunc('day', ${pointsLocal}), 'YYYY-MM-DD')`,
        points: sql<number>`coalesce(sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} > 0), 0)::int`,
      })
      .from(schema.pointEvents)
      .where(
        and(
          gte(schema.pointEvents.createdAt, range.from),
          lte(schema.pointEvents.createdAt, range.to),
          eq(schema.pointEvents.source, "transaction"),
        ),
      )
      .groupBy(sql`date_trunc('day', ${pointsLocal})`);
    const joinedLocal = sql`(${schema.customers.createdAt} at time zone ${MY_TZ})`;
    const joined = await tx
      .select({
        day: sql<string>`to_char(date_trunc('day', ${joinedLocal}), 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
      .from(schema.customers)
      .where(
        and(gte(schema.customers.createdAt, range.from), lte(schema.customers.createdAt, range.to)),
      )
      .groupBy(sql`date_trunc('day', ${joinedLocal})`);
    const hours = await tx
      .select({
        hour: sql<number>`extract(hour from ${local})::int`,
        visits: sql<number>`count(*)::int`,
      })
      .from(schema.stampEvents)
      .where(inRange)
      .groupBy(sql`extract(hour from ${local})`);
    const weekdays = await tx
      .select({
        dow: sql<number>`extract(isodow from ${local})::int`,
        visits: sql<number>`count(*)::int`,
      })
      .from(schema.stampEvents)
      .where(inRange)
      .groupBy(sql`extract(isodow from ${local})`);

    const pointsByDay = new Map(points.map((p) => [p.day, p.points]));
    const joinedByDay = new Map(joined.map((j) => [j.day, j.n]));
    const dayKeys = new Set<string>([...days.map((d) => d.day), ...joined.map((j) => j.day)]);
    const dayRows = new Map(days.map((d) => [d.day, d]));
    const byDay: ActivityDayRow[] = [...dayKeys].sort().map((day) => {
      const d = dayRows.get(day);
      return {
        day,
        visits: d?.visits ?? 0,
        members: d?.members ?? 0,
        newMembers: joinedByDay.get(day) ?? 0,
        salesCents: d?.salesCents ?? 0,
        points: pointsByDay.get(day) ?? 0,
      };
    });
    const hourMap = new Map(hours.map((h) => [h.hour, h.visits]));
    // Shops are not open around the clock: show 7am to 11pm, which covers
    // every Malaysian cafe day; anything outside folds into the edges.
    const byHour: ActivityBucket[] = [];
    for (let h = 7; h <= 23; h++) {
      let v = hourMap.get(h) ?? 0;
      if (h === 7) for (let e = 0; e < 7; e++) v += hourMap.get(e) ?? 0;
      byHour.push({ label: `${h.toString().padStart(2, "0")}:00`, visits: v });
    }
    const dowMap = new Map(weekdays.map((w) => [w.dow, w.visits]));
    const byWeekday = WEEKDAYS.map((label, i) => ({ label, visits: dowMap.get(i + 1) ?? 0 }));
    return { byDay, byHour, byWeekday };
  });
}

/* ---- referrals (Phase 5) ---------------------------------------------- */

export interface ReferralReportRow {
  id: string;
  at: Date;
  referrerId: string;
  referrer: string;
  refereeId: string | null;
  referee: string;
  state: string;
  note: string | null;
  qualifiedAt: Date | null;
  referrerGot: string;
  refereeGot: string;
}

function describeSnapshot(raw: unknown, titles: Map<string, string>): string {
  const r = (raw ?? {}) as { type?: string; points?: number; rewardItemId?: string };
  if (r.type === "points" && typeof r.points === "number") return `${r.points} points`;
  if (r.type === "voucher") return `Free ${titles.get(r.rewardItemId ?? "") ?? "reward"}`;
  return "-";
}

export function fetchReferralsReport(
  db: KembaliDb,
  tenantId: string,
  range: DateRange,
): Promise<ReferralReportRow[]> {
  return withTenant(db, tenantId, async (tx) => {
    const referrer = schema.customers;
    const rows = await tx
      .select({
        id: schema.referrals.id,
        at: schema.referrals.createdAt,
        referrerId: schema.referrals.referrerCustomerId,
        refereeId: schema.referrals.refereeCustomerId,
        state: schema.referrals.state,
        note: schema.referrals.note,
        qualifiedAt: schema.referrals.qualifiedAt,
        referrerReward: schema.referrals.referrerReward,
        refereeReward: schema.referrals.refereeReward,
        referrerName: referrer.name,
        referrerPhone: referrer.phone,
      })
      .from(schema.referrals)
      .innerJoin(referrer, eq(schema.referrals.referrerCustomerId, referrer.id))
      .where(
        and(gte(schema.referrals.createdAt, range.from), lte(schema.referrals.createdAt, range.to)),
      )
      .orderBy(desc(schema.referrals.createdAt))
      .limit(MAX_REPORT_ROWS);
    const refereeIds = rows.map((r) => r.refereeId).filter((x): x is string => Boolean(x));
    const referees = refereeIds.length
      ? await tx
          .select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone })
          .from(schema.customers)
          .where(inArray(schema.customers.id, refereeIds))
      : [];
    const refereeBy = new Map(referees.map((c) => [c.id, c.name ?? c.phone ?? "Customer"]));
    const items = await tx
      .select({ id: schema.rewardItems.id, title: schema.rewardItems.title })
      .from(schema.rewardItems);
    const titles = new Map(items.map((i) => [i.id, i.title]));
    return rows.map((r) => ({
      id: r.id,
      at: r.at,
      referrerId: r.referrerId,
      referrer: r.referrerName ?? r.referrerPhone ?? "Customer",
      refereeId: r.refereeId,
      referee: r.refereeId ? (refereeBy.get(r.refereeId) ?? "Customer") : "-",
      state: r.state,
      note: r.note,
      qualifiedAt: r.qualifiedAt,
      referrerGot: describeSnapshot(r.referrerReward, titles),
      refereeGot: describeSnapshot(r.refereeReward, titles),
    }));
  });
}

/** Members who visited before but not in the last LAPSED_DAYS. */
export function countLapsedMembers(db: KembaliDb, tenantId: string, now: Date = new Date()): Promise<number> {
  return withTenant(db, tenantId, async (tx) => {
    const cutoff = new Date(now.getTime() - LAPSED_DAYS * 86_400_000);
    const [row] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(
        tx
          .select({ customerId: schema.cards.customerId, last: sql`max(${schema.stampEvents.createdAt})`.as("last") })
          .from(schema.stampEvents)
          .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
          .groupBy(schema.cards.customerId)
          .having(lt(sql`max(${schema.stampEvents.createdAt})`, cutoff))
          .as("lapsed"),
      );
    return row?.n ?? 0;
  });
}
