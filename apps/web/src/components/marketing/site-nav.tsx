"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Story" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/pricing", label: "Pricing" },
];

/** The floating top bar. The engine re-themes it per section (dark, light
 * or coral) and hides it on the way down, so the markup stays plain.
 *
 * Below 640px the links move into a drawer that covers 80% of the screen;
 * the visible sliver of page (plus the scrim) is the way out. The drawer is
 * a sibling of the header, not a child: the topbar animates its transform,
 * and a transformed ancestor would re-anchor position: fixed. */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
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
        </nav>

        {/* staff and owners sign in here: the only way out of marketing */}
        <Link className="chip-cta" href="/admin">
          Merchant login
        </Link>

        <button
          type="button"
          className="nav-burger"
          aria-expanded={open}
          aria-controls="mobileMenu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div className={`nav-scrim${open ? " open" : ""}`} onClick={close} aria-hidden />
      <div className={`nav-drawer${open ? " open" : ""}`} id="mobileMenu">
        <div className="nd-head">
          <p className="nd-eyebrow mono">Menu</p>
          <button type="button" className="nd-close" aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 20 20" aria-hidden>
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="nd-links" aria-label="Menu">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              className={pathname === l.href ? "nd-active" : ""}
              href={l.href}
              onClick={close}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nd-foot">
          <Link className="chip-cta" href="/admin" onClick={close}>
            Merchant login
          </Link>
          <p className="nd-note mono">hello@kembali.app</p>
        </div>
      </div>
    </>
  );
}
