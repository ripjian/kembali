import { redirect } from "next/navigation";

import { PERMISSION_KEYS, PERMISSION_LABELS } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { asc, eq, sql } from "drizzle-orm";

import { saveRolePermissions } from "@/lib/admin-actions";
import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

import { AddTeamMemberButton, EditTeamMemberButton } from "./team-modal";

const ROLES = ["owner", "manager", "cashier"] as const;

const NOTICES: Record<string, string> = {
  added: "Team member added. Share their password with them securely.",
  saved: "Team member updated.",
  deleted: "Team member removed.",
  permissions: "Role permissions saved. They apply the next time each page loads.",
};

const ERRORS: Record<string, string> = {
  invalid: "Check the name, email and an 8+ character password, then try again.",
  exists: "Someone on your team already uses that email.",
  self: "You can't remove your own account.",
  lastowner: "This is the only owner. Add another owner first.",
  hasactivity:
    "This person already has activity on record, so their account can't be removed. Change their role to limit access instead.",
};

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const isPlatform = ctx.admin.kind === "platform";
  if (!ctx.can("manageTeam") && !isPlatform) redirect(ctx.base);
  const sp = await searchParams;
  const notice = sp.saved
    ? NOTICES.saved
    : sp.added
      ? NOTICES.added
      : sp.deleted
        ? NOTICES.deleted
        : sp.permissions
          ? NOTICES.permissions
          : null;
  const error = sp.error ? ERRORS[sp.error] : null;

  const db = await getDb();
  const { staff, ownerCount } = await withTenant(db, ctx.tenant.id, async (tx) => {
    const rows = await tx
      .select()
      .from(schema.staffUsers)
      .orderBy(asc(schema.staffUsers.createdAt));
    const [owners] = await tx
      .select({ n: sql`count(*)::int`.mapWith(Number) })
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.role, "owner"));
    return { staff: rows, ownerCount: owners?.n ?? 0 };
  });
  const selfId = ctx.admin.kind === "staff" ? ctx.admin.subjectId : null;
  const platformAdmins = isPlatform
    ? await db
        .select()
        .from(schema.platformAdmins)
        .orderBy(asc(schema.platformAdmins.createdAt))
    : [];

  return (
    <main className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Team</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Who can sign in for this store, and what each role may do.
          </p>
        </div>
        <AddTeamMemberButton tenantId={ctx.tenant.id} />
      </header>

      {notice && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error}
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
        {staff.map((member) => {
          // The last owner can't be removed, and you can't remove yourself.
          const canDelete =
            member.id !== selfId && !(member.role === "owner" && ownerCount <= 1);
          return (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-text">{member.name}</p>
                <p className="truncate text-xs text-text-muted">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium capitalize text-text-secondary">
                  {member.role}
                </span>
                <EditTeamMemberButton
                  tenantId={ctx.tenant.id}
                  member={{
                    id: member.id,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                  }}
                  canDelete={canDelete}
                />
              </div>
            </div>
          );
        })}
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
        You set each member&apos;s password when you add them. Self-serve
        invitations with email verification arrive with the full onboarding
        flow.
      </p>
    </main>
  );
}
