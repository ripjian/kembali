"use client";

import { useState } from "react";

import { inputClass, Modal } from "@/components/admin/form-bits";
import { createStaff, deleteStaff, updateStaff } from "@/lib/admin-actions";

/* One modal for adding a team member and editing an existing one. Staff
 * sign in with their email (there's no separate username). Passwords are
 * scrypt-hashed server-side and never shown back - edit mode offers "set a
 * new password", not the old one. Edit mode also allows removal, with a
 * confirm step; self and last-owner deletes are blocked server-side. */

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
] as const;

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function Fields({ member }: { member?: Member }) {
  return (
    <>
      <label className="text-xs font-medium text-text">
        Full name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={member?.name ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="text-xs font-medium text-text">
        Email (used to sign in)
        <input
          name="email"
          type="email"
          required
          defaultValue={member?.email ?? ""}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="text-xs font-medium text-text">
        {member ? "Set a new password (leave blank to keep)" : "Password"}
        <input
          name="password"
          type="password"
          minLength={8}
          required={!member}
          placeholder="8+ characters"
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="text-xs font-medium text-text">
        Role
        <select name="role" defaultValue={member?.role ?? "cashier"} className={`mt-1 ${inputClass}`}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function AddTeamMemberButton({ tenantId }: { tenantId: string }) {
  return (
    <Modal
      title="Add team member"
      buttonLabel="Add team member"
      buttonClass="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
    >
      <form action={createStaff} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <Fields />
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Add member
        </button>
      </form>
    </Modal>
  );
}

export function EditTeamMemberButton({
  tenantId,
  member,
  canDelete,
}: {
  tenantId: string;
  member: Member;
  /** false for yourself - the server blocks it too. */
  canDelete: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Modal
      title={`Edit ${member.name}`}
      buttonLabel="Edit"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
    >
      <form action={updateStaff} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="staffId" value={member.id} />
        <Fields member={member} />
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
      </form>

      {canDelete && (
        <div className="mt-4 border-t border-border pt-4">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs font-medium text-error hover:underline"
            >
              Remove from team
            </button>
          ) : (
            <div className="rounded-lg border border-error/40 bg-surface p-3">
              <p className="text-xs text-text-secondary">
                Remove {member.name}? They&apos;ll lose access right away. This
                can&apos;t be undone.
              </p>
              <div className="mt-2 flex gap-2">
                <form action={deleteStaff}>
                  <input type="hidden" name="tenantId" value={tenantId} />
                  <input type="hidden" name="staffId" value={member.id} />
                  <button className="rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    Yes, remove
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
                >
                  Keep them
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
