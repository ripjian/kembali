import "server-only";

import { redirect } from "next/navigation";

import {
  resolveRolePermissions,
  type PermissionKey,
  type RolePermissionMatrix,
} from "@kembali/core";
import { schema, withPlatform, withTenant } from "@kembali/db";
import { eq } from "drizzle-orm";

import { getAdminContext, type AdminContext } from "./auth";
import { getDb } from "./db";
import { parseModules, type TenantModules } from "./modules";

/* Path-based tenancy: every merchant panel lives at /admin/[slug]/…
 * Staff are locked to their own store's slug; platform admins may open any
 * store (each merchant path is theirs alone — the system admin area at
 * /admin/merchants is never shared with merchant users). */

export interface PanelTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  modules: TenantModules;
  permissions: RolePermissionMatrix;
}

export interface PanelContext {
  admin: AdminContext;
  tenant: PanelTenant;
  /** May this session do `key` in this store? Platform admins may do all. */
  can: (key: PermissionKey) => boolean;
  /** Panel home, e.g. /admin/corner-coffee */
  base: string;
}

function toPanelTenant(row: {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  modules: unknown;
  rolePermissions: unknown;
}): PanelTenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    modules: parseModules(row.modules),
    permissions: resolveRolePermissions(row.rolePermissions),
  };
}

/** Resolve + authorize the panel for a slug. Redirects (never returns)
 * when the session is missing or not allowed to see this store. */
export async function getPanelContext(slug: string): Promise<PanelContext> {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  const db = await getDb();

  if (admin.kind === "staff") {
    const tenantRow = await withTenant(db, admin.tenantId!, async (tx) => {
      const [row] = await tx.select().from(schema.tenants);
      return row ?? null;
    });
    if (!tenantRow) redirect("/admin/login");
    if (tenantRow.slug !== slug) redirect(`/admin/${tenantRow.slug}`);
    const tenant = toPanelTenant(tenantRow);
    return {
      admin,
      tenant,
      can: (key) =>
        admin.role === "platform"
          ? true
          : tenant.permissions[admin.role as "owner" | "manager" | "cashier"][key],
      base: `/admin/${tenant.slug}`,
    };
  }

  const tenantRow = await withPlatform(db, async (tx) => {
    const [row] = await tx
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug));
    return row ?? null;
  });
  if (!tenantRow) redirect("/admin/merchants");
  const tenant = toPanelTenant(tenantRow);
  return {
    admin,
    tenant,
    can: () => true,
    base: `/admin/${tenant.slug}`,
  };
}

/** Authorize a mutation for a tenant id coming from a form. Returns the
 * context or redirects. `permission` is skipped for platform admins. */
export async function authorizeTenantAction(
  tenantId: string,
  permission: PermissionKey | null,
): Promise<{ admin: AdminContext; slug: string }> {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  const db = await getDb();

  if (admin.kind === "staff") {
    if (admin.tenantId !== tenantId) redirect("/admin");
    const tenantRow = await withTenant(db, tenantId, async (tx) => {
      const [row] = await tx.select().from(schema.tenants);
      return row ?? null;
    });
    if (!tenantRow) redirect("/admin");
    if (permission) {
      const matrix = resolveRolePermissions(tenantRow.rolePermissions);
      const role = admin.role as "owner" | "manager" | "cashier";
      if (!matrix[role][permission]) redirect(`/admin/${tenantRow.slug}?denied=1`);
    }
    return { admin, slug: tenantRow.slug };
  }

  const tenantRow = await withPlatform(db, async (tx) => {
    const [row] = await tx
      .select({ slug: schema.tenants.slug })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId));
    return row ?? null;
  });
  if (!tenantRow) redirect("/admin/merchants");
  return { admin, slug: tenantRow.slug };
}
