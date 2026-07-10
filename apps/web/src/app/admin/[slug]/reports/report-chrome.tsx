import Link from "next/link";

import { toDateInput, type DateRange } from "@/lib/report-data";

/* Shared chrome for the full-report pages: date-range picker, plan-gated
 * CSV download, and pagination. Plain server components. */

export function ReportHeader({
  base,
  title,
  subtitle,
  children,
}: {
  base: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        href={`${base}/reports`}
        className="text-xs font-medium text-text-muted hover:text-text"
      >
        ← All reports
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        {children}
      </div>
    </header>
  );
}

export function DateRangeForm({
  action,
  range,
  hidden,
}: {
  action: string;
  range: DateRange;
  /** extra params to preserve (e.g. the transaction type filter) */
  hidden?: Record<string, string>;
}) {
  const inputClass =
    "h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <label className="text-xs font-medium text-text">
        From
        <input type="date" name="from" defaultValue={toDateInput(range.from)} className={`mt-1 block ${inputClass}`} />
      </label>
      <label className="text-xs font-medium text-text">
        To
        <input type="date" name="to" defaultValue={toDateInput(range.to)} className={`mt-1 block ${inputClass}`} />
      </label>
      <button className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-alt">
        Apply
      </button>
    </form>
  );
}

export function DownloadButton({
  allowed,
  href,
}: {
  allowed: boolean;
  href: string;
}) {
  if (allowed) {
    return (
      <a
        href={href}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Download CSV
      </a>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        aria-disabled
        title="Report downloads are on the Founding and Growth plans"
        className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-alt px-4 text-sm font-medium text-text-muted"
      >
        <span aria-hidden>🔒</span> Download CSV
      </span>
      <span className="text-xs text-text-muted">On Founding and Growth</span>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-text-muted">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-text hover:bg-surface-alt"
          >
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-text hover:bg-surface-alt"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
