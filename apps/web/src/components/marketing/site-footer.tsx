import Link from "next/link";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Story" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/pricing", label: "Pricing" },
];

const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="footer" data-theme="dark">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <svg className="footer-loop" viewBox="0 0 120 120" aria-hidden>
            <path
              id="loopPath"
              d="M60 14 a46 46 0 1 1 -32.5 13.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <circle cx="60" cy="60" r="13" fill="var(--coral)" />
          </svg>
          <p className="footer-word">
            kembal<span className="lockup-i">i</span>
          </p>
          <p className="footer-line">Loyalty your customers will love.</p>
        </div>

        <nav className="footer-nav mono" aria-label="Footer">
          <div className="fn-col">
            {PAGES.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="fn-col">
            {COMPANY.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/admin">Sign in</Link>
          </div>
        </nav>

        <div className="footer-meta mono">
          <p>Built for Malaysian shops · Petaling Jaya</p>
          <p>PDPA: marketing is opt-in · export or delete your data any time</p>
          <p>&copy; 2026 Kembali</p>
        </div>
      </div>
    </footer>
  );
}
