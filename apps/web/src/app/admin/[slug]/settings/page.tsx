import { redirect } from "next/navigation";

import { planOutletPriceRm } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { asc, sql } from "drizzle-orm";

import { setOutletActive, updateProgram } from "@/lib/admin-actions";
import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

import { AddOutletButton, EditOutletButton } from "./outlet-modals";

/* Store settings: the PDPA data export (free on every plan), the stamp
 * program and the outlets. Owners edit the program and outlets themselves
 * (Decision Log 2026-09-21); adding an outlet is a billing event and says
 * so. Members never lose progress when the card changes. */

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const canExport = ctx.can("exportData");
  const canEdit = ctx.can("manageSettings");
  if (!canExport && !canEdit) redirect(ctx.base);
  const { saved, error } = await searchParams;

  const db = await getDb();
  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [program] = await tx
      .select()
      .from(schema.programs)
      .orderBy(asc(schema.programs.createdAt))
      .limit(1);
    const outlets = await tx
      .select({
        id: schema.outlets.id,
        name: schema.outlets.name,
        addressLine: schema.outlets.addressLine,
        postcode: schema.outlets.postcode,
        city: schema.outlets.city,
        state: schema.outlets.state,
        country: schema.outlets.country,
        active: schema.outlets.active,
      })
      .from(schema.outlets)
      .orderBy(asc(schema.outlets.createdAt));
    const [count] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.customers);
    return { program, outlets, customers: count?.n ?? 0 };
  });
  const rewardTitle =
    Array.isArray(data.program?.rewardDefinitions) &&
    typeof data.program?.rewardDefinitions[0] === "object" &&
    data.program?.rewardDefinitions[0] &&
    "title" in data.program.rewardDefinitions[0]
      ? String((data.program.rewardDefinitions[0] as { title?: string }).title ?? "")
      : "";
  const rewardValidDays =
    data.program &&
    typeof data.program.expiryRules === "object" &&
    data.program.expiryRules &&
    "rewardValidDays" in data.program.expiryRules
      ? Number((data.program.expiryRules as { rewardValidDays?: number }).rewardValidDays ?? 30)
      : 30;
  const activeOutlets = data.outlets.filter((o) => o.active);
  const price = planOutletPriceRm(ctx.tenant.plan);
  const priceNote = price
    ? `Pricing is per outlet: this adds RM${price} a month to your next invoice.`
    : "Pricing is per outlet: this will appear on your next invoice.";

  const messages: Record<string, string> = {
    program: "Card saved. New stamps follow the new card; members keep every stamp they have.",
    outlet: "Outlet saved.",
  };
  const errors: Record<string, string> = {
    program: "Check the card details: 2 to 30 stamps, a reward name, and 7 to 365 days validity.",
    outlet: "Check the outlet details. A name is required.",
    lastoutlet: "You cannot retire your only active outlet. Add another one first.",
  };

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your data, your stamp card, your outlets.
        </p>
      </header>

      {saved && messages[saved] && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          {messages[saved]}
        </p>
      )}
      {error && errors[error] && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {errors[error]}
        </p>
      )}

      {canExport && (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text">Your customer data</h2>
          <p className="mt-1 text-xs text-text-muted">
            Download everything this store holds about its {data.customers}{" "}
            {data.customers === 1 ? "member" : "members"}: profile, consent,
            points, visits and spend. Free on every plan, always. Each download
            is recorded in the audit log.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`${ctx.base}/settings/export`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Download all customers (CSV)
            </a>
            <p className="text-xs text-text-muted">
              Need one person&apos;s full record? Open their profile and use
              &quot;Download data&quot;.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" data-program-settings>
        <h2 className="text-sm font-semibold text-text">Stamp card</h2>
        {!data.program ? (
          <p className="mt-2 text-sm text-text-muted">No stamp card yet. Contact Kembali to set one up.</p>
        ) : canEdit ? (
          <form action={updateProgram} className="mt-3 flex flex-col gap-4">
            <input type="hidden" name="tenantId" value={ctx.tenant.id} />
            <p className="text-xs text-text-muted">
              Changes apply to new stamps. Members keep every stamp they have:
              if you lower the number of stamps, anyone already past it gets
              the reward at their next visit.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-text">
                Card name
                <input name="name" required minLength={2} maxLength={60} defaultValue={data.program.name} className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-xs font-medium text-text">
                Stamps to earn a reward
                <input name="stampsRequired" type="number" min={2} max={30} required defaultValue={data.program.stampsRequired} className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-xs font-medium text-text">
                Reward
                <input name="rewardTitle" required minLength={2} maxLength={120} defaultValue={rewardTitle} placeholder="Free coffee of your choice" className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-xs font-medium text-text">
                Earned reward stays valid for (days)
                <input name="rewardValidDays" type="number" min={7} max={365} required defaultValue={rewardValidDays} className={`mt-1 ${inputClass}`} />
              </label>
            </div>
            <div>
              <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
                Save card
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-muted">Card name</dt>
              <dd className="mt-0.5 font-medium text-text">{data.program.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Stamps to a reward</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-text" data-stat>{data.program.stampsRequired}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Reward</dt>
              <dd className="mt-0.5 font-medium text-text">{rewardTitle || "-"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" data-outlet-settings>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text">Outlets</h2>
            <p className="mt-1 text-xs text-text-muted">
              {activeOutlets.length} active. Every stamp is recorded against
              the outlet that served it. Retired outlets keep their history.
            </p>
          </div>
          {canEdit && <AddOutletButton tenantId={ctx.tenant.id} priceNote={priceNote} />}
        </div>
        <ul className="mt-3 flex flex-col">
          {data.outlets.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-b-0"
              data-outlet={o.active ? "active" : "retired"}
            >
              <div className="min-w-0">
                <p className="font-medium text-text">
                  {o.name}
                  {!o.active && (
                    <span className="ml-2 rounded-full bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                      Retired
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted">
                  {[o.addressLine, o.postcode, o.city, o.state].filter(Boolean).join(", ") || "No address yet"}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <EditOutletButton tenantId={ctx.tenant.id} outlet={o} />
                  <form action={setOutletActive}>
                    <input type="hidden" name="tenantId" value={ctx.tenant.id} />
                    <input type="hidden" name="outletId" value={o.id} />
                    <input type="hidden" name="active" value={o.active ? "false" : "true"} />
                    <button
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
                      disabled={o.active && activeOutlets.length <= 1}
                      title={o.active && activeOutlets.length <= 1 ? "Your only active outlet" : undefined}
                    >
                      {o.active ? "Retire" : "Bring back"}
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
