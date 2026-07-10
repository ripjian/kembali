import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import { readServingOutletId } from "@/lib/serving-outlet";

import { ScanClient } from "./scan-client";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.scan || !ctx.can("scan")) redirect(ctx.base);

  const db = await getDb();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const outlets = await tx
      .select({ id: schema.outlets.id, name: schema.outlets.name })
      .from(schema.outlets)
      .orderBy(schema.outlets.createdAt);
    const todays = await tx
      .select({
        id: schema.stampEvents.id,
        createdAt: schema.stampEvents.createdAt,
        amountCents: schema.stampEvents.amountCents,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        outletName: schema.outlets.name,
      })
      .from(schema.stampEvents)
      .innerJoin(schema.cards, eq(schema.stampEvents.cardId, schema.cards.id))
      .innerJoin(schema.customers, eq(schema.cards.customerId, schema.customers.id))
      .leftJoin(schema.outlets, eq(schema.stampEvents.outletId, schema.outlets.id))
      .where(gte(schema.stampEvents.createdAt, dayStart))
      .orderBy(desc(schema.stampEvents.createdAt))
      .limit(20);
    const [totals] = await tx
      .select({
        stamps: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
      })
      .from(schema.stampEvents)
      .where(gte(schema.stampEvents.createdAt, dayStart));
    return { outlets, todays, totals };
  });

  // Serving outlet only matters when there's a choice to make.
  const servingId = data.outlets.length > 1 ? await readServingOutletId(ctx.tenant.id) : null;
  const multiOutlet = data.outlets.length > 1;

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Scan & stamp</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Stamp a member&apos;s card, or confirm a reward coupon.
        </p>
      </header>

      <ScanClient
        tenantId={ctx.tenant.id}
        canRedeem={ctx.tenant.modules.rewards && ctx.can("redeemRewards")}
        outlets={multiOutlet ? data.outlets : []}
        servingOutletId={servingId}
      />

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Today so far</h2>
          <p className="text-xs text-text-muted tabular-nums">
            {data.totals?.stamps ?? 0} stamps · {formatRM(data.totals?.revenue ?? 0)}
          </p>
        </div>
        {data.todays.length === 0 ? (
          <p className="px-4 py-5 text-sm text-text-muted">
            Nothing stamped yet today.
          </p>
        ) : (
          <ul>
            {data.todays.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="font-medium text-text">
                    {row.customerName ?? row.customerPhone ?? "Customer"}
                  </span>
                  <span className="ml-2 text-xs text-text-muted">
                    {formatDateTime(row.createdAt)}
                    {multiOutlet && row.outletName ? ` · ${row.outletName}` : ""}
                  </span>
                </span>
                <span className="tabular-nums text-text" data-stat>
                  {row.amountCents != null ? formatRM(row.amountCents) : "-"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
