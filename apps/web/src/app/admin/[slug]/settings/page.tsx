import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { asc, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

/* Store settings. Today: the PDPA data export (free on every plan) and a
 * read-only summary of the stamp program and outlets. Merchant-side
 * editing of the program and outlets is a proposal awaiting the founder
 * (PROPOSALS.md); until then the platform admin changes them. */

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("exportData")) redirect(ctx.base);

  const db = await getDb();
  const data = await withTenant(db, ctx.tenant.id, async (tx) => {
    const [program] = await tx
      .select()
      .from(schema.programs)
      .orderBy(asc(schema.programs.createdAt))
      .limit(1);
    const outlets = await tx
      .select({ name: schema.outlets.name, city: schema.outlets.city })
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

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your data, your program, your outlets.
        </p>
      </header>

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

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-text">Stamp program</h2>
        {data.program ? (
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-muted">Card name</dt>
              <dd className="mt-0.5 font-medium text-text">{data.program.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Stamps to a reward</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-text" data-stat>
                {data.program.stampsRequired}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Reward</dt>
              <dd className="mt-0.5 font-medium text-text">{rewardTitle || "-"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No stamp program yet.</p>
        )}
        <p className="mt-3 text-xs text-text-muted">
          To change the card or the reward, contact Kembali. Self-service
          editing is planned.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-text">Outlets</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-text">
          {data.outlets.map((o, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>{o.name}</span>
              <span className="text-xs text-text-muted">{o.city ?? ""}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-muted">
          To add or rename an outlet, contact Kembali.
        </p>
      </section>
    </main>
  );
}
