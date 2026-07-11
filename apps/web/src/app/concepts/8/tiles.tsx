"use client";

import { useEffect, useRef, useState } from "react";

/* Live micro-demos for the bento tiles. Each interaction exists only to
 * explain one real Kembali module. Motion is transform/opacity; under
 * prefers-reduced-motion the counters and charts show their final value at
 * once and the stamp/flip still work without animation. Classes come from
 * bento.css. */

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Fires once when the element scrolls into view (or immediately if reduced).
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (prefersReduced()) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function ReturnLoop() {
  return (
    <svg viewBox="0 0 80 80" className="b-mark b-mark-land" aria-hidden>
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

const TOTAL = 10;

export function StampTile() {
  const [filled, setFilled] = useState(4);
  const pressing = useRef(false);
  const done = filled >= TOTAL;

  function stamp() {
    if (done || pressing.current) return;
    pressing.current = true;
    setFilled((n) => Math.min(TOTAL, n + 1));
    window.setTimeout(() => {
      pressing.current = false;
    }, 200);
  }

  return (
    <div className="b-tile b-2x1">
      <span className="b-tag">Stamping</span>
      <div className="b-stamp-head">
        <div>
          <p className="b-stamp-shop">Corner Coffee</p>
          <p className="b-stamp-sub">Buy 9, get 1 free</p>
        </div>
        <span className="b-code">KMB-7F2A</span>
      </div>
      <div className="b-slots">
        {Array.from({ length: TOTAL }, (_, i) => {
          const isFilled = i < filled;
          const isReward = i === TOTAL - 1;
          const justLanded = isFilled && i === filled - 1;
          return (
            <span
              key={i}
              className="b-slot"
              data-filled={isFilled}
              data-reward={isReward}
            >
              {isFilled ? (
                justLanded ? (
                  <ReturnLoop />
                ) : (
                  <svg viewBox="0 0 80 80" className="b-mark" aria-hidden>
                    <path
                      d="M64 40 A24 24 0 1 1 57 23"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <polygon
                      points="62.7,28.7 60.5,19.5 53.5,26.5"
                      fill="currentColor"
                    />
                    <circle cx="40" cy="40" r="9" fill="currentColor" />
                  </svg>
                )
              ) : (
                <span className="b-slot-num">{isReward ? "★" : i + 1}</span>
              )}
            </span>
          );
        })}
      </div>
      <div className="b-stamp-foot">
        <span className="b-progress" aria-hidden>
          <span
            className="b-progress-fill"
            style={{ transform: `scaleX(${filled / TOTAL})` }}
          />
        </span>
        <button
          type="button"
          className="b-flip-btn"
          onClick={stamp}
          disabled={done}
        >
          {done ? "Card full" : "Add a stamp"}
        </button>
      </div>
      <p className="b-hint" role="status" aria-live="polite">
        {done
          ? "Reward earned. Free coffee on the next visit."
          : `Stamp ${filled} of ${TOTAL}. Tap to collect one.`}
      </p>
    </div>
  );
}

export function PointsTile() {
  const { ref, seen } = useInView<HTMLDivElement>();
  const [n, setN] = useState(0);
  const target = 2480;

  useEffect(() => {
    if (!seen) return;
    if (prefersReduced()) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen]);

  return (
    <div className="b-tile b-1x1" ref={ref}>
      <span className="b-tag">Points</span>
      <p className="b-points-num">{n.toLocaleString("en-US")}</p>
      <span className="b-chip">
        <span className="b-chip-dot" aria-hidden />
        Points, ready to redeem
      </span>
    </div>
  );
}

export function RewardFlipTile() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="b-tile b-1x1">
      <span className="b-tag">Rewards</span>
      <div className="b-flip" data-flipped={flipped}>
        <div className="b-flip-inner">
          <div className="b-face b-face-front">
            <div>
              <p className="b-reward-title">Free coffee</p>
              <p className="b-reward-meta">120 points · redeem in store</p>
            </div>
            <button
              type="button"
              className="b-flip-btn"
              onClick={() => setFlipped(true)}
              aria-label="Show the redemption code"
            >
              Show code
            </button>
          </div>
          <div className="b-face b-face-back">
            <span className="b-reward-back-label">Show at the counter</span>
            <span className="b-reward-code">KMB-7F2A-3K9P</span>
            <button
              type="button"
              className="b-flip-btn b-flip-btn-back"
              onClick={() => setFlipped(false)}
            >
              Hide code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const WEEK = [
  { day: "M", v: 0.52 },
  { day: "T", v: 0.44 },
  { day: "W", v: 0.6 },
  { day: "T", v: 0.72 },
  { day: "F", v: 0.83 },
  { day: "S", v: 1, peak: true },
  { day: "S", v: 0.68 },
];

export function ChartTile() {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div className="b-tile b-1x1" ref={ref}>
      <span className="b-tag">Reports</span>
      <div className="b-chart" aria-hidden>
        {WEEK.map((d, i) => (
          <span key={i} className="b-bar-col">
            <span className="b-bar-track">
              <span
                className="b-bar"
                data-peak={d.peak ? "true" : undefined}
                style={{ transform: `scaleY(${seen ? d.v : 0.12})` }}
              />
            </span>
            <span className="b-bar-label">{d.day}</span>
          </span>
        ))}
      </div>
      <p className="b-chart-caption">
        Busiest day this week: <b>Saturday</b>
      </p>
    </div>
  );
}
