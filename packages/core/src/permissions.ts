import { z } from "zod";

/* Role permissions v1. What each staff role may do inside the merchant
 * panel. Tenants can override per role (tenants.role_permissions); anything
 * unset falls back to these defaults. Platform admins bypass everything. */

export const PERMISSION_KEYS = [
  "scan",
  "viewReports",
  "manageCustomers",
  "editCustomers",
  "adjustPoints",
  "manageRewards",
  "redeemRewards",
  "manageTeam",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type StaffRoleKey = "owner" | "manager" | "cashier";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  scan: "Scan & stamp cards",
  viewReports: "View reports",
  manageCustomers: "View & create customers",
  editCustomers: "Edit customer details",
  adjustPoints: "Adjust points balances",
  manageRewards: "Manage the rewards catalog",
  redeemRewards: "Redeem rewards",
  manageTeam: "Manage team & roles",
};

export type RolePermissionMatrix = Record<
  StaffRoleKey,
  Record<PermissionKey, boolean>
>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  owner: {
    scan: true,
    viewReports: true,
    manageCustomers: true,
    editCustomers: true,
    adjustPoints: true,
    manageRewards: true,
    redeemRewards: true,
    manageTeam: true,
  },
  manager: {
    scan: true,
    viewReports: true,
    manageCustomers: true,
    editCustomers: false,
    adjustPoints: false,
    manageRewards: true,
    redeemRewards: true,
    manageTeam: false,
  },
  cashier: {
    scan: true,
    viewReports: false,
    manageCustomers: false,
    editCustomers: false,
    adjustPoints: false,
    manageRewards: false,
    redeemRewards: true,
    manageTeam: false,
  },
};

const overridesSchema = z
  .partialRecord(
    z.enum(["owner", "manager", "cashier"]),
    z.partialRecord(z.enum(PERMISSION_KEYS), z.boolean()),
  )
  .catch({});

/** Merge a tenant's stored overrides over the defaults. */
export function resolveRolePermissions(overrides: unknown): RolePermissionMatrix {
  const parsed = overridesSchema.parse(overrides ?? {});
  const matrix = structuredClone(DEFAULT_ROLE_PERMISSIONS);
  for (const role of Object.keys(matrix) as StaffRoleKey[]) {
    Object.assign(matrix[role], parsed[role] ?? {});
  }
  return matrix;
}
