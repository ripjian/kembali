import Link from "next/link";

import { CONCEPTS } from "../content";

/* Fixed switcher shown on every concept so the founder can flip between them
 * while reviewing. Prev / count / next keeps a fixed compact width no matter
 * how many concepts exist (numbered pills would overflow 360px past five).
 * "All" jumps to the gallery for direct access to any concept. Self-contained
 * styling (concepts.css .cx-switch) so it stays legible on every canvas. */
export function ConceptNav({ current }: { current: number }) {
  const total = CONCEPTS.length;
  const prev = current === 1 ? total : current - 1;
  const next = current === total ? 1 : current + 1;
  return (
    <nav className="cx-switch" aria-label="Concept switcher">
      <Link href="/concepts" className="cx-switch-home">
        All
      </Link>
      <Link
        href={`/concepts/${prev}`}
        className="cx-switch-arrow"
        aria-label={`Concept ${prev}`}
        rel="prev"
      >
        &lsaquo;
      </Link>
      <span className="cx-switch-count" aria-current="page">
        {current}
        <span aria-hidden> / </span>
        {total}
      </span>
      <Link
        href={`/concepts/${next}`}
        className="cx-switch-arrow"
        aria-label={`Concept ${next}`}
        rel="next"
      >
        &rsaquo;
      </Link>
    </nav>
  );
}
