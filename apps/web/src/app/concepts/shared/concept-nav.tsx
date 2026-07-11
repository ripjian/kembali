import Link from "next/link";

/* Fixed switcher shown on every concept so the founder can flip between the
 * five while reviewing. Self-contained styling (concepts.css .cx-switch) so it
 * stays legible on every canvas. Not part of any concept's visual language. */
export function ConceptNav({ current }: { current: number }) {
  return (
    <nav className="cx-switch" aria-label="Concept switcher">
      <Link href="/concepts" className="cx-switch-home">
        All 5
      </Link>
      {[1, 2, 3, 4, 5].map((n) => (
        <Link
          key={n}
          href={`/concepts/${n}`}
          data-current={n === current}
          aria-current={n === current ? "page" : undefined}
          aria-label={`Concept ${n}`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
