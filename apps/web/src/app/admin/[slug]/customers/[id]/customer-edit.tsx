"use client";

import { useState } from "react";

import { updateCustomer } from "@/lib/admin-actions";

/* Edit-in-place for customer details. Rendered only when the session has
 * the editCustomers permission (owner+ by default); the server action
 * re-checks it regardless. */

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";

export function CustomerEdit({
  tenantId,
  customer,
}: {
  tenantId: string;
  customer: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    birthday: string | null;
    optInWhatsapp: boolean;
    optInEmail: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-alt"
      >
        Edit details
      </button>
    );
  }

  return (
    <form
      action={updateCustomer}
      className="mt-2 flex w-full flex-col gap-3 rounded-xl border border-border bg-surface-alt p-4"
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-text">
          Full name
          <input name="name" required defaultValue={customer.name ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Phone
          <input name="phone" type="tel" required defaultValue={customer.phone ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Email
          <input name="email" type="email" defaultValue={customer.email ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Birthday
          <input name="birthday" type="date" defaultValue={customer.birthday ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            name="optInWhatsapp"
            defaultChecked={customer.optInWhatsapp}
            className="size-4 accent-[var(--primary)]"
          />
          WhatsApp opt-in
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            name="optInEmail"
            defaultChecked={customer.optInEmail}
            className="size-4 accent-[var(--primary)]"
          />
          Email opt-in
        </label>
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
