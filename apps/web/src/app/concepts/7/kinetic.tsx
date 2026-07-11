"use client";

import { useEffect, useRef } from "react";

/* Pointer-reactive display line. Each letter of the lead words thickens and
 * widens as the cursor nears it (font-variation-settings on wght/wdth, written
 * on requestAnimationFrame). The final word "back." is left to the scroll
 * "return" animation in kinetic.css and stays coral. The pointer effect only
 * attaches on a fine pointer with motion welcome; otherwise every letter keeps
 * its default weight and the line is fully readable. */

const LEAD = "Your best customers come ";
const RETURN_WORD = "back.";

const BASE_WGHT = 520;
const MAX_WGHT = 900;
const BASE_WDTH = 100;
const MAX_WDTH = 130;
const RADIUS = 150; // px falloff around the pointer

export function KineticHeadline() {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!fine.matches || !motionOk.matches) return;

    const chars = Array.from(
      root.querySelectorAll<HTMLElement>(".k7-ch"),
    );
    let raf = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      for (const ch of chars) {
        const r = ch.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(px - cx, py - cy);
        const t = Math.max(0, 1 - d / RADIUS); // 1 near cursor, 0 far
        const eased = t * t;
        const wght = Math.round(BASE_WGHT + (MAX_WGHT - BASE_WGHT) * eased);
        const wdth = Math.round(BASE_WDTH + (MAX_WDTH - BASE_WDTH) * eased);
        ch.style.setProperty("--wght", String(wght));
        ch.style.setProperty("--wdth", String(wdth));
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      for (const ch of chars) {
        ch.style.setProperty("--wght", String(BASE_WGHT));
        ch.style.setProperty("--wdth", String(BASE_WDTH));
      }
    };

    window.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h1 className="k7-flex k7-hero-line" ref={ref}>
      <span className="k7-word">
        {LEAD.split("").map((c, i) => (
          <span key={i} className="k7-ch" aria-hidden>
            {c}
          </span>
        ))}
      </span>
      <span className="k7-return k7-flex">{RETURN_WORD}</span>
      {/* accessible text, since the visible line is split into aria-hidden spans */}
      <span className="sr-only">Your best customers come back.</span>
    </h1>
  );
}
