import { schema, withTenant } from "@kembali/db";
import { asc } from "drizzle-orm";

import { resetStaffPassword, setStaffRole } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const admin = (await getAdminContext())!;
  const { reset, error } = await searchParams;
  const canEditRoles = admin.kind === "platform" || admin.role === "owner";
  const canResetPasswords = admin.kind === "platform";

  const db = await getDb();
  const staff = await withTenant(db, admin.tenantId, (tx) =>
    tx.select().from(schema.staffUsers).orderBy(asc(schema.staffUsers.createdAt)),
  );

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Team</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Who can sign in for this store, and what they can do.
        </p>
      </header>

      {reset && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Password updated. Share it with the staff member securely.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          Passwords need at least 8 characters.
        </p>
      )}

      <section className="flex flex-col gap-3">
        {staff.map((member) => (
          <div key={member.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{member.name}</p>
                <p className="truncate text-xs text-text-muted">{member.email}</p>
              </div>
              {canEditRoles ? (
                <form action={setStaffRole} className="flex items-center gap-2">
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
              ) : (
                <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-text-secondary">
                  {member.role}
                </span>
              )}
            </div>

            {canResetPasswords && (
              <form action={resetStaffPassword} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <input type="hidden" name="staffId" value={member.id} />
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

      <p className="text-xs text-text-muted">
        Staff invitations with self-set passwords arrive with the full
        onboarding flow. For now{" "}
        {canResetPasswords
          ? "you set passwords here"
          : "ask Kembali support to add staff or reset passwords"}
        .
      </p>
    </main>
  );
}
