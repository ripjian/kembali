"use client";

import { useState } from "react";

const TOTAL = 9;

/** Interactive demo stamp card — lets a visitor feel the product in two
 * taps. Coral = earned (BRAND.md); the stamp pop reuses the same motion
 * rules as the real card will (scale from 0.6, strong ease-out, <300ms). */
export function DemoCard() {
  const [stamps, setStamps] = useState(3);
  const done = stamps >= TOTAL;

  return (
    <div className="w-full max-w-sm rounded-[40px] border border-border bg-surface p-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-tight text-text-muted">
          Demo — Coffee Card
        </p>
        <p className="font-mono text-xs uppercase tracking-tight text-text-muted tabular-nums">
          {stamps}/{TOTAL}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className={
              i < stamps
                ? "step-in size-12 rounded-full bg-accent"
                : "size-12 rounded-full border-2 border-dashed border-border"
            }
          />
        ))}
      </div>

      <p className="mt-6 min-h-10 font-mono text-sm text-text-secondary" aria-live="polite">
        {done ? (
          <span className="text-accent-deep">
            Reward earned — a free coffee. This is the moment that brings
            customers back.
          </span>
        ) : (
          <>Tap &quot;Stamp it&quot; to see what your customer sees after each visit.</>
        )}
      </p>

      <button
        type="button"
        onClick={() => setStamps((s) => (done ? 3 : s + 1))}
        className="press mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary font-mono text-sm uppercase tracking-tight text-on-primary hover:bg-primary-hover"
      >
        {done ? "Start again ↺" : "Stamp it"}
      </button>
    </div>
  );
}
