"use client";

import { useEffect, useRef, useState } from "react";

/* The two glass activity cards floating over the hero dashboard. They drift
 * gently and continuously (transform-only), and pause when the hero scrolls
 * out of view - decorative loops shouldn't run off-screen (emil-design-eng).
 * Positioning stays absolute against the mockup container; this wrapper is
 * static so it doesn't become the offset parent. */
export function HeroFloats() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-inview={inView ? "true" : "false"} aria-hidden>
      <div className="rm-drift glass backdrop-blur-md absolute left-3 top-24 z-10 rounded-xl px-3.5 py-2.5 sm:left-10">
        <p className="text-xs font-medium text-text">+1 stamp collected</p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Aisyah is 3 away from a free coffee
        </p>
      </div>
      <div className="rm-drift-slow glass backdrop-blur-md absolute right-3 top-40 z-10 rounded-xl px-3.5 py-2.5 sm:right-10">
        <p className="font-mono text-sm text-text">↗ 41%</p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          repeat visits this month
        </p>
      </div>
    </div>
  );
}
