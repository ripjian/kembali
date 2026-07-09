"use client";

import { inputClass, Modal } from "@/components/admin/form-bits";
import { adjustCustomerPoints } from "@/lib/admin-actions";

/* Add/deduct points with a required reason. Every adjustment is a ledger
 * event the customer sees in their own history — say why in plain words. */

export function AdjustPointsButton({
  tenantId,
  customerId,
  balance,
}: {
  tenantId: string;
  customerId: string;
  balance: number;
}) {
  return (
    <Modal
      title="Adjust points"
      buttonLabel="Adjust points"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
    >
      <form action={adjustCustomerPoints} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="customerId" value={customerId} />
        <p className="text-xs text-text-muted">
          Current balance:{" "}
          <span className="font-semibold tabular-nums text-text">{balance}</span>{" "}
          points. The customer sees this change in their history.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-text">
            Action
            <select name="direction" className={`mt-1 ${inputClass}`}>
              <option value="add">Add points</option>
              <option value="deduct">Deduct points</option>
            </select>
          </label>
          <label className="text-xs font-medium text-text">
            Points
            <input
              name="points"
              type="number"
              min={1}
              max={100000}
              required
              placeholder="50"
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
        <label className="text-xs font-medium text-text">
          Reason (shown to the customer)
          <input
            name="reason"
            required
            minLength={3}
            maxLength={200}
            placeholder="Birthday gift"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save adjustment
        </button>
      </form>
    </Modal>
  );
}
