"use client";

import { ImageDataUrlInput, inputClass, Modal } from "@/components/admin/form-bits";
import { saveRewardItem } from "@/lib/admin-actions";

/* Create/edit modals for the rewards catalog. Same validated square-image
 * pattern as merchant logos; points cost is a positive integer. */

function RewardFields({
  defaults,
}: {
  defaults?: {
    title: string;
    description: string | null;
    pointsCost: number;
    active: boolean;
    imageUrl: string | null;
  };
}) {
  return (
    <>
      <label className="text-xs font-medium text-text">
        Reward
        <input
          name="title"
          required
          minLength={2}
          defaultValue={defaults?.title ?? ""}
          placeholder="Free coffee of your choice"
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <label className="text-xs font-medium text-text">
        Description
        <textarea
          name="description"
          rows={2}
          maxLength={400}
          defaultValue={defaults?.description ?? ""}
          placeholder="What the customer gets at the counter"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
      </label>
      <label className="text-xs font-medium text-text">
        Points cost
        <input
          name="pointsCost"
          type="number"
          min={1}
          max={1_000_000}
          required
          defaultValue={defaults?.pointsCost ?? 100}
          className={`mt-1 ${inputClass}`}
        />
      </label>
      <ImageDataUrlInput
        label="Reward photo"
        fieldName="imageDataUrl"
        initialUrl={defaults?.imageUrl}
      />
      <label className="inline-flex items-center gap-2 text-xs font-medium text-text">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults?.active ?? true}
          className="size-4 accent-[var(--primary)]"
        />
        Customers can redeem this reward
      </label>
    </>
  );
}

export function CreateRewardButton({ tenantId }: { tenantId: string }) {
  return (
    <Modal
      title="Add a reward"
      buttonLabel="Add reward"
      buttonClass="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
    >
      <form action={saveRewardItem} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <RewardFields />
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Add reward
        </button>
      </form>
    </Modal>
  );
}

export function EditRewardButton({
  tenantId,
  reward,
}: {
  tenantId: string;
  reward: {
    id: string;
    title: string;
    description: string | null;
    pointsCost: number;
    active: boolean;
    imageUrl: string | null;
  };
}) {
  return (
    <Modal
      title={`Edit ${reward.title}`}
      buttonLabel="Edit"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
    >
      <form action={saveRewardItem} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="rewardItemId" value={reward.id} />
        <RewardFields defaults={reward} />
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
      </form>
    </Modal>
  );
}
