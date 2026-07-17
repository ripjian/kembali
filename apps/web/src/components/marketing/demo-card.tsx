"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

const TOTAL = 10;

interface DemoCardProps {
  /** Shown on the card. The reach-out flow passes the visitor's own shop. */
  shop?: string;
  /** What the full card earns, in the visitor's words. */
  reward?: string;
  /** The shop's colour, so the simulator already looks like theirs. */
  accent?: string;
  /** Where the card starts, so a fresh card can feel nearly done. */
  initial?: number;
}

/** The one card a visitor can actually touch.
 *
 * Same design language as the story's big card and the phone card:
 * dashed sand circles, a coral ring stamp, serif name, mono count.
 * Coral is what you earn (BRAND.md), so the stamps stay coral even when a
 * merchant colour is set: that colour dresses the card, not the reward. */
export function DemoCard({
  shop = "Corner Coffee",
  reward = "a free coffee",
  accent,
  initial = 3,
}: DemoCardProps) {
  const [stamps, setStamps] = useState(initial);
  const done = stamps >= TOTAL;

  return (
    <div
      className="demo-card"
      style={accent ? ({ "--demo-accent": accent } as CSSProperties) : undefined}
    >
      <div className="dc-head">
        <b className="dc-name">{shop.trim() || "Corner Coffee"}</b>
        <span className="dc-shop mono">Stamp card</span>
      </div>

      <div className="dc-grid" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={`dc-stamp${i < stamps ? " on" : ""}`}>
            <svg viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="34" fill="none" stroke="var(--coral)" strokeWidth="11" />
              <circle cx="48" cy="48" r="13" fill="var(--coral)" />
            </svg>
          </span>
        ))}
      </div>

      <div className="dc-foot">
        <span className="mono">
          {stamps} of {TOTAL}
        </span>
        <span className="dc-hint" role="status">
          {/* a colon, so the reward never has to start a sentence */}
          {done
            ? `Card full: ${reward.trim() || "a free coffee"} is on the house.`
            : `${TOTAL - stamps} more for ${reward.trim() || "a free coffee"}.`}
        </span>
      </div>

      <div className="dc-actions">
        <button
          type="button"
          className="btn btn-solid dc-btn"
          onClick={() => setStamps((s) => Math.min(TOTAL, s + 1))}
          disabled={done}
        >
          Add a stamp
        </button>
        <button type="button" className="btn btn-ghost dc-btn" onClick={() => setStamps(0)}>
          Start again
        </button>
      </div>
    </div>
  );
}
