import Link from "next/link";
import { redirect } from "next/navigation";

import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { formatDateTime, formatRM } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";
import {
  fetchTransactionsReport,
  readDateRange,
  toDateInput,
  type TxnTypeFilter,
} from "@/lib/report-data";

import {
  DateRangeForm,
  DownloadButton,
  Pagination,
  ReportHeader,
} from "../report-chrome";

const PER = 25;

const TYPES: { value: TxnTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "stamp", label: "Stamps" },
  { value: "earned", label: "Points earned" },
  { value: "adjustment", label: "Adjustments" },
  { value: "redemption", label: "Redemptions" },
];

const KIND_LABEL: Record<string, string> = {
  stamp: "Stamp",
  earned: "Points earned",
  adjustment: "Adjustment",
  redemption: "Redemption",
};

export default async function TransactionsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string; txn?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) redirect(ctx.base);
  const sp = await searchParams;
  const range = readDateRange(sp);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const txn: TxnTypeFilter = TYPES.some((t) => t.value === sp.txn)
    ? (sp.txn as TxnTypeFilter)
    : "all";

  const db = await getDb();
  const { rows: all, truncated } = await fetchTransactionsReport(
    db,
    ctx.tenant.id,
    range,
    txn,
  );
  const pages = Math.max(1, Math.ceil(all.length / PER));
  const rows = all.slice((page - 1) * PER, page * PER);

  const q = `from=${toDateInput(range.from)}&to=${toDateInput(range.to)}&txn=${txn}`;
  const exportHref = `${ctx.base}/reports/export?type=transactions&${q}`;
  const hrefFor = (p: number) => `${ctx.base}/reports/transactions?${q}&page=${p}`;

  return (
    <main className="flex flex-col gap-6">
      <ReportHeader
        base={ctx.base}
        title="Transactions report"
        subtitle="Stamps, points and amounts in one timeline."
      >
        <DownloadButton
          allowed={planAllowsReportDownload(ctx.tenant.plan)}
          href={exportHref}
        />
      </ReportHeader>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <DateRangeForm
          action={`${ctx.base}/reports/transactions`}
          range={range}
          hidden={{ txn }}
        />
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
          {TYPES.map((t) => (
            <Link
              key={t.value}
              href={`${ctx.base}/reports/transactions?from=${toDateInput(range.from)}&to=${toDateInput(range.to)}&txn=${t.value}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                txn === t.value
                  ? "bg-primary text-on-primary"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {truncated && (
        <p className="rounded-xl border border-border bg-surface-alt px-4 py-2 text-xs text-text-muted">
          Showing the first {all.length} records for this range — narrow the
          dates to see the rest.
        </p>
      )}

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-text-muted">
                  No transactions in this period.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-text-secondary">{formatDateTime(r.at)}</td>
                <td className="px-4 py-3 text-text-secondary">{KIND_LABEL[r.kind]}</td>
                <td className="px-4 py-3 font-medium text-text">{r.customer}</td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {r.amountCents != null ? formatRM(r.amountCents) : "—"}
                </td>
                <td
                  className={`px-4 py-3 tabular-nums ${
                    r.points == null
                      ? "text-text-muted"
                      : r.points > 0
                        ? "text-success"
                        : "text-text-secondary"
                  }`}
                  data-stat
                >
                  {r.points == null
                    ? r.kind === "stamp"
                      ? "+1 stamp"
                      : "—"
                    : r.points > 0
                      ? `+${r.points}`
                      : r.points}
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
