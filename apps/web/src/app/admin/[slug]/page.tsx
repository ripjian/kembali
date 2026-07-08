import Link from "next/link";

import { schema, withTenant } from "@kembali/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);

  const db = await getDb();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [today] = await tx
      .select({
        stamps: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.stampEvents)
      .where(gte(schema.stampEvents.createdAt, dayStart));
    const [signups] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.customers)
      .where(gte(schema.customers.createdAt, dayStart));
    const [redemptions] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.rewards)
      .where(
        and(
          eq(schema.rewards.state, "redeemed"),
          gte(schema.rewards.redeemedAt, dayStart),
        ),
      );
    const recent = await tx
      .select({
        id: schema.stampEvents.id,
        createdAt: schema.stampEvents.createdAt,
        amountCents: schema.stampEvents.amountCents,
        source: schema.stampEvents.source,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        customerId: schema.customers.id,
      })
      .from(schema.stampEvents)
      .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
      .innerJoin(schema.customers, eq(schema.cards.customerId, schema.customers.id))
      .orderBy(desc(schema.stampEvents.createdAt))
      .limit(8);
    return { today, signups, redemptions, recent };
  });

  const tiles = [
    { label: "Stamps today", value: String(data.today?.stamps ?? 0) },
    { label: "Sales captured today", value: formatRM(data.today?.revenue ?? 0) },
    { label: "New customers today", value: String(data.signups?.n ?? 0) },
    { label: "Rewards redeemed today", value: String(data.redemptions?.n ?? 0) },
  ];

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Overview</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Today at your counter, as it happens.
          </p>
        </div>
        {ctx.can("scan") && ctx.tenant.modules.scan && (
          <Link
            href={`${ctx.base}/scan`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Scan & stamp
          </Link>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums text-text" data-stat>
              {tile.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{tile.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Latest transactions</h2>
          {ctx.can("viewReports") && ctx.tenant.modules.reports && (
            <Link
              href={`${ctx.base}/reports`}
              className="text-xs font-medium text-text-muted hover:text-text"
            >
              See reports
            </Link>
          )}
        </div>
        {data.recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted">
            No stamps yet today. Scan a customer&apos;s code to get started.
          </p>
        ) : (
          <ul>
            {data.recent.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  {ctx.can("manageCustomers") ? (
                    <Link
                      href={`${ctx.base}/customers/${row.customerId}`}
                      className="font-medium text-text hover:underline"
                    >
                      {row.customerName ?? row.customerPhone ?? "Customer"}
                    </Link>
                  ) : (
                    <span className="font-medium text-text">
                      {row.customerName ?? row.customerPhone ?? "Customer"}
                    </span>
                  )}
                  <p className="text-xs text-text-muted">
                    {formatDateTime(row.createdAt)} ·{" "}
                    {row.source === "qr" ? "scanned" : "manual"}
                  </p>
                </div>
                <span className="tabular-nums text-text" data-stat>
                  {row.amountCents != null ? formatRM(row.amountCents) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
