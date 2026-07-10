"use client";

import { inputClass, Modal } from "@/components/admin/form-bits";
import { updateCustomer } from "@/lib/admin-actions";

/* Edit customer details in a modal — same pattern as Adjust points, so the
 * two actions on the profile feel consistent. Shown only with the
 * editCustomers permission; the server action re-checks it regardless.
 * `defaultOpen` supports the ?edit=1 deep-link from the customers list. */

export function CustomerEditButton({
  tenantId,
  defaultOpen = false,
  customer,
}: {
  tenantId: string;
  defaultOpen?: boolean;
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
  return (
    <Modal
      title="Edit details"
      buttonLabel="Edit details"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
      defaultOpen={defaultOpen}
    >
      <form action={updateCustomer} className="flex flex-col gap-3">
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
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
      </form>
    </Modal>
  );
}
