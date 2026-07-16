"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/story", label: "Story" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/pricing", label: "Pricing" },
];

/** The floating top bar. The engine re-themes it per section (dark, light
 * or coral) and hides it on the way down, so the markup stays plain. */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="topbar" id="topbar">
      <Link className="lockup" href="/" aria-label="Kembali home">
        <svg viewBox="0 0 96 96" className="lockup-mark" aria-hidden>
          <circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="10" />
          <circle cx="48" cy="48" r="12" fill="var(--coral)" />
        </svg>
        <span className="lockup-word">
          kembal<span className="lockup-i">i</span>
        </span>
      </Link>

      <nav className="topnav" aria-label="Main">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            className={`tn-link mono${pathname === l.href ? " tn-active" : ""}`}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
        {/* staff and owners sign in here: the only way out of marketing */}
        <Link className="tn-link mono tn-signin" href="/admin">
          Sign in
        </Link>
      </nav>

      <Link className="chip-cta" href="/pricing">
        Start your card
      </Link>
    </header>
  );
}
