"use client";

import { useEffect, useRef, useState } from "react";

/* The hero prop: a Corner Coffee wallet pass floating in stacked glass. Two
 * offset glass layers behind the front pass give depth; a coral glow pools
 * behind it. Six of ten stamps are earned (coral-lit), leaf shows progress.
 * The whole stack drifts on a slow transform loop that PAUSES when the pass
 * scrolls off-screen (IntersectionObserver) and under reduced-motion (CSS).
 * The drift is gated by data-drift so nothing animates until it is both
 * mounted and visible. */

const TOTAL = 10;
const EARNED = 6;

function ReturnLoop() {
  // Kembali's return-loop mark in coral (earned). currentColor = coral-lit.
  return (
    <svg viewBox="0 0 80 80" className="g-slot-mark" aria-hidden>
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill="currentColor" />
      <circle cx="40" cy="40" r="9" fill="currentColor" />
    </svg>
  );
}

export function WalletPass() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className="g-pass-stage g-drift"
      data-drift={visible}
      role="img"
      aria-label="Corner Coffee digital coffee card, six of ten stamps collected"
    >
      <span aria-hidden className="g-pass-glow" />
      <span aria-hidden className="g-pass-layer l1" />
      <span aria-hidden className="g-pass-layer l2" />

      <div className="g-pass backdrop-blur-xl">
        <div className="g-pass-head">
          <div>
            <p className="g-pass-shop">Corner Coffee</p>
            <p className="g-pass-sub">Coffee Card &middot; buy 9, get 1 free</p>
          </div>
          <span aria-hidden className="g-pass-logo">
            CC
          </span>
        </div>

        <div className="g-pass-stamps">
          {Array.from({ length: TOTAL }, (_, i) => {
            const isFilled = i < EARNED;
            const isReward = i === TOTAL - 1;
            return (
              <div
                key={i}
                className="g-slot"
                data-filled={isFilled}
                data-reward={isReward}
              >
                {isFilled ? (
                  <ReturnLoop />
                ) : isReward ? (
                  <span aria-hidden className="g-slot-star">
                    &#9733;
                  </span>
                ) : (
                  <span aria-hidden className="g-slot-num">
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="g-pass-foot">
          <div className="g-pass-progress" aria-hidden>
            <div
              className="g-pass-fill"
              style={{ transform: `scaleX(${EARNED / TOTAL})` }}
            />
          </div>
          <div className="g-pass-meta">
            <span>
              <span className="g-num">{EARNED}</span> of{" "}
              <span className="g-num">{TOTAL}</span> stamps
            </span>
            <span className="g-pass-code">KMB-7F2A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
