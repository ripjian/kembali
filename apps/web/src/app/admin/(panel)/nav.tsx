"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { TenantModules } from "@/lib/modules";

export function AdminNav({
  isPlatform,
  modules,
}: {
  isPlatform: boolean;
  modules: TenantModules;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Overview", show: true },
    { href: "/admin/scan", label: "Scan & stamp", show: modules.scan },
    { href: "/admin/customers", label: "Customers", show: true },
    { href: "/admin/reports", label: "Reports", show: modules.reports },
    { href: "/admin/team", label: "Team", show: true },
    { href: "/admin/merchants", label: "Merchants", show: isPlatform },
    { href: "/admin/modules", label: "Modules", show: isPlatform },
  ].filter((l) => l.show);

  return (
    <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
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
