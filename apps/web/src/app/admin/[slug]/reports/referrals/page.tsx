import Link from "next/link";
import { redirect } from "next/navigation";

import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import { fetchReferralsReport, readDateRange, toDateInput } from "@/lib/report-data";

import { DateRangeForm, DownloadButton, Pagination, ReportHeader } from "../report-chrome";

const PER = 25;
const STATE_LABEL: Record<string, string> = {
  pending: "Waiting for first visit",
  rewarded: "Rewarded",
  rejected: "Not counted",
  completed: "Completed",
};

export default async function ReferralsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.tenant.modules.referrals || !ctx.can("viewReports")) {
    redirect(ctx.base);
  }
  const sp = await searchParams;
  const range = readDateRange(sp);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const db = await getDb();
  const all = await fetchReferralsReport(db, ctx.tenant.id, range);
  const pages = Math.max(1, Math.ceil(all.length / PER));
  const rows = all.slice((page - 1) * PER, page * PER);
  const rewarded = all.filter((r) => r.state === "rewarded").length;
  const q = `from=${toDateInput(range.from)}&to=${toDateInput(range.to)}`;

  return (
    <main className="flex flex-col gap-6">
      <ReportHeader
        base={ctx.base}
        title="Referrals report"
        subtitle="Who invited whom, and which invites turned into a first visit."
      >
        <DownloadButton
          allowed={planAllowsReportDownload(ctx.tenant.plan)}
          href={`${ctx.base}/reports/export?type=referrals&${q}`}
        />
      </ReportHeader>

      <DateRangeForm action={`${ctx.base}/reports/referrals`} range={range} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Invites", String(all.length)],
          ["First visits made", String(rewarded)],
          ["Conversion", all.length ? `${Math.round((rewarded / all.length) * 100)}%` : "-"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums text-text" data-stat>{value}</p>
            <p className="mt-1 text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Invited on</th>
              <th className="px-4 py-3 font-medium">Invited by</th>
              <th className="px-4 py-3 font-medium">Friend</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Inviter got</th>
              <th className="px-4 py-3 font-medium">Friend got</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-text-muted">
                  No invites in this period. Members share their link from their card.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-text-secondary">{formatDate(r.at)}</td>
                <td className="px-4 py-3">
                  <Link href={`${ctx.base}/customers/${r.referrerId}`} className="font-medium text-text hover:underline">
                    {r.referrer}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.refereeId ? (
                    <Link href={`${ctx.base}/customers/${r.refereeId}`} className="font-medium text-text hover:underline">
                      {r.referee}
                    </Link>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {STATE_LABEL[r.state] ?? r.state}
                  {r.note ? ` (${r.note === "cap" ? "limit reached" : r.note})` : ""}
                </td>
                <td className="px-4 py-3 text-text-secondary">{r.referrerGot}</td>
                <td className="px-4 py-3 text-text-secondary">{r.refereeGot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Pagination page={page} pages={pages} hrefFor={(p) => `${ctx.base}/reports/referrals?${q}&page=${p}`} />
    </main>
  );
}
