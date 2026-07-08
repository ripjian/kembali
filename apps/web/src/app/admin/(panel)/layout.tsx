import { redirect } from "next/navigation";
import { LogoMark } from "@kembali/ui";

import { schema, withTenant } from "@kembali/db";

import { adminLogout } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseModules } from "@/lib/modules";

import { AdminNav } from "./nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  const db = await getDb();
  const tenant = await withTenant(db, admin.tenantId, async (tx) => {
    const [row] = await tx
      .select({ name: schema.tenants.name, modules: schema.tenants.modules })
      .from(schema.tenants);
    return row ?? null;
  });
  const modules = parseModules(tenant?.modules);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-border p-4 md:min-h-dvh md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <LogoMark size={26} className="dark:hidden" />
          <LogoMark size={26} mono="sand" className="hidden dark:block" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">
              {tenant?.name ?? "Kembali"}
            </p>
            <p className="truncate text-xs text-text-muted">
              {admin.kind === "platform" ? "System admin" : admin.name}
            </p>
          </div>
        </div>

        <AdminNav
          isPlatform={admin.kind === "platform"}
          modules={modules}
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
