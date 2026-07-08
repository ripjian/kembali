import type { CSSProperties } from "react";

/* A café receipt — the subject's own artifact (frontend-design skill:
 * build from the subject's world). Perforated header, dotted leaders,
 * torn zigzag bottom. Rows light up in order via the rm-flow loop. */

export interface ReceiptLine {
  item: string;
  value: string;
}

export function ReceiptCard({
  title,
  lines,
  total,
  tilt = "-rotate-1",
}: {
  title: string;
  lines: ReceiptLine[];
  total: string;
  tilt?: string;
}) {
  return (
    <div className={`w-full max-w-md ${tilt}`}>
      <div className="panel-ring rounded-t-xl border border-b-0 border-border bg-surface px-6 pt-5">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          Corner Coffee
        </p>
        <p className="mt-1 text-center text-sm font-semibold text-text">{title}</p>
        <div className="receipt-perforation mt-4 h-1.5" aria-hidden />

        <ul className="flex flex-col py-4">
          {lines.map((line, i) => (
            <li
              key={line.item}
              className="rm-flow flex items-baseline py-2 text-sm"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="text-text">{line.item}</span>
              <span aria-hidden className="receipt-leader" />
              <span className="shrink-0 font-mono text-xs text-text-secondary">
                {line.value}
              </span>
            </li>
          ))}
        </ul>

        <div className="receipt-perforation h-1.5" aria-hidden />
        <div className="flex items-baseline justify-between py-4">
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Total
          </span>
          <span className="text-sm font-semibold text-text">{total}</span>
        </div>
      </div>
      <div className="receipt-tear" aria-hidden />
    </div>
  );
}
