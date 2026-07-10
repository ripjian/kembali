import Link from "next/link";
import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";

/* Reports overview — activity, sales, repeat behaviour, points & rewards.
 * Each list preview is capped to the latest 25; "See full report" opens a
 * dedicated page with pagination, date range and CSV download. */

/** Section title bar with an optional "recent 25" hint and a link to the
 * matching full report. */
function SectionHead({
  title,
  href,
  capped = false,
}: {
  title: string;
  href?: string;
  capped?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text">
        {title}
        {capped && (
          <span
            title="Showing the most recent 25 records"
            aria-label="Showing the most recent 25 records"
            className="grid size-4 cursor-help place-items-center rounded-full border border-border text-[10px] font-medium text-text-muted"
          >
            i
          </span>
        )}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          See full report →
        </Link>
      )}
    </div>
  );
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) redirect(ctx.base);

  const { range } = await searchParams;
  const days = range === "30" ? 30 : 7;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const db = await getDb();
  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [totals] = await tx
      .select({
        stamps: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
        cards: sql<number>`count(distinct ${schema.stampEvents.cardId})::int`,
      })
      .from(schema.stampEvents)
      .where(gte(schema.stampEvents.createdAt, since));

    const [repeat] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(
        tx
          .select({
            cardId: schema.stampEvents.cardId,
            visits: sql<number>`count(*)`.as("visits"),
          })
          .from(schema.stampEvents)
          .where(gte(schema.stampEvents.createdAt, since))
          .groupBy(schema.stampEvents.cardId)
          .having(sql`count(*) >= 2`)
          .as("repeats"),
      );

    const [newCustomers] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.customers)
      .where(gte(schema.customers.createdAt, since));

    const [rewardsAgg] = await tx
      .select({
        earned: sql<number>`count(*)::int`,
        redeemed: sql<number>`count(*) filter (where ${schema.rewards.state} = 'redeemed')::int`,
      })
      .from(schema.rewards)
      .where(gte(schema.rewards.createdAt, since));

    const byDay = await tx
      .select({
        day: sql<string>`to_char(date_trunc('day', ${schema.stampEvents.createdAt}), 'YYYY-MM-DD')`,
        stamps: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.stampEvents)
      .where(gte(schema.stampEvents.createdAt, since))
      .groupBy(sql`date_trunc('day', ${schema.stampEvents.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.stampEvents.createdAt})`);

    const topCustomers = await tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        visits: sql<number>`count(*)::int`,
        spend: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.stampEvents)
      .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
      .innerJoin(schema.customers, eq(schema.cards.customerId, schema.customers.id))
      .where(gte(schema.stampEvents.createdAt, since))
      .groupBy(schema.customers.id)
      .orderBy(desc(sql`count(*)`))
      .limit(25);

    // Points & redemptions (Phase 2)
    const [pointsAgg] = await tx
      .select({
        earned: sql<number>`coalesce(sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} > 0), 0)::int`,
        spent: sql<number>`coalesce(-sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} < 0), 0)::int`,
      })
      .from(schema.pointEvents)
      .where(gte(schema.pointEvents.createdAt, since));

    const pointsByCustomer = await tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        earned: sql<number>`coalesce(sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} > 0), 0)::int`,
        spent: sql<number>`coalesce(-sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} < 0), 0)::int`,
      })
      .from(schema.pointEvents)
      .innerJoin(schema.customers, eq(schema.pointEvents.customerId, schema.customers.id))
      .where(gte(schema.pointEvents.createdAt, since))
      .groupBy(schema.customers.id)
      .orderBy(desc(sql`sum(${schema.pointEvents.delta}) filter (where ${schema.pointEvents.delta} > 0)`))
      .limit(25);

    const adjustments = await tx
      .select({
        id: schema.pointEvents.id,
        delta: schema.pointEvents.delta,
        reason: schema.pointEvents.reason,
        createdAt: schema.pointEvents.createdAt,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        staffName: schema.staffUsers.name,
      })
      .from(schema.pointEvents)
      .innerJoin(schema.customers, eq(schema.pointEvents.customerId, schema.customers.id))
      .leftJoin(schema.staffUsers, eq(schema.pointEvents.staffId, schema.staffUsers.id))
      .where(
        sql`${schema.pointEvents.source} = 'adjustment' and ${schema.pointEvents.createdAt} >= ${since}`,
      )
      .orderBy(desc(schema.pointEvents.createdAt))
      .limit(25);

    const redemptionsByReward = await tx
      .select({
        title: schema.rewardItems.title,
        redeemed: sql<number>`count(*)::int`,
        points: sql<number>`coalesce(sum(${schema.redemptions.pointsCost}), 0)::int`,
      })
      .from(schema.redemptions)
      .innerJoin(
        schema.rewardItems,
        eq(schema.redemptions.rewardItemId, schema.rewardItems.id),
      )
      .where(
        sql`${schema.redemptions.state} = 'redeemed' and ${schema.redemptions.redeemedAt} >= ${since}`,
      )
      .groupBy(schema.rewardItems.id)
      .orderBy(desc(sql`count(*)`));

    const recentRedemptions = await tx
      .select({
        id: schema.redemptions.id,
        redeemedAt: schema.redemptions.redeemedAt,
        pointsCost: schema.redemptions.pointsCost,
        title: schema.rewardItems.title,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        staffName: schema.staffUsers.name,
      })
      .from(schema.redemptions)
      .innerJoin(
        schema.rewardItems,
        eq(schema.redemptions.rewardItemId, schema.rewardItems.id),
      )
      .innerJoin(schema.customers, eq(schema.redemptions.customerId, schema.customers.id))
      .leftJoin(
        schema.staffUsers,
        eq(schema.redemptions.redeemedByStaffId, schema.staffUsers.id),
      )
      .where(
        sql`${schema.redemptions.state} = 'redeemed' and ${schema.redemptions.redeemedAt} >= ${since}`,
      )
      .orderBy(desc(schema.redemptions.redeemedAt))
      .limit(25);

    return {
      totals,
      repeat,
      newCustomers,
      rewardsAgg,
      byDay,
      topCustomers,
      pointsAgg,
      pointsByCustomer,
      adjustments,
      redemptionsByReward,
      recentRedemptions,
    };
  });

  const activeCards = data.totals?.cards ?? 0;
  const repeatCards = data.repeat?.n ?? 0;
  const repeatRate = activeCards > 0 ? Math.round((repeatCards / activeCards) * 100) : 0;
  const earned = data.rewardsAgg?.earned ?? 0;
  const redeemed = data.rewardsAgg?.redeemed ?? 0;
  const redemptionRate = earned > 0 ? Math.round((redeemed / earned) * 100) : 0;
  const maxDayStamps = Math.max(1, ...data.byDay.map((d) => d.stamps));

  const tiles = [
    { label: `Stamps (${days} days)`, value: String(data.totals?.stamps ?? 0) },
    { label: "Sales captured", value: formatRM(data.totals?.revenue ?? 0) },
    { label: "New customers", value: String(data.newCustomers?.n ?? 0) },
    { label: "Visiting customers", value: String(activeCards) },
    { label: "Came back twice or more", value: `${repeatRate}%` },
    { label: "Rewards redeemed", value: `${redeemed}/${earned} (${redemptionRate}%)` },
    ...(ctx.tenant.modules.points
      ? [
          { label: "Points earned", value: String(data.pointsAgg?.earned ?? 0) },
          { label: "Points spent", value: String(data.pointsAgg?.spent ?? 0) },
        ]
      : []),
  ];

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Reports</h1>
          <p className="mt-1 text-sm text-text-secondary">
            The numbers that show loyalty working. Deeper analytics is on the
            roadmap.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {[7, 30].map((d) => (
            <Link
              key={d}
              href={`${ctx.base}/reports?range=${d}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                days === d
                  ? "bg-primary text-on-primary"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {d} days
            </Link>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xl font-semibold tabular-nums text-text" data-stat>
              {tile.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{tile.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Stamps per day</h2>
          <Link
            href={`${ctx.base}/reports/transactions?txn=stamp`}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            See full report →
          </Link>
        </div>
        {data.byDay.length === 0 ? (
          <p className="p-4 text-sm text-text-muted">No activity in this period yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 p-4">
            {data.byDay.map((d) => (
              <li key={d.day} className="flex items-center gap-3 text-xs">
                <span className="w-20 shrink-0 font-mono text-text-muted">{d.day.slice(5)}</span>
                <span
                  className="h-4 rounded-r bg-leaf"
                  style={{ width: `${(d.stamps / maxDayStamps) * 70}%` }}
                  aria-hidden
                />
                <span className="tabular-nums text-text" data-stat>
                  {d.stamps}
                </span>
                <span className="ml-auto tabular-nums text-text-muted">
                  {formatRM(d.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <SectionHead
          title="Your top regulars"
          href={`${ctx.base}/reports/customers`}
          capped
        />
        {data.topCustomers.length === 0 ? (
          <p className="px-4 py-5 text-sm text-text-muted">No visits in this period yet.</p>
        ) : (
          <ul>
            {data.topCustomers.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="w-5 shrink-0 font-mono text-xs text-text-muted">{i + 1}</span>
                  {ctx.can("manageCustomers") ? (
                    <Link
                      href={`${ctx.base}/customers/${c.id}`}
                      className="truncate font-medium text-text hover:underline"
                    >
                      {c.name ?? c.phone ?? "Customer"}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-text">
                      {c.name ?? c.phone ?? "Customer"}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-text-secondary">
                  {c.visits} visits ·{" "}
                  <span className="tabular-nums" data-stat>
                    {formatRM(c.spend)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ctx.tenant.modules.points && (
        <section className="rounded-xl border border-border bg-surface">
          <SectionHead
            title="Points by customer"
            href={`${ctx.base}/reports/customers`}
            capped
          />
          {data.pointsByCustomer.length === 0 ? (
            <p className="px-4 py-5 text-sm text-text-muted">
              No points activity in this period yet.
            </p>
          ) : (
            <ul>
              {data.pointsByCustomer.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  {ctx.can("manageCustomers") ? (
                    <Link
                      href={`${ctx.base}/customers/${c.id}`}
                      className="truncate font-medium text-text hover:underline"
                    >
                      {c.name ?? c.phone ?? "Customer"}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-text">
                      {c.name ?? c.phone ?? "Customer"}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-text-secondary">
                    <span className="tabular-nums text-success" data-stat>
                      +{c.earned}
                    </span>{" "}
                    earned ·{" "}
                    <span className="tabular-nums" data-stat>
                      −{c.spent}
                    </span>{" "}
                    spent
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {ctx.tenant.modules.points && (
        <section className="rounded-xl border border-border bg-surface">
          <SectionHead
            title="Points adjustments"
            href={`${ctx.base}/reports/transactions?txn=adjustment`}
            capped
          />
          {data.adjustments.length === 0 ? (
            <p className="px-4 py-5 text-sm text-text-muted">
              No manual adjustments in this period.
            </p>
          ) : (
            <ul>
              {data.adjustments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-text">
                      {a.customerName ?? a.customerPhone ?? "Customer"}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {a.reason ?? ""} · by {a.staffName ?? "system admin"} ·{" "}
                      {formatDateTime(a.createdAt)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${a.delta > 0 ? "text-success" : "text-text-secondary"}`}
                    data-stat
                  >
                    {a.delta > 0 ? `+${a.delta}` : a.delta} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {ctx.tenant.modules.rewards && (
        <section className="rounded-xl border border-border bg-surface">
          <SectionHead
            title="Redemptions by reward"
            href={`${ctx.base}/reports/rewards`}
            capped
          />
          {data.redemptionsByReward.length === 0 ? (
            <p className="px-4 py-5 text-sm text-text-muted">
              No rewards redeemed in this period yet.
            </p>
          ) : (
            <ul>
              {data.redemptionsByReward.map((r) => (
                <li
                  key={r.title}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="truncate font-medium text-text">{r.title}</span>
                  <span className="shrink-0 text-xs text-text-secondary">
                    <span className="tabular-nums" data-stat>
                      {r.redeemed}
                    </span>{" "}
                    redeemed ·{" "}
                    <span className="tabular-nums" data-stat>
                      {r.points}
                    </span>{" "}
                    pts
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.recentRedemptions.length > 0 && (
            <>
              <h3 className="border-y border-border bg-surface-alt px-4 py-2 text-xs font-semibold text-text-secondary">
                Latest redemptions
              </h3>
              <ul>
                {data.recentRedemptions.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-text">{r.title}</span>
                      <span className="ml-2 text-xs text-text-muted">
                        {r.customerName ?? r.customerPhone ?? "Customer"} · confirmed
                        by {r.staffName ?? "system admin"}
                        {r.redeemedAt ? ` · ${formatDateTime(r.redeemedAt)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-xs text-text-secondary" data-stat>
                      −{r.pointsCost} pts
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
