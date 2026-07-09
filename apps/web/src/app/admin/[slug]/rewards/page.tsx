import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { desc, sql } from "drizzle-orm";

import { updatePointsRate } from "@/lib/admin-actions";
import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

import { CreateRewardButton, EditRewardButton } from "./reward-modals";

/* Rewards & points settings (Phase 2): the RM→points rate and the catalog
 * customers redeem from. Gated on the manageRewards permission and the
 * rewards/points modules. */

export default async function RewardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.rewards || !ctx.can("manageRewards")) redirect(ctx.base);
  const { saved, error } = await searchParams;

  const db = await getDb();
  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [tenant] = await tx
      .select({ pointsPerRm: schema.tenants.pointsPerRm })
      .from(schema.tenants);
    const items = await tx
      .select()
      .from(schema.rewardItems)
      .orderBy(desc(schema.rewardItems.active), desc(schema.rewardItems.createdAt));
    const redeemCounts = await tx
      .select({
        rewardItemId: schema.redemptions.rewardItemId,
        redeemed: sql<number>`count(*) filter (where ${schema.redemptions.state} = 'redeemed')::int`,
      })
      .from(schema.redemptions)
      .groupBy(schema.redemptions.rewardItemId);
    return { pointsPerRm: tenant?.pointsPerRm ?? 1, items, redeemCounts };
  });
  const redeemedBy = new Map(data.redeemCounts.map((r) => [r.rewardItemId, r.redeemed]));

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Rewards</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Set how members earn points, and what they can spend them on.
          </p>
        </div>
        <CreateRewardButton tenantId={ctx.tenant.id} />
      </header>

      {saved && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          {saved === "rate" ? "Points rate saved." : "Reward saved."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error === "rate"
            ? "The rate must be a number between 0 and 1000."
            : "Check the reward details, then try again."}
        </p>
      )}

      {ctx.tenant.modules.points && (
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text">Points settings</h2>
          <p className="mt-1 text-xs text-text-muted">
            Members earn points from the amount keyed in at the counter.
            Set the rate to 0 to pause earning.
          </p>
          <form
            action={updatePointsRate}
            className="mt-3 flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="tenantId" value={ctx.tenant.id} />
            <label className="text-xs font-medium text-text">
              Points per RM1 spent
              <input
                name="pointsPerRm"
                type="number"
                step="0.1"
                min={0}
                max={1000}
                required
                defaultValue={data.pointsPerRm}
                className="mt-1 h-10 w-36 rounded-lg border border-border bg-surface px-3 text-sm tabular-nums text-text outline-none focus:border-primary"
              />
            </label>
            <p className="pb-2.5 text-xs text-text-muted">
              RM10.00 → {Math.floor(1000 * data.pointsPerRm / 100)} points at the
              current rate
            </p>
            <button className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary hover:bg-primary-hover">
              Save rate
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
          Catalog
        </h2>
        {data.items.length === 0 ? (
          <p className="px-4 py-5 text-sm text-text-muted">
            No rewards yet. Add the first thing members can redeem.
          </p>
        ) : (
          <ul>
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.imageUrl ? (
                    // data URL, nothing for next/image to optimize
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-alt text-xs text-text-muted">
                      —
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {item.title}
                      {!item.active && (
                        <span className="ml-2 rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      <span className="tabular-nums" data-stat>
                        {item.pointsCost}
                      </span>{" "}
                      points · redeemed {redeemedBy.get(item.id) ?? 0} times
                    </p>
                  </div>
                </div>
                <EditRewardButton tenantId={ctx.tenant.id} reward={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
