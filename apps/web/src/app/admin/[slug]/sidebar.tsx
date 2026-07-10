"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@kembali/ui";

import { adminLogout, setAdminTheme } from "@/lib/admin-actions";
import type { AdminTheme } from "@/lib/admin-theme";
import type { TenantModules } from "@/lib/modules";

import { AdminNav } from "./nav";

interface SidebarProps {
  base: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  adminLabel: string;
  isPlatform: boolean;
  modules: TenantModules;
  allowed: {
    scan: boolean;
    customers: boolean;
    rewards: boolean;
    reports: boolean;
    team: boolean;
  };
  theme: AdminTheme;
}

function ThemeToggle({ theme }: { theme: AdminTheme }) {
  const options: { value: AdminTheme; label: string }[] = [
    { value: "", label: "Auto" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];
  return (
    <form action={setAdminTheme} className="flex gap-0.5 rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value || "auto"}
          name="theme"
          value={o.value}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            theme === o.value
              ? "bg-surface-alt text-text"
              : "text-text-muted hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </form>
  );
}

/** The full sidebar content - logo, nav, appearance and sign out. Shared by
 * the desktop rail and the mobile drawer. */
export function AdminSidebar({
  base,
  tenantName,
  tenantLogoUrl,
  adminLabel,
  isPlatform,
  modules,
  allowed,
  theme,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        {tenantLogoUrl ? (
          // merchant-uploaded square logo (data URL - no optimizer)
          <img
            src={tenantLogoUrl}
            alt=""
            className="size-8 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <>
            <LogoMark size={26} className="dark:hidden" />
            <LogoMark size={26} mono="sand" className="hidden dark:block" />
          </>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{tenantName}</p>
          <p className="truncate text-xs text-text-muted">{adminLabel}</p>
        </div>
      </div>

      {isPlatform && (
        <Link
          href="/admin/merchants"
          onClick={onNavigate}
          className="mx-2 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-text-secondary hover:bg-surface-alt hover:text-text"
        >
          ← All merchants
        </Link>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AdminNav base={base} modules={modules} allowed={allowed} onNavigate={onNavigate} />
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border px-2 pt-3">
        <ThemeToggle theme={theme} />
        <form action={adminLogout}>
          <button className="text-xs font-medium text-text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

/** Mobile/tablet chrome: a top bar with the hamburger on the LEFT and a
 * slide-in drawer holding the same sidebar. */
export function MobileMenu(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border p-2 text-text hover:bg-surface-alt"
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {props.tenantLogoUrl ? (
            <img src={props.tenantLogoUrl} alt="" className="size-6 shrink-0 rounded border border-border object-cover" />
          ) : (
            <LogoMark size={20} className="dark:hidden" />
          )}
          <p className="truncate text-sm font-semibold text-text">{props.tenantName}</p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/40"
          />
          <div className="admin-drawer absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-hidden border-r border-border bg-surface p-4">
            <AdminSidebar {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
