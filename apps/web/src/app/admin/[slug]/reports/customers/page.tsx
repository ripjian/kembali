import Link from "next/link";
import { redirect } from "next/navigation";

import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { formatDate, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import { fetchCustomersReport, readDateRange, toDateInput } from "@/lib/report-data";

import {
  DateRangeForm,
  DownloadButton,
  Pagination,
  ReportHeader,
} from "../report-chrome";

const PER = 25;

export default async function CustomersReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) redirect(ctx.base);
  const sp = await searchParams;
  const range = readDateRange(sp);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const db = await getDb();
  const all = await fetchCustomersReport(db, ctx.tenant.id, range);
  const pages = Math.max(1, Math.ceil(all.length / PER));
  const rows = all.slice((page - 1) * PER, page * PER);

  const q = `from=${toDateInput(range.from)}&to=${toDateInput(range.to)}`;
  const exportHref = `${ctx.base}/reports/export?type=customers&${q}`;
  const hrefFor = (p: number) => `${ctx.base}/reports/customers?${q}&page=${p}`;

  return (
    <main className="flex flex-col gap-6">
      <ReportHeader
        base={ctx.base}
        title="Customers report"
        subtitle="Visits, spend and points for the chosen period."
      >
        <DownloadButton
          allowed={planAllowsReportDownload(ctx.tenant.plan)}
          href={exportHref}
        />
      </ReportHeader>

      <DateRangeForm action={`${ctx.base}/reports/customers`} range={range} />

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Visits</th>
              <th className="px-4 py-3 font-medium">Spend</th>
              <th className="px-4 py-3 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-text-muted">
                  No customer activity in this period.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <Link
                    href={`${ctx.base}/customers/${c.id}`}
                    className="font-medium text-text hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.phone}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(c.joined)}</td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {c.visits}
                </td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {formatRM(c.spendCents)}
                </td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {c.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Pagination page={page} pages={pages} hrefFor={hrefFor} />
    </main>
  );
}
