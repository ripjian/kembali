"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { TenantModules } from "@/lib/modules";

export function AdminNav({
  base,
  modules,
  allowed,
}: {
  base: string;
  modules: TenantModules;
  allowed: {
    scan: boolean;
    customers: boolean;
    rewards: boolean;
    reports: boolean;
    team: boolean;
  };
}) {
  const pathname = usePathname();

  const links = [
    { href: base, label: "Overview", show: true },
    { href: `${base}/scan`, label: "Scan & stamp", show: modules.scan && allowed.scan },
    { href: `${base}/customers`, label: "Customers", show: allowed.customers },
    { href: `${base}/rewards`, label: "Rewards", show: modules.rewards && allowed.rewards },
    { href: `${base}/reports`, label: "Reports", show: modules.reports && allowed.reports },
    { href: `${base}/team`, label: "Team", show: allowed.team },
  ].filter((l) => l.show);

  return (
    <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
      {links.map((link) => {
        const active =
          link.href === base ? pathname === base : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-surface-alt text-text"
                : "text-text-secondary hover:bg-surface-alt hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
