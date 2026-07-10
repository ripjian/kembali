import { redirect } from "next/navigation";

import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import { fetchRewardsReport, readDateRange, toDateInput } from "@/lib/report-data";

import {
  DateRangeForm,
  DownloadButton,
  Pagination,
  ReportHeader,
} from "../report-chrome";

const PER = 25;

const STATE_STYLE: Record<string, string> = {
  redeemed: "text-success",
  reserved: "text-text-secondary",
  expired: "text-text-muted",
  cancelled: "text-text-muted",
};

export default async function RewardsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) redirect(ctx.base);
  if (!ctx.tenant.modules.rewards) redirect(`${ctx.base}/reports`);
  const sp = await searchParams;
  const range = readDateRange(sp);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const db = await getDb();
  const all = await fetchRewardsReport(db, ctx.tenant.id, range);
  const pages = Math.max(1, Math.ceil(all.length / PER));
  const rows = all.slice((page - 1) * PER, page * PER);

  const q = `from=${toDateInput(range.from)}&to=${toDateInput(range.to)}`;
  const exportHref = `${ctx.base}/reports/export?type=rewards&${q}`;
  const hrefFor = (p: number) => `${ctx.base}/reports/rewards?${q}&page=${p}`;

  return (
    <main className="flex flex-col gap-6">
      <ReportHeader
        base={ctx.base}
        title="Rewards report"
        subtitle="Every coupon and how it ended, for the chosen period."
      >
        <DownloadButton
          allowed={planAllowsReportDownload(ctx.tenant.plan)}
          href={exportHref}
        />
      </ReportHeader>

      <DateRangeForm action={`${ctx.base}/reports/rewards`} range={range} />

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Reward</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Confirmed by</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-text-muted">
                  No redemptions in this period.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(r.at)}</td>
                <td className="px-4 py-3 font-medium text-text">{r.reward}</td>
                <td className="px-4 py-3 text-text-secondary">{r.customer}</td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {r.pointsCost}
                </td>
                <td className={`px-4 py-3 ${STATE_STYLE[r.state] ?? "text-text-secondary"}`}>
                  {r.state}
                </td>
                <td className="px-4 py-3 text-text-secondary">{r.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Pagination page={page} pages={pages} hrefFor={hrefFor} />
    </main>
  );
}
