import { redirect } from "next/navigation";

import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import { fetchActivityReport, readDateRange, toDateInput } from "@/lib/report-data";

import { DateRangeForm, DownloadButton, ReportHeader } from "../report-chrome";

/* Activity report: when the counter is busy. Visits by day (with new vs
 * returning members, sales and points), by hour of day and by weekday, all
 * in Malaysian time. The by-day table is the CSV. */

const th = "px-4 py-3 font-medium";
const td = "px-4 py-2.5 tabular-nums text-text";

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-24 overflow-hidden rounded-full bg-surface-alt" aria-hidden>
        <span className="block h-full rounded-full bg-leaf" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums" data-stat>{value}</span>
    </span>
  );
}

export default async function ActivityReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) redirect(ctx.base);
  const range = readDateRange(await searchParams);

  const db = await getDb();
  const data = await fetchActivityReport(db, ctx.tenant.id, range);
  const q = `from=${toDateInput(range.from)}&to=${toDateInput(range.to)}`;
  const maxHour = Math.max(0, ...data.byHour.map((h) => h.visits));
  const maxDay = Math.max(0, ...data.byWeekday.map((d) => d.visits));
  const totals = data.byDay.reduce(
    (acc, d) => ({
      visits: acc.visits + d.visits,
      newMembers: acc.newMembers + d.newMembers,
      salesCents: acc.salesCents + d.salesCents,
      points: acc.points + d.points,
    }),
    { visits: 0, newMembers: 0, salesCents: 0, points: 0 },
  );

  return (
    <main className="flex flex-col gap-6">
      <ReportHeader
        base={ctx.base}
        title="Activity report"
        subtitle="When customers come in, and how much they spend, day by day."
      >
        <DownloadButton
          allowed={planAllowsReportDownload(ctx.tenant.plan)}
          href={`${ctx.base}/reports/export?type=activity&${q}`}
        />
      </ReportHeader>

      <DateRangeForm action={`${ctx.base}/reports/activity`} range={range} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Visits", String(totals.visits)],
          ["New members", String(totals.newMembers)],
          ["Sales captured", formatRM(totals.salesCents)],
          ["Points earned", String(totals.points)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums text-text" data-stat>{value}</p>
            <p className="mt-1 text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">By day</h2>
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className={th}>Day</th>
              <th className={th}>Visits</th>
              <th className={th}>Members</th>
              <th className={th}>New members</th>
              <th className={th}>Sales</th>
              <th className={th}>Points</th>
            </tr>
          </thead>
          <tbody>
            {data.byDay.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-text-muted">
                  No visits in this period yet. Stamps will show here as they happen.
                </td>
              </tr>
            )}
            {data.byDay.map((d) => (
              <tr key={d.day} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{d.day}</td>
                <td className={td} data-stat>{d.visits}</td>
                <td className={td} data-stat>{d.members}</td>
                <td className={td} data-stat>{d.newMembers}</td>
                <td className={td} data-stat>{formatRM(d.salesCents)}</td>
                <td className={td} data-stat>{d.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Busiest hours</h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {data.byHour.map((h) => (
                <tr key={h.label} className="border-b border-border last:border-b-0">
                  <td className="w-24 px-4 py-2 text-text-secondary">{h.label}</td>
                  <td className="px-4 py-2 text-text"><Bar value={h.visits} max={maxHour} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">Busiest days of the week</h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {data.byWeekday.map((d) => (
                <tr key={d.label} className="border-b border-border last:border-b-0">
                  <td className="w-24 px-4 py-2 text-text-secondary">{d.label}</td>
                  <td className="px-4 py-2 text-text"><Bar value={d.visits} max={maxDay} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
