import Link from "next/link";
import { redirect } from "next/navigation";

import { computeCardProgress } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, desc, eq, gt } from "drizzle-orm";
import { Button, LogoMark, StampGrid } from "@kembali/ui";

import { destroySessions, getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, formatDate, formatRM } from "@/lib/format";
import { parseModules } from "@/lib/modules";

import { ShowQrButton } from "./show-qr";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await destroySessions();
  redirect("/app/login");
}

export default async function CardPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");

  const db = await getDb();
  const data = await withTenant(db, session.tenantId, async (tx) => {
    const [customer] = await tx
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, session.customerId));
    if (!customer) return null;

    const [card] = await tx
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.customerId, customer.id));
    if (!card) return { customer, card: null } as const;

    const [program] = await tx
      .select()
      .from(schema.programs)
      .where(eq(schema.programs.id, card.programId));
    const [tenant] = await tx
      .select({ name: schema.tenants.name, modules: schema.tenants.modules })
      .from(schema.tenants);
    const events = await tx
      .select({
        id: schema.stampEvents.id,
        createdAt: schema.stampEvents.createdAt,
        amountCents: schema.stampEvents.amountCents,
      })
      .from(schema.stampEvents)
      .where(eq(schema.stampEvents.cardId, card.id))
      .orderBy(desc(schema.stampEvents.createdAt))
      .limit(20);
    const rewards = await tx
      .select()
      .from(schema.rewards)
      .where(eq(schema.rewards.cardId, card.id))
      .orderBy(desc(schema.rewards.createdAt));
    const pointEvents = await tx
      .select()
      .from(schema.pointEvents)
      .where(eq(schema.pointEvents.customerId, customer.id))
      .orderBy(desc(schema.pointEvents.createdAt))
      .limit(40);
    const rewardItems = await tx
      .select()
      .from(schema.rewardItems)
      .where(eq(schema.rewardItems.active, true))
      .orderBy(schema.rewardItems.pointsCost);
    const [openCoupon] = await tx
      .select({ id: schema.redemptions.id, title: schema.rewardItems.title })
      .from(schema.redemptions)
      .innerJoin(
        schema.rewardItems,
        eq(schema.redemptions.rewardItemId, schema.rewardItems.id),
      )
      .where(
        and(
          eq(schema.redemptions.customerId, customer.id),
          eq(schema.redemptions.state, "reserved"),
          gt(schema.redemptions.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(schema.redemptions.createdAt))
      .limit(1);
    return {
      customer,
      card,
      program,
      tenant,
      events,
      rewards,
      pointEvents,
      rewardItems,
      openCoupon,
    } as const;
  });

  if (!data) redirect("/app/login");
  if (!data.card || !("program" in data) || !data.program) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-text-secondary">
          Your card isn&apos;t ready yet. Ask the staff to set you up at the
          counter.
        </p>
      </main>
    );
  }
  const {
    customer,
    card,
    program,
    tenant,
    events,
    rewards,
    pointEvents,
    rewardItems,
    openCoupon,
  } = data;
  const modules = parseModules(tenant?.modules);
  const progress = computeCardProgress({
    stampsCount: card.stampsCount,
    stampsRequired: program.stampsRequired,
  });
  const rewardTitle =
    Array.isArray(program.rewardDefinitions) &&
    program.rewardDefinitions[0] &&
    typeof program.rewardDefinitions[0] === "object" &&
    "title" in program.rewardDefinitions[0]
      ? String((program.rewardDefinitions[0] as { title?: string }).title ?? "a reward")
      : "a reward";
  const openRewards = rewards.filter((r) => r.state === "earned");

  // One customer-visible history: visits (with the points they earned) +
  // adjustments and redemptions from the points ledger.
  const pointsByStampEvent = new Map(
    pointEvents
      .filter((e) => e.stampEventId)
      .map((e) => [e.stampEventId as string, e.delta]),
  );
  const history = [
    ...events.map((event) => ({
      key: `visit-${event.id}`,
      createdAt: event.createdAt,
      label: "Visit",
      amountCents: event.amountCents,
      points: pointsByStampEvent.get(event.id) ?? 0,
      stamp: true,
    })),
    ...pointEvents
      .filter((e) => e.source !== "transaction")
      .map((event) => ({
        key: `points-${event.id}`,
        createdAt: event.createdAt,
        label:
          event.source === "adjustment"
            ? event.reason ?? "Points adjustment"
            : "Reward redeemed",
        amountCents: null,
        points: event.delta,
        stamp: false,
      })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMark size={32} className="dark:hidden" />
          <LogoMark size={32} mono="sand" className="hidden dark:block" />
          <div>
            <h1 className="text-lg font-semibold text-text">
              {tenant?.name ?? "Your card"}
            </h1>
            <p className="text-xs text-text-secondary">
              {customer.name ?? customer.phone}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button className="text-xs font-medium text-text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </header>

      {openCoupon && (
        <Link
          href={`/app/coupons/${openCoupon.id}`}
          className="rounded-xl border border-accent/40 bg-surface p-3 text-sm font-medium text-accent-deep"
        >
          Your coupon for {openCoupon.title.toLowerCase()} is ready — show it
          at the counter →
        </Link>
      )}

      {/* The card, front and centre, with the Show QR call to action */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-text">{program.name}</h2>
          <p className="text-xs text-text-muted tabular-nums" data-stat>
            {progress.stampsTowardNext}/{program.stampsRequired}
          </p>
        </div>
        <div className="mt-4">
          <StampGrid
            earned={progress.stampsTowardNext}
            total={program.stampsRequired}
          />
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-leaf"
            style={{ width: `${progress.progress * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          <span className="font-semibold tabular-nums text-text" data-stat>
            {progress.stampsRemaining}
          </span>{" "}
          more {progress.stampsRemaining === 1 ? "stamp" : "stamps"} to{" "}
          {rewardTitle.toLowerCase()}
        </p>
        <div className="mt-5">
          <ShowQrButton />
        </div>
        {modules.points && (
          <p className="mt-3 text-center text-xs text-text-muted">
            Points balance:{" "}
            <span
              className="font-semibold tabular-nums text-text"
              data-stat
              data-points-balance
            >
              {customer.pointsBalance}
            </span>
          </p>
        )}
      </section>

      {/* Redeemable rewards */}
      {modules.rewards && rewardItems.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-text">Treat yourself</h2>
          <p className="mt-1 text-xs text-text-muted">
            Spend your points on something nice.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {rewardItems.map((item) => {
              const affordable = customer.pointsBalance >= item.pointsCost;
              return (
                <Link
                  key={item.id}
                  href={`/app/rewards/${item.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-alt"
                >
                  {item.imageUrl ? (
                    // data URL, nothing to optimize
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-11 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-alt text-lg">
                      🎁
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {item.title}
                    </span>
                    <span
                      className={`block text-xs ${affordable ? "text-success" : "text-text-muted"}`}
                    >
                      {affordable
                        ? "You have enough points"
                        : `${item.pointsCost - customer.pointsBalance} more points to go`}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold tabular-nums text-text"
                    data-stat
                  >
                    {item.pointsCost} pts
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Stamp-card rewards already earned */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text">Your rewards</h2>
        <div className="mt-3 flex flex-col gap-2">
          <div className="rounded-xl bg-surface-alt p-3">
            <p className="text-sm font-medium text-text">
              Collect {program.stampsRequired} stamps → {rewardTitle}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Every visit counts one stamp.
            </p>
          </div>
          {openRewards.length === 0 ? (
            <p className="px-1 text-xs text-text-muted">
              No rewards waiting yet — you&apos;re {progress.stampsRemaining}{" "}
              stamps away.
            </p>
          ) : (
            openRewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-xl border border-accent/40 bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-medium text-accent-deep">
                    {rewardTitle} — ready to redeem
                  </p>
                  {reward.expiresAt && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Valid until {formatDate(reward.expiresAt)}
                    </p>
                  )}
                </div>
                <span className="size-3 rounded-full bg-accent" aria-hidden />
              </div>
            ))
          )}
        </div>
      </section>

      {/* History */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text">Recent visits</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-xs text-text-muted">
            Your visits will show here after your first stamp.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {history.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <span className="min-w-0 text-text-secondary">
                  {formatDateTime(row.createdAt)}
                  {!row.stamp && (
                    <span className="block truncate text-xs text-text-muted">
                      {row.label}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="tabular-nums text-text" data-stat>
                    {row.amountCents != null ? formatRM(row.amountCents) : ""}
                  </span>
                  {modules.points && row.points !== 0 && (
                    <span
                      className={`tabular-nums text-xs ${row.points > 0 ? "text-success" : "text-text-secondary"}`}
                      data-stat
                    >
                      {row.points > 0 ? `+${row.points}` : row.points} pts
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

      <div className="pb-4 text-center">
        <Button className="w-full" aria-hidden disabled>
          Add to wallet — coming soon
        </Button>
      </div>
    </main>
  );
}
