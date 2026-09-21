"use client";

import { inputClass, Modal } from "@/components/admin/form-bits";
import { createOutlet, updateOutlet } from "@/lib/admin-actions";

/* Add / edit outlet modals for the merchant's own Settings page. Address
 * fields mirror what the platform admin captures at creation. */

export interface OutletRow {
  id: string;
  name: string;
  addressLine: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  active: boolean;
}

function Fields({ outlet }: { outlet?: OutletRow }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-text">
        Outlet name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={outlet?.name ?? ""}
          placeholder="SS15 branch"
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="text-xs font-medium text-text">
        Address line
        <input name="addressLine" maxLength={160} defaultValue={outlet?.addressLine ?? ""} className={`mt-1 ${inputClass}`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-text">
          Postcode
          <input name="postcode" maxLength={10} defaultValue={outlet?.postcode ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          City
          <input name="city" maxLength={80} defaultValue={outlet?.city ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          State
          <input name="state" maxLength={80} defaultValue={outlet?.state ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Country
          <input name="country" maxLength={80} defaultValue={outlet?.country ?? "Malaysia"} className={`mt-1 ${inputClass}`} />
        </label>
      </div>
    </div>
  );
}

export function AddOutletButton({
  tenantId,
  priceNote,
}: {
  tenantId: string;
  priceNote: string;
}) {
  return (
    <Modal
      title="Add an outlet"
      buttonLabel="Add outlet"
      buttonClass="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
    >
      <form action={createOutlet} className="flex flex-col gap-4">
        <input type="hidden" name="tenantId" value={tenantId} />
        <p className="rounded-lg bg-surface-alt px-3 py-2 text-xs text-text-secondary" data-price-note>
          {priceNote}
        </p>
        <Fields />
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Add outlet
        </button>
      </form>
    </Modal>
  );
}

export function EditOutletButton({
  tenantId,
  outlet,
}: {
  tenantId: string;
  outlet: OutletRow;
}) {
  return (
    <Modal
      title={`Edit ${outlet.name}`}
      buttonLabel="Edit"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
    >
      <form action={updateOutlet} className="flex flex-col gap-4">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="outletId" value={outlet.id} />
        <Fields outlet={outlet} />
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
      </form>
    </Modal>
  );
}
