import { LogoWordmark } from "@kembali/ui";

const STATS = [
  { label: "Stamps today", value: 0 },
  { label: "Signups today", value: 0 },
  { label: "Redemptions today", value: 0 },
  { label: "Referrals today", value: 0 },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-5 py-10">
      <header className="flex items-center justify-between">
        <LogoWordmark size={26} className="dark:hidden" />
        <LogoWordmark size={26} mono="sand" className="hidden dark:block" />
        <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-text-secondary">
          Phase 0 preview
        </span>
      </header>

      <div>
        <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real-time numbers land in Phase 1 — this is the Phase 0 hello-world.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-3xl font-semibold tabular-nums text-text" data-stat>
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-text-muted">{stat.label}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
