"use client";

import { useState } from "react";

const TOTAL = 10;

/** Interactive demo stamp card - lets a visitor feel the product in two
 * taps. Coral = earned (BRAND.md); the stamp pop follows the same motion
 * rules as the real card will (scale from 0.6, strong ease-out, <300ms). */
export function DemoCard() {
  const [stamps, setStamps] = useState(3);
  const done = stamps >= TOTAL;

  return (
    <div className="panel-ring w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">Try it yourself</p>
        <p className="font-mono text-xs text-text-muted tabular-nums">
          {stamps}/{TOTAL}
        </p>
      </div>

      {/* Exactly 2 rows of 5, each stamp filling its cell so the grid stays
          evenly spaced at every width. */}
      <div className="mt-5 grid grid-cols-5 gap-2.5 sm:gap-3" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className={
              i < stamps
                ? "step-in aspect-square w-full rounded-full bg-accent"
                : "aspect-square w-full rounded-full border-2 border-dashed border-border"
            }
          />
        ))}
      </div>

      <p className="mt-5 min-h-10 text-sm leading-relaxed text-text-secondary" aria-live="polite">
        {done ? (
          <span className="font-medium text-accent-deep">
            Reward earned: a free coffee. This is the moment your regulars
            look forward to.
          </span>
        ) : (
          <>Tap &quot;Stamp it&quot; to see what your customer sees after each visit.</>
        )}
      </p>

      <button
        type="button"
        onClick={() => setStamps((s) => (done ? 3 : s + 1))}
        className="press mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-on-primary shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:bg-primary-hover"
      >
        {done ? "Start again" : "Stamp it"}
      </button>
    </div>
  );
}
