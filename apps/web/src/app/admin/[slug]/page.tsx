import Link from "next/link";

import { schema, withTenant } from "@kembali/db";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext, type PanelContext } from "@/lib/panel";

import { OnboardingGuide, type OnboardingStep } from "./onboarding";

/** Steps for the first-access guide, checked against live data; null once
 * the person has finished it (or for platform admins). */
async function loadOnboarding(
  ctx: PanelContext,
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<{ role: "owner" | "manager" | "cashier"; steps: OnboardingStep[] } | null> {
  if (ctx.admin.kind !== "staff" || ctx.admin.role === "platform") return null;
  const role = ctx.admin.role;
  return withTenant(db, ctx.tenant.id, async (tx) => {
    const [me] = await tx
      .select({ onboardedAt: schema.staffUsers.onboardedAt })
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.id, ctx.admin.subjectId));
    if (!me || me.onboardedAt) return null;
    const [program] = await tx
      .select()
      .from(schema.programs)
      .orderBy(asc(schema.programs.createdAt))
      .limit(1);
    const [counts] = await tx
      .select({
        staff: sql<number>`(select count(*) from ${schema.staffUsers})::int`,
        rewards: sql<number>`(select count(*) from ${schema.rewardItems} where ${schema.rewardItems.active})::int`,
        stamps: sql<number>`(select count(*) from ${schema.stampEvents})::int`,
        outlets: sql<number>`(select count(*) from ${schema.outlets})::int`,
        pointsPerRm: sql<number>`(select ${schema.tenants.pointsPerRm} from ${schema.tenants} limit 1)`,
      })
      .from(schema.tenants);
    const base = ctx.base;
    const rewardTitle =
      Array.isArray(program?.rewardDefinitions) &&
      program.rewardDefinitions[0] &&
      typeof program.rewardDefinitions[0] === "object" &&
      "title" in program.rewardDefinitions[0]
        ? String((program.rewardDefinitions[0] as { title?: string }).title ?? "a reward")
        : "a reward";
    if (role === "cashier") {
      const steps: OnboardingStep[] = [
        ...((counts?.outlets ?? 0) > 1
          ? [
              {
                title: "Choose today's outlet",
                detail: "The scan page asks once a day which outlet you are serving at.",
              },
            ]
          : []),
        {
          title: "Stamp a member",
          detail: "Tap Scan member, key in the amount, then scan the code on their phone. Camera or paste, both work.",
          href: `${base}/scan`,
          cta: "Open scan",
        },
        {
          title: "Confirm a reward",
          detail: "Tap Scan reward when a member shows a coupon. Check the name, then confirm. Each coupon works once.",
        },
        {
          title: "If a code will not scan",
          detail: 'Ask the member to tap "Code won\'t scan?" on their card and paste what they show you.',
        },
      ];
      return { role, steps };
    }
    const steps: OnboardingStep[] = [
      {
        title: "Your stamp card is ready",
        detail: program
          ? `${program.name}: ${program.stampsRequired} stamps earn ${rewardTitle.toLowerCase()}. Contact Kembali to change it.`
          : "Contact Kembali to set up your stamp card.",
        done: Boolean(program),
      },
      ...(ctx.tenant.modules.rewards
        ? [
            {
              title: "Set points and add a reward",
              detail: "Decide how many points RM1 earns, then add the first thing members can redeem.",
              href: `${base}/rewards`,
              cta: "Open rewards",
              done: (counts?.pointsPerRm ?? 0) > 0 && (counts?.rewards ?? 0) > 0,
            },
          ]
        : []),
      {
        title: "Add your team",
        detail: "Cashiers sign in with their own email and only see the scan page.",
        href: `${base}/team`,
        cta: "Open team",
        done: (counts?.staff ?? 0) > 1,
      },
      {
        title: "Print your QR kit",
        detail: "Customers scan the counter poster to start their card in seconds.",
        href: `${base}/qr-kit`,
        cta: "Open QR kit",
      },
      {
        title: "Do a test stamp",
        detail: "Open the join link on your own phone, then stamp yourself from the scan page.",
        href: `${base}/scan`,
        cta: "Open scan",
        done: (counts?.stamps ?? 0) > 0,
      },
    ];
    return { role, steps };
  });
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);

  const db = await getDb();
  const guide = await loadOnboarding(ctx, db);
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
      {/* Founder-approved exception to the English-only rule (2026-07-11):
          this one greeting on the merchant overview may use Malay. Nothing
          else may. See brand/BRAND.md §5 and ROADMAP §13. */}
      <p className="text-lg font-medium text-text" data-greeting>
        Selamat kembali ke {ctx.tenant.name} 👋
      </p>
      {guide && (
        <OnboardingGuide
          tenantId={ctx.tenant.id}
          storeName={ctx.tenant.name}
          role={guide.role}
          steps={guide.steps}
        />
      )}
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
