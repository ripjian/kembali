"use client";

import { useEffect, useRef } from "react";

/* The hero stamp card as a CSS 3D object. This component only wires the
 * POINTER tilt: on a fine pointer (and only when motion is welcome) it writes
 * --rx / --ry / --gx / --gy onto the card, throttled with requestAnimationFrame.
 * The scroll parallax and the 3D transform itself live in dimensional.css,
 * gated behind the same media queries, so on touch / reduced-motion the card
 * renders flat and this handler never attaches. Demo data: Corner Coffee, 7 of
 * 10 stamps. */

const TILT = 9; // max degrees

function ReturnLoop() {
  return (
    <svg viewBox="0 0 80 80" className="d9-slot-mark" aria-hidden>
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

export function DimensionalCard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!fine.matches || !motionOk.matches) return;

    let raf = 0;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      raf = 0;
      card.style.setProperty("--ry", `${nx * TILT}deg`);
      card.style.setProperty("--rx", `${-ny * TILT}deg`);
      card.style.setProperty("--gx", `${(nx + 0.5) * 100}%`);
      card.style.setProperty("--gy", `${(ny + 0.5) * 100}%`);
    };

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width - 0.5;
      ny = (e.clientY - r.top) / r.height - 0.5;
      card.dataset.tilt = "on";
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--gx", "50%");
      card.style.setProperty("--gy", "38%");
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const filled = 7;
  const total = 10;

  return (
    <div className="d9-stage" ref={stageRef}>
      <div className="d9-halo" aria-hidden />
      <div className="d9-card" ref={cardRef} data-tilt="on">
        <div className="d9-face">
          <span className="d9-gloss" aria-hidden />
          <div className="d9-face-head">
            <div>
              <p className="d9-shop">Corner Coffee</p>
              <p className="d9-shop-sub">Coffee Card · buy 9, get 1 free</p>
            </div>
            <span className="d9-code">KMB-7F2A</span>
          </div>

          <div className="d9-stamps">
            {Array.from({ length: total }, (_, i) => {
              const isFilled = i < filled;
              const isReward = i === total - 1;
              return (
                <span
                  key={i}
                  className="d9-slot"
                  data-filled={isFilled}
                  data-reward={isReward}
                >
                  {isFilled ? (
                    <ReturnLoop />
                  ) : isReward ? (
                    <span className="d9-slot-star">★</span>
                  ) : (
                    <span className="d9-slot-num">{i + 1}</span>
                  )}
                </span>
              );
            })}
          </div>

          <div className="d9-foot">
            <div className="d9-track" aria-hidden>
              <div
                className="d9-track-fill"
                style={
                  {
                    transform: `scaleX(${filled / total})`,
                    "--fill": filled / total,
                  } as React.CSSProperties
                }
              />
            </div>
            <div className="d9-meta">
              <span>Three visits to a free coffee</span>
              <span className="d9-num">
                {filled} / {total}
              </span>
            </div>
          </div>
        </div>

        <div className="d9-extras">
          <span className="d9-qr" aria-hidden>
            <svg viewBox="0 0 7 7">
              <g fill="#16261e">
                {[
                  [0, 0],
                  [4, 0],
                  [0, 4],
                ].map(([x, y]) => (
                  <g key={`${x}-${y}`}>
                    <rect x={x} y={y} width="3" height="3" rx="0.4" />
                    <rect
                      x={(x as number) + 0.7}
                      y={(y as number) + 0.7}
                      width="1.6"
                      height="1.6"
                      fill="#f7f1e2"
                    />
                    <rect
                      x={(x as number) + 1.1}
                      y={(y as number) + 1.1}
                      width="0.8"
                      height="0.8"
                      fill="#16261e"
                    />
                  </g>
                ))}
                {(
                  [
                    [3, 0],
                    [5, 0],
                    [0, 3],
                    [4, 3],
                    [6, 3],
                    [3, 5],
                    [6, 5],
                    [3, 6],
                  ] as [number, number][]
                ).map(([x, y]) => (
                  <rect key={`${x}-${y}`} x={x} y={y} width="0.86" height="0.86" />
                ))}
              </g>
            </svg>
          </span>
          <span className="d9-chip d9-chip-earn">Reward ready</span>
          <span className="d9-chip d9-chip-prog">
            {filled} of {total} stamps
          </span>
        </div>
      </div>
    </div>
  );
}
