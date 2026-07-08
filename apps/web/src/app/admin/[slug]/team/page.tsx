import { redirect } from "next/navigation";

import { PERMISSION_KEYS, PERMISSION_LABELS } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { asc } from "drizzle-orm";

import {
  resetStaffPassword,
  saveRolePermissions,
  setStaffRole,
} from "@/lib/admin-actions";
import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

const ROLES = ["owner", "manager", "cashier"] as const;

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reset?: string; permissions?: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const isPlatform = ctx.admin.kind === "platform";
  if (!ctx.can("manageTeam") && !isPlatform) redirect(ctx.base);
  const { reset, permissions: permsSaved } = await searchParams;

  const db = await getDb();
  const staff = await withTenant(db, ctx.tenant.id, (tx) =>
    tx.select().from(schema.staffUsers).orderBy(asc(schema.staffUsers.createdAt)),
  );
  const platformAdmins = isPlatform
    ? await db
        .select()
        .from(schema.platformAdmins)
        .orderBy(asc(schema.platformAdmins.createdAt))
    : [];

  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Team</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Who can sign in for this store, and what each role may do.
        </p>
      </header>

      {reset && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Password updated. Share it with the staff member securely.
        </p>
      )}
      {permsSaved && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Role permissions saved. They apply the next time each page loads.
        </p>
      )}

      {isPlatform && (
        <section className="rounded-xl border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
            Kembali platform admins
          </h2>
          <ul>
            {platformAdmins.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text">{admin.name}</p>
                  <p className="truncate text-xs text-text-muted">{admin.email}</p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary">
                  System admin
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">Store staff</h2>
        {staff.map((member) => (
          <div key={member.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{member.name}</p>
                <p className="truncate text-xs text-text-muted">{member.email}</p>
              </div>
              <form action={setStaffRole} className="flex items-center gap-2">
                <input type="hidden" name="tenantId" value={ctx.tenant.id} />
                <input type="hidden" name="staffId" value={member.id} />
                <select
                  name="role"
                  defaultValue={member.role}
                  aria-label={`Role for ${member.name}`}
                  className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-text"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                </select>
                <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-surface-alt">
                  Save role
                </button>
              </form>
            </div>

            {isPlatform && (
              <form
                action={resetStaffPassword}
                className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
              >
                <input type="hidden" name="staffId" value={member.id} />
                <input type="hidden" name="slug" value={ctx.tenant.slug} />
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  placeholder="New password (8+ chars)"
                  aria-label={`New password for ${member.name}`}
                  className="h-9 w-52 rounded-lg border border-border bg-surface px-3 text-xs text-text outline-none focus:border-primary"
                />
                <button className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-surface-alt">
                  Reset password
                </button>
              </form>
            )}
          </div>
        ))}
      </section>

      {/* Role permission matrix */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text">What each role can do</h2>
        <p className="mt-1 text-xs text-text-muted">
          Applies to everyone with that role in this store. Owners always keep
          team management.
        </p>
        <form action={saveRolePermissions} className="mt-4">
          <input type="hidden" name="tenantId" value={ctx.tenant.id} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="py-2 pr-4 font-medium">Permission</th>
                  {ROLES.map((role) => (
                    <th key={role} className="px-3 py-2 font-medium capitalize">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_KEYS.map((key) => (
                  <tr key={key} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {PERMISSION_LABELS[key]}
                    </td>
                    {ROLES.map((role) => (
                      <td key={role} className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          name={`perm.${role}.${key}`}
                          defaultChecked={ctx.tenant.permissions[role][key]}
                          disabled={role === "owner" && key === "manageTeam"}
                          aria-label={`${role}: ${PERMISSION_LABELS[key]}`}
                          className="size-4 accent-[var(--primary)]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover">
            Save permissions
          </button>
        </form>
      </section>

      <p className="text-xs text-text-muted">
        Staff invitations with self-set passwords arrive with the full
        onboarding flow. For now{" "}
        {isPlatform ? "you set passwords here" : "ask Kembali support to add staff or reset passwords"}
        .
      </p>
    </main>
  );
}
