import Link from "next/link";
import { LogoLockup } from "@kembali/ui";

import { PillLink } from "./pill";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/roadmap", label: "Roadmap" },
];

export function SiteNav() {
  return (
    <>
      {/* Announcement bar — deepest surface, per the reference */}
      <div className="flex items-center justify-center gap-4 bg-primary px-4 py-2.5">
        <p className="font-mono text-xs uppercase tracking-tight text-on-primary sm:text-sm">
          Now looking for pilot cafés &amp; shops in Malaysia
        </p>
        <Link
          href="/#reach-out"
          className="press hidden rounded-full border border-on-primary px-4 py-1 font-mono text-xs uppercase tracking-tight text-on-primary sm:inline-flex"
        >
          Say hi
        </Link>
      </div>

      <header className="mx-auto flex h-20 w-full max-w-[1432px] items-center justify-between gap-6 px-6">
        <Link href="/" aria-label="Kembali home" className="shrink-0">
          <LogoLockup size={34} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-sm uppercase tracking-tight text-text hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* wrapper handles the responsive hide — PillLink's own display
              utility would win the CSS conflict against `hidden` */}
          <div className="hidden sm:block">
            <PillLink href="/admin" variant="ghost" className="h-10 px-5 text-xs">
              Merchant sign in
            </PillLink>
          </div>
          <PillLink href="/#reach-out" className="h-10 px-5 text-xs">
            Get started ▸
          </PillLink>
        </div>
      </header>
    </>
  );
}
