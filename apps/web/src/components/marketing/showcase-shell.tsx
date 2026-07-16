"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { initShowcase } from "./showcase-engine";

/** The engine's lifecycle, plus the fixed overlays it draws into.
 *
 * The marketing layout survives client navigation, so the engine is keyed
 * to the pathname: leaving a route tears down every listener, observer,
 * timer and frame loop, and the next route initialises against its own
 * DOM. The overlays sit inside .sc-root so they inherit the marketing
 * tokens; being position:fixed, their place in the tree costs nothing. */
export function ShowcaseShell() {
  const pathname = usePathname();

  useEffect(() => initShowcase(), [pathname]);

  return (
    <>
      <canvas id="inkCanvas" aria-hidden />
      <div className="cursor-dot" id="cursorDot" aria-hidden />
    </>
  );
}
