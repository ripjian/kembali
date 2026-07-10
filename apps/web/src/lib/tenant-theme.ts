import "server-only";

import { deriveTenantTheme } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { eq } from "drizzle-orm";

import { getDb } from "./db";

/* Per-tenant white-label theming for the CUSTOMER-facing surfaces (join,
 * card home, rewards, redeem). Reads the platform-admin-set brand colours,
 * derives an AA-safe variable set with the shared @kembali/core maths, and
 * emits a scoped <style> overriding the --tenant-* slots defined in
 * packages/ui. Null colours mean the Kembali default Pandan theme, so the
 * defaults already in :root apply and nothing is emitted. */

// Card surface per mode (BRAND.md --surface); text/line variants are derived
// against these so they stay legible in light and dark.
const SURFACE_LIGHT = "#ffffff";
const SURFACE_DARK = "#182b23";

// Fallbacks used only to satisfy the deriver when one colour is left default;
// the corresponding vars are not emitted in that case.
const DEFAULT_PRIMARY = "#0f3d32";
const DEFAULT_ACCENT = "#e0684b";

export interface TenantColors {
  primary: string | null;
  accent: string | null;
}

/** Read a tenant's brand colours. Returns null when neither is set (the
 * merchant keeps the Kembali default). RLS scopes the read to this tenant. */
export async function getTenantColors(
  tenantId: string,
): Promise<TenantColors | null> {
  const db = await getDb();
  const row = await withTenant(db, tenantId, async (tx) => {
    const [t] = await tx
      .select({
        primary: schema.tenants.brandPrimary,
        accent: schema.tenants.brandAccent,
      })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId));
    return t ?? null;
  });
  if (!row || (!row.primary && !row.accent)) return null;
  return { primary: row.primary, accent: row.accent };
}

/** A stable, valid CSS class for a tenant so multiple themed subtrees never
 * collide (e.g. a logged-in customer of A viewing B's join page). */
export function tenantScopeClass(tenantId: string): string {
  return `tt-${tenantId.replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
}

/** Scoped CSS overriding the --tenant-* slots. Only emits the vars for the
 * colours that are actually customised; the rest keep the Kembali default. */
export function tenantThemeCss(scope: string, colors: TenantColors): string {
  const light = deriveTenantTheme(
    colors.primary ?? DEFAULT_PRIMARY,
    colors.accent ?? DEFAULT_ACCENT,
    SURFACE_LIGHT,
  );
  const dark = deriveTenantTheme(
    colors.primary ?? DEFAULT_PRIMARY,
    colors.accent ?? DEFAULT_ACCENT,
    SURFACE_DARK,
  );

  const base: string[] = [];
  const darkVars: string[] = [];

  if (colors.primary) {
    base.push(`--tenant-primary:${light.primary}`);
    base.push(
      `--tenant-primary-hover:color-mix(in srgb, ${light.primary}, #000 10%)`,
    );
    base.push(`--tenant-on-primary:${light.onPrimary}`);
    base.push(`--tenant-progress:${light.primary}`);
    base.push(`--tenant-primary-text:${light.primaryText}`);
    darkVars.push(`--tenant-primary-text:${dark.primaryText}`);
  }
  if (colors.accent) {
    base.push(`--tenant-accent:${light.accent}`);
    base.push(`--tenant-on-accent:${light.onAccent}`);
    base.push(`--tenant-accent-deep:${light.accentDeep}`);
    darkVars.push(`--tenant-accent-deep:${dark.accentDeep}`);
  }

  let css = `.${scope}{${base.join(";")}}`;
  if (darkVars.length > 0) {
    css += `@media (prefers-color-scheme: dark){.${scope}{${darkVars.join(";")}}}`;
  }
  return css;
}
