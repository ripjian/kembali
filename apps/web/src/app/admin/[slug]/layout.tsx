import Link from "next/link";
import { LogoMark } from "@kembali/ui";

import { adminLogout } from "@/lib/admin-actions";
import { getPanelContext } from "@/lib/panel";

import { AdminNav } from "./nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const { admin, tenant } = ctx;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-border p-4 md:min-h-dvh md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2.5 px-2 pt-1">
          {tenant.logoUrl ? (
            // merchant-uploaded square logo (data URL — no optimizer)
            <img
              src={tenant.logoUrl}
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
            <p className="truncate text-sm font-semibold text-text">{tenant.name}</p>
            <p className="truncate text-xs text-text-muted">
              {admin.kind === "platform" ? "Kembali · system admin" : admin.name}
            </p>
          </div>
        </div>

        {admin.kind === "platform" && (
          <Link
            href="/admin/merchants"
            className="mx-2 rounded-lg border border-border px-3 py-2 text-center text-xs font-medium text-text-secondary hover:bg-surface-alt hover:text-text"
          >
            ← All merchants
          </Link>
        )}

        <AdminNav
          base={ctx.base}
          modules={tenant.modules}
          allowed={{
            scan: ctx.can("scan"),
            customers: ctx.can("manageCustomers"),
            rewards: ctx.can("manageRewards"),
            reports: ctx.can("viewReports"),
            team: ctx.can("manageTeam") || admin.kind === "platform",
          }}
        />

        <form action={adminLogout} className="mt-auto px-2 pb-1">
          <button className="text-xs font-medium text-text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1 p-5 sm:p-8">{children}</div>
    </div>
  );
}
