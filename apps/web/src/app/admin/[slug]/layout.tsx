import { readAdminTheme } from "@/lib/admin-theme";
import { getPanelContext } from "@/lib/panel";

import { AdminSidebar, MobileMenu } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const { admin, tenant } = ctx;
  const theme = await readAdminTheme();

  const sidebarProps = {
    base: ctx.base,
    tenantName: tenant.name,
    tenantLogoUrl: tenant.logoUrl,
    adminLabel: admin.kind === "platform" ? "Kembali · system admin" : admin.name,
    isPlatform: admin.kind === "platform",
    modules: tenant.modules,
    allowed: {
      scan: ctx.can("scan"),
      customers: ctx.can("manageCustomers"),
      rewards: ctx.can("manageRewards"),
      reports: ctx.can("viewReports"),
      team: ctx.can("manageTeam") || admin.kind === "platform",
    },
    theme,
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col lg:flex-row">
      {/* Mobile/tablet (below lg): hamburger top bar + drawer */}
      <MobileMenu {...sidebarProps} />

      {/* Desktop: sticky full-height rail so Sign out is always in view */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-border p-4 lg:flex lg:w-60">
        <AdminSidebar {...sidebarProps} />
      </aside>

      <div className="min-w-0 flex-1 p-5 sm:p-8">{children}</div>
    </div>
  );
}
