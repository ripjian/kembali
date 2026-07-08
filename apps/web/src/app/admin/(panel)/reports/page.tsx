import Link from "next/link";
import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { desc, eq, gte, sql } from "drizzle-orm";

import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatRM } from "@/lib/format";
import { parseModules } from "@/lib/modules";

/* Basic reports v1 (ROADMAP Phase 1) — the numbers a small business
 * actually checks: activity, sales captured, repeat behaviour, rewards,
 * top regulars. Deeper analytics is deliberately Phase 5. */

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const admin = (await getAdminContext())!;
  const { range } = await searchParams;
  const days = range === "30" ? 30 : 7;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const db = await getDb();
  const data = await withTenant(db, admin.tenantId, async (tx) => {
    const [tenant] = await tx
      .select({ modules: schema.tenants.modules })
      .from(schema.tenants);

    const [totals] = await tx
      .select({
        stamps: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
        cards: sql<number>`count(distinct ${schema.stampEvents.cardId})::int`,
      })
      .from(schema.stampEvents)
      .where(gte(schema.stampEvents.createdAt, since));

    const [repeat] = await tx
      .select({
        n: sql<number>`count(*)::int`,
      })
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
      .limit(5);

    return { tenant, totals, repeat, newCustomers, rewardsAgg, byDay, topCustomers };
  });

  if (!parseModules(data.tenant?.modules).reports) redirect("/admin");

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
              href={`/admin/reports?range=${d}`}
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

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text">Stamps per day</h2>
        {data.byDay.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No activity in this period yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
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
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
          Your top regulars
        </h2>
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
                  <Link href={`/admin/customers/${c.id}`} className="truncate font-medium text-text hover:underline">
                    {c.name ?? c.phone ?? "Customer"}
                  </Link>
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
    </main>
  );
}
