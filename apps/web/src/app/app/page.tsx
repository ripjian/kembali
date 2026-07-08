import { redirect } from "next/navigation";

import { computeCardProgress } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { desc, eq } from "drizzle-orm";
import { Button, LogoMark, StampGrid } from "@kembali/ui";

import { destroySessions, getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, formatDate, formatRM } from "@/lib/format";

import { QrPanel } from "./qr-panel";

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
      .select({ name: schema.tenants.name })
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
      .limit(10);
    const rewards = await tx
      .select()
      .from(schema.rewards)
      .where(eq(schema.rewards.cardId, card.id))
      .orderBy(desc(schema.rewards.createdAt));
    return { customer, card, program, tenant, events, rewards } as const;
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
  const { customer, card, program, tenant, events, rewards } = data;
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

      {/* The card */}
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
      </section>

      {/* Rotating QR */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-center text-sm font-semibold text-text">
          Show this at the counter
        </h2>
        <QrPanel />
      </section>

      {/* Promos & rewards */}
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

      {/* Recent spends */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text">Recent visits</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-xs text-text-muted">
            Your visits will show here after your first stamp.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <span className="text-text-secondary">
                  {formatDateTime(event.createdAt)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-text" data-stat>
                    {event.amountCents != null ? formatRM(event.amountCents) : "—"}
                  </span>
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-secondary">
                    +1
                  </span>
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
