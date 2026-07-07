import Link from "next/link";
import { LogoLockup } from "@kembali/ui";

import { ActionLink } from "./pill";

const links = [
  { href: "/#showcase", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/roadmap", label: "Roadmap" },
];

export function SiteNav() {
  return (
    <>
      <div className="flex items-center justify-center gap-4 bg-primary px-4 py-2">
        <p className="text-xs font-medium text-on-primary sm:text-sm">
          Now welcoming pilot cafés &amp; shops in Malaysia
        </p>
        <Link
          href="/#reach-out"
          className="press hidden rounded-full border border-on-primary/50 px-3 py-0.5 text-xs font-medium text-on-primary hover:border-on-primary sm:inline-flex"
        >
          Join the pilot
        </Link>
      </div>

      {/* Frosted sticky nav — the one glass surface that follows you,
          keeping the CTA in reach while you explore */}
      <header className="glass backdrop-blur-md sticky top-0 z-40 border-x-0 border-t-0 border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-6">
          <Link href="/" aria-label="Kembali home" className="shrink-0">
            <LogoLockup size={30} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-alt hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ActionLink href="/admin" variant="outline" className="h-9 px-4 text-xs">
                Merchant sign in
              </ActionLink>
            </div>
            <ActionLink href="/#reach-out" className="h-9 px-4 text-xs">
              Get started
            </ActionLink>
          </div>
        </div>
      </header>
    </>
  );
}
