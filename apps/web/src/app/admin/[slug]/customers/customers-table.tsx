"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* Customers table with clear affordances: the whole row is clickable
 * (mouse + keyboard) and each row carries a three-dot menu (View, Edit).
 * The name stays a real link for accessibility; the menu stops row
 * navigation so its own links win. */

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  joined: string;
  lastVisit: string;
  stamps: number;
  points: number;
}

export function CustomersTable({
  base,
  rows,
  showPoints,
  canEdit,
  empty,
}: {
  base: string;
  rows: CustomerRow[];
  showPoints: boolean;
  canEdit: boolean;
  empty: string;
}) {
  const router = useRouter();
  const cols = showPoints ? 6 : 5;

  return (
    <section className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-muted">
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Stamps</th>
            {showPoints && <th className="px-4 py-3 font-medium">Points</th>}
            <th className="px-4 py-3 font-medium">Last visit</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols + 1} className="px-4 py-6 text-text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((c) => {
            const href = `${base}/customers/${c.id}`;
            return (
              <tr
                key={c.id}
                onClick={() => router.push(href)}
                className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface-alt"
              >
                <td className="px-4 py-3">
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-text hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.phone}</td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {c.stamps}
                </td>
                {showPoints && (
                  <td className="px-4 py-3 tabular-nums text-text" data-stat>
                    {c.points}
                  </td>
                )}
                <td className="px-4 py-3 text-text-secondary">{c.lastVisit}</td>
                <td className="px-4 py-3 text-text-secondary">{c.joined}</td>
                <td className="px-4 py-3">
                  <RowMenu href={href} name={c.name} canEdit={canEdit} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function RowMenu({
  href,
  name,
  canEdit,
}: {
  href: string;
  name: string;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const itemClass =
    "block px-3 py-2 text-left text-sm text-text hover:bg-surface-alt";

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg border border-border px-2 py-1.5 text-text-secondary hover:bg-surface-alt hover:text-text"
      >
        <span aria-hidden className="text-base leading-none">
          ⋯
        </span>
      </button>
      {open && (
        <>
          {/* click-away backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            className="admin-menu absolute right-0 top-9 z-30 w-32 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
            <Link
              role="menuitem"
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={itemClass}
            >
              View
            </Link>
            {canEdit && (
              <Link
                role="menuitem"
                href={`${href}?edit=1`}
                onClick={(e) => e.stopPropagation()}
                className={itemClass}
              >
                Edit
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
