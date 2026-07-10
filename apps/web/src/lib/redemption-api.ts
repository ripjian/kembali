import "server-only";

import { resolveRolePermissions } from "@kembali/core";
import { schema } from "@kembali/db";
import type { AdminContext } from "./auth";

/* Shared authorization for the cashier redemption endpoints: the request
 * names the tenant (the scan page knows its store); staff must belong to
 * it AND hold the redeemRewards permission - checked server-side, nav
 * hiding is cosmetic (SECURITY.md checklist). */

export async function authorizeRedeem(
  admin: AdminContext,
  tenantId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural tx type lives in @kembali/db; only select() is needed here
  tx: any,
): Promise<string | null> {
  if (admin.kind === "staff") {
    if (admin.tenantId !== tenantId) {
      return "That coupon belongs to a different store.";
    }
    const [tenantRow] = await tx
      .select({ rolePermissions: schema.tenants.rolePermissions })
      .from(schema.tenants);
    const matrix = resolveRolePermissions(tenantRow?.rolePermissions);
    const role = admin.role as "owner" | "manager" | "cashier";
    if (!matrix[role].redeemRewards) {
      return "Your role can't redeem rewards. Ask the owner.";
    }
  }
  return null;
}
