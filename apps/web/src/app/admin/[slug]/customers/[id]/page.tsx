import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { computeCardProgress } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { redeemReward } from "@/lib/admin-actions";
import { getDb } from "@/lib/db";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";

import { AdjustPointsButton } from "./adjust-points";
import { CustomerEditButton } from "./customer-edit";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ saved?: string; adjusted?: string; error?: string; edit?: string }>;
}) {
  const { slug, id } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("manageCustomers")) redirect(ctx.base);
  if (!z.uuid().safeParse(id).success) notFound();
  const { saved, adjusted, error, edit } = await searchParams;

  const db = await getDb();
  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [customer] = await tx
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));
    if (!customer) return null;
    const [card] = await tx
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.customerId, customer.id));
    const program = card
      ? (
          await tx
            .select()
            .from(schema.programs)
            .where(eq(schema.programs.id, card.programId))
        )[0]
      : undefined;
    const events = card
      ? await tx
          .select({
            id: schema.stampEvents.id,
            createdAt: schema.stampEvents.createdAt,
            source: schema.stampEvents.source,
            amountCents: schema.stampEvents.amountCents,
            outlet: schema.outlets.name,
          })
          .from(schema.stampEvents)
          .leftJoin(schema.outlets, eq(schema.stampEvents.outletId, schema.outlets.id))
          .where(eq(schema.stampEvents.cardId, card.id))
          .orderBy(desc(schema.stampEvents.createdAt))
          .limit(30)
      : [];
    const rewards = card
      ? await tx
          .select()
          .from(schema.rewards)
          .where(eq(schema.rewards.cardId, card.id))
          .orderBy(desc(schema.rewards.createdAt))
      : [];
    const [lifetime] = card
      ? await tx
          .select({
            visits: sql<number>`count(*)::int`,
            spend: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
          })
          .from(schema.stampEvents)
          .where(eq(schema.stampEvents.cardId, card.id))
      : [{ visits: 0, spend: 0 }];
    const pointEvents = await tx
      .select({
        id: schema.pointEvents.id,
        delta: schema.pointEvents.delta,
        source: schema.pointEvents.source,
        reason: schema.pointEvents.reason,
        stampEventId: schema.pointEvents.stampEventId,
        createdAt: schema.pointEvents.createdAt,
        outlet: schema.outlets.name,
      })
      .from(schema.pointEvents)
      .leftJoin(schema.outlets, eq(schema.pointEvents.outletId, schema.outlets.id))
      .where(eq(schema.pointEvents.customerId, customer.id))
      .orderBy(desc(schema.pointEvents.createdAt))
      .limit(60);
    const [outletCount] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.outlets);
    return {
      customer,
      card,
      program,
      events,
      rewards,
      lifetime,
      pointEvents,
      multiOutlet: (outletCount?.n ?? 0) > 1,
    };
  });
  if (!data) notFound();
  const { customer, card, program, events, rewards, lifetime, pointEvents, multiOutlet } = data;

  // Points earned per visit (keyed by stamp event) + standalone ledger rows
  // (adjustments, redemptions) merged into one customer-visible timeline.
  const pointsByStampEvent = new Map(
    pointEvents
      .filter((e) => e.stampEventId)
      .map((e) => [e.stampEventId as string, e.delta]),
  );
  const history = [
    ...events.map((event) => ({
      key: `visit-${event.id}`,
      createdAt: event.createdAt,
      label: event.source === "qr" ? "Visit — scanned" : "Visit — manual",
      amountCents: event.amountCents,
      points: pointsByStampEvent.get(event.id) ?? 0,
      outlet: event.outlet,
      stamp: true,
    })),
    ...pointEvents
      .filter((e) => e.source !== "transaction")
      .map((event) => ({
        key: `points-${event.id}`,
        createdAt: event.createdAt,
        label:
          event.source === "adjustment"
            ? `Points adjustment — ${event.reason ?? "no reason given"}`
            : `Reward redeemed${event.reason ? ` — ${event.reason}` : ""}`,
        amountCents: null,
        points: event.delta,
        outlet: event.outlet,
        stamp: false,
      })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);

  const optIns = z
    .object({ whatsapp: z.boolean().optional(), email: z.boolean().optional() })
    .catch({})
    .parse(customer.marketingOptIns);
  const progress =
    card && program
      ? computeCardProgress({
          stampsCount: card.stampsCount,
          stampsRequired: program.stampsRequired,
        })
      : null;

  return (
    <main className="flex flex-col gap-6">
      <header>
        <Link
          href={`${ctx.base}/customers`}
          className="text-xs font-medium text-text-muted hover:text-text"
        >
          ← All customers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text">
          {customer.name ?? customer.phone ?? "Customer"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Joined {formatDate(customer.createdAt)}
        </p>
      </header>

      {saved && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Customer details saved.
        </p>
      )}
      {error === "invalid" && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          Check the name and phone number, then try again.
        </p>
      )}

      {adjusted && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Points adjusted — it&apos;s in the customer&apos;s history.
        </p>
      )}
      {error === "adjust" && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          Enter the points and a short reason, then try again.
        </p>
      )}
      {error === "balance" && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          That deduction is more than the customer&apos;s balance.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-2xl font-semibold tabular-nums text-text" data-stat>
            {lifetime?.visits ?? 0}
          </p>
          <p className="mt-1 text-xs text-text-muted">Visits</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-2xl font-semibold tabular-nums text-text" data-stat>
            {formatRM(lifetime?.spend ?? 0)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Recorded spend</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-2xl font-semibold tabular-nums text-text" data-stat>
            {progress ? `${progress.stampsTowardNext}/${program?.stampsRequired}` : "—"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Current card</p>
        </div>
        {ctx.tenant.modules.points && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p
              className="text-2xl font-semibold tabular-nums text-text"
              data-stat
              data-points-balance
            >
              {customer.pointsBalance}
            </p>
            <p className="mt-1 text-xs text-text-muted">Points balance</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-text">Details</h2>
          <div className="flex gap-2">
          {ctx.tenant.modules.points && ctx.can("adjustPoints") && (
            <AdjustPointsButton
              tenantId={ctx.tenant.id}
              customerId={customer.id}
              balance={customer.pointsBalance}
            />
          )}
          {ctx.can("editCustomers") && (
            <CustomerEditButton
              tenantId={ctx.tenant.id}
              defaultOpen={edit === "1"}
              customer={{
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                birthday: customer.birthday,
                optInWhatsapp: Boolean(optIns.whatsapp),
                optInEmail: Boolean(optIns.email),
              }}
            />
          )}
          </div>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-text-muted">Phone</dt>
            <dd className="text-text">{customer.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-text-muted">Email</dt>
            <dd className="text-text">{customer.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-text-muted">Birthday</dt>
            <dd className="text-text">{customer.birthday ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-text-muted">Marketing consent</dt>
            <dd className="text-text">
              {[optIns.whatsapp && "WhatsApp", optIns.email && "Email"]
                .filter(Boolean)
                .join(", ") || "None"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
          Rewards
        </h2>
        {rewards.length === 0 ? (
          <p className="px-4 py-5 text-sm text-text-muted">No rewards yet.</p>
        ) : (
          <ul>
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-medium text-text">
                    {reward.type === "free_drink" ? "Free drink" : "Reward"} ·{" "}
                    <span
                      className={
                        reward.state === "earned" ? "text-accent-deep" : "text-text-muted"
                      }
                    >
                      {reward.state}
                    </span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {reward.state === "redeemed" && reward.redeemedAt
                      ? `Redeemed ${formatDate(reward.redeemedAt)}`
                      : reward.expiresAt
                        ? `Valid until ${formatDate(reward.expiresAt)}`
                        : ""}
                  </p>
                </div>
                {reward.state === "earned" && ctx.can("redeemRewards") && (
                  <form action={redeemReward}>
                    <input type="hidden" name="tenantId" value={ctx.tenant.id} />
                    <input type="hidden" name="rewardId" value={reward.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover">
                      Redeem now
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
          Transactions
        </h2>
        {history.length === 0 ? (
          <p className="px-4 py-5 text-sm text-text-muted">No visits recorded yet.</p>
        ) : (
          <ul>
            {history.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
              >
                <span className="min-w-0 text-text-secondary">
                  {formatDateTime(row.createdAt)}
                  <span className="ml-2 text-xs text-text-muted">
                    {row.label}
                    {multiOutlet && row.outlet ? ` · ${row.outlet}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="tabular-nums text-text" data-stat>
                    {row.amountCents != null ? formatRM(row.amountCents) : "—"}
                  </span>
                  {ctx.tenant.modules.points && (
                    <span
                      className={`w-14 text-right tabular-nums text-xs ${
                        row.points > 0
                          ? "text-success"
                          : row.points < 0
                            ? "text-text-secondary"
                            : "text-text-muted"
                      }`}
                      data-stat
                    >
                      {row.points > 0 ? `+${row.points}` : row.points !== 0 ? row.points : "—"}{" "}
                      pts
                    </span>
                  )}
                  {row.stamp && (
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-secondary">
                      +1
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
