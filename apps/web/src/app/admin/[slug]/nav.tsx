"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { TenantModules } from "@/lib/modules";

export function AdminNav({
  base,
  modules,
  allowed,
  onNavigate,
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
  /** Called when a link is tapped - lets the mobile drawer close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const links = [
    { href: base, label: "Overview", show: true },
    { href: `${base}/scan`, label: "Scan & stamp", show: modules.scan && allowed.scan },
    { href: `${base}/qr-kit`, label: "QR kit", show: true },
    { href: `${base}/customers`, label: "Customers", show: allowed.customers },
    { href: `${base}/rewards`, label: "Rewards", show: modules.rewards && allowed.rewards },
    {
      href: `${base}/reports`,
      label: "Reports",
      show: modules.reports && allowed.reports,
      sub: [
        { href: `${base}/reports`, label: "Overview", exact: true },
        { href: `${base}/reports/customers`, label: "Customers" },
        { href: `${base}/reports/transactions`, label: "Transactions" },
        ...(modules.rewards
          ? [{ href: `${base}/reports/rewards`, label: "Rewards" }]
          : []),
      ],
    },
    { href: `${base}/team`, label: "Team", show: allowed.team },
  ].filter((l) => l.show);

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          link.href === base ? pathname === base : pathname.startsWith(link.href);
        const showSub = "sub" in link && link.sub && active;
        return (
          <div key={link.href} className="block">
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-alt text-text"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
              }`}
            >
              {link.label}
            </Link>
            {showSub && (
              <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                {link.sub!.map((s) => {
                  const subActive = s.exact
                    ? pathname === s.href
                    : pathname.startsWith(s.href);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={onNavigate}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        subActive
                          ? "text-text"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
