"use client";

import { useRef, useState } from "react";

/* The hero interaction: press a rubber stamp and watch coral ink land on the
 * next slot of a paper Coffee Card. Ten slots, tenth is the free coffee.
 * Motion is transform/opacity via kopitiam.css; under reduced-motion the
 * stamp still appears, just without the press travel or ink bloom. A polite
 * live region announces progress for screen readers. */

const TOTAL = 10;

function ReturnLoop() {
  // Kembali's return-loop mark, coral ink (earned). currentColor = coral.
  return (
    <svg viewBox="0 0 80 80" className="k-stamp k-stamp-land" aria-hidden>
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill="currentColor" />
      <circle cx="40" cy="40" r="9" fill="currentColor" />
    </svg>
  );
}

export function StampCard() {
  const [filled, setFilled] = useState(3);
  const [pressing, setPressing] = useState(false);
  const [hit, setHit] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const done = filled >= TOTAL;

  function press() {
    if (done || pressing) return;
    setPressing(true);
    setHit(true);
    // ink lands mid-press, at the bottom of the stamp's travel
    timers.current.push(
      setTimeout(() => setFilled((n) => Math.min(TOTAL, n + 1)), 150),
    );
    timers.current.push(setTimeout(() => setPressing(false), 400));
    timers.current.push(setTimeout(() => setHit(false), 260));
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPressing(false);
    setHit(false);
    setFilled(0);
  }

  return (
    <div>
      {/* one-time SVG filter: roughens the coral stamp edges like real ink */}
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id="k-inkrough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
      </svg>

      <div className={`k-card${hit ? " k-card-hit" : ""}`}>
        <div className="k-card-head">
          <div>
            <p className="k-card-shop">Corner Coffee</p>
            <p className="k-card-sub">Coffee Card &middot; buy 9, get 1 free</p>
          </div>
          <span className="k-punchcode">KMB-7F2A</span>
        </div>

        <div className="k-grid">
          {Array.from({ length: TOTAL }, (_, i) => {
            const isFilled = i < filled;
            const isReward = i === TOTAL - 1;
            const justLanded = isFilled && i === filled - 1;
            return (
              <div
                key={i}
                className="k-slot"
                data-filled={isFilled}
                data-reward={isReward}
              >
                {isFilled ? (
                  <>
                    {justLanded && <span className="k-bloom k-bloom-go" />}
                    <ReturnLoop />
                  </>
                ) : (
                  <span className="k-slot-num">{isReward ? "★" : i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="k-progress" aria-hidden>
          <div
            className="k-progress-fill"
            style={{ transform: `scaleX(${filled / TOTAL})` }}
          />
        </div>
      </div>

      <div className="k-tool-zone">
        <span className="k-inkpad" aria-hidden />
        <button
          type="button"
          className={`k-stamp-tool${pressing ? " k-stamp-press" : ""}`}
          onClick={press}
          disabled={done}
          aria-label={
            done ? "Card full, reward earned" : "Press the stamp to add a stamp"
          }
        >
          <span className="k-stamp-knob" aria-hidden />
          <span className="k-stamp-base" aria-hidden />
        </button>
        <p className="k-tool-hint" role="status" aria-live="polite">
          {done ? (
            <>
              Card full. Free coffee earned.{" "}
              <button type="button" className="k-link-reset" onClick={reset}>
                Start again
              </button>
            </>
          ) : (
            `Stamp ${filled} of ${TOTAL}. Press to collect the next.`
          )}
        </p>
      </div>
    </div>
  );
}
