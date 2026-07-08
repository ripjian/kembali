import { describe, expect, it } from "vitest";

import { DEFAULT_ROLE_PERMISSIONS, resolveRolePermissions } from "./permissions";

describe("role permissions", () => {
  it("falls back to defaults for empty or garbage overrides", () => {
    expect(resolveRolePermissions({})).toEqual(DEFAULT_ROLE_PERMISSIONS);
    expect(resolveRolePermissions(null)).toEqual(DEFAULT_ROLE_PERMISSIONS);
    expect(resolveRolePermissions("nonsense")).toEqual(DEFAULT_ROLE_PERMISSIONS);
  });

  it("applies partial overrides without touching other roles", () => {
    const matrix = resolveRolePermissions({ cashier: { viewReports: true } });
    expect(matrix.cashier.viewReports).toBe(true);
    expect(matrix.cashier.manageCustomers).toBe(false);
    expect(matrix.owner).toEqual(DEFAULT_ROLE_PERMISSIONS.owner);
  });

  it("keeps defaults immutable across calls", () => {
    resolveRolePermissions({ owner: { manageTeam: false } });
    expect(DEFAULT_ROLE_PERMISSIONS.owner.manageTeam).toBe(true);
  });
});
