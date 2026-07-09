"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { ImageDataUrlInput, inputClass, Modal } from "@/components/admin/form-bits";
import { createTenant, updateTenant } from "@/lib/admin-actions";
import type { TenantModules } from "@/lib/modules";
import { PLAN_LABELS, PLAN_TYPES } from "@/lib/plans";

/* Client pieces for the merchants directory: create/edit modals (native
 * <dialog>) and the Manage Merchant confirmation. Forms submit to server
 * actions; the logo input converts a validated square image to a data URL
 * in a hidden field. */

function ProfileFields({
  defaults,
}: {
  defaults?: {
    name: string;
    plan: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string;
    logoUrl: string | null;
    modules: TenantModules;
  };
}) {
  const m = defaults?.modules ?? {
    stamps: true,
    scan: true,
    reports: true,
    points: true,
    rewards: true,
  };
  return (
    <>
      <label className="text-xs font-medium text-text">
        Store name
        <input name="name" required minLength={2} defaultValue={defaults?.name ?? ""} className={`mt-1 ${inputClass}`} />
      </label>
      <label className="text-xs font-medium text-text">
        Plan
        <select name="plan" defaultValue={defaults?.plan ?? "trial"} className={`mt-1 ${inputClass}`}>
          {PLAN_TYPES.map((p) => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <ImageDataUrlInput
        label="Brand logo"
        fieldName="logoDataUrl"
        initialUrl={defaults?.logoUrl}
      />
      <label className="text-xs font-medium text-text">
        Address
        <input name="addressLine" defaultValue={defaults?.addressLine ?? ""} placeholder="12 Jalan SS15/4" className={`mt-1 ${inputClass}`} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs font-medium text-text">
          City
          <input name="city" defaultValue={defaults?.city ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          State
          <input name="state" defaultValue={defaults?.state ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Country
          <input name="country" defaultValue={defaults?.country ?? "Malaysia"} className={`mt-1 ${inputClass}`} />
        </label>
      </div>
      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-xs font-medium text-text">Modules</legend>
        {(
          [
            ["mod_stamps", "Stamp cards", m.stamps],
            ["mod_scan", "Scan & stamp", m.scan],
            ["mod_reports", "Reports", m.reports],
            ["mod_points", "Points", m.points],
            ["mod_rewards", "Rewards", m.rewards],
          ] as const
        ).map(([name, label, checked]) => (
          <label key={name} className="mr-4 inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-[var(--primary)]" />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
}

export function CreateMerchantButton() {
  return (
    <Modal
      title="Add a merchant"
      buttonLabel="Create merchant"
      buttonClass="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
    >
      <form action={createTenant} className="flex flex-col gap-3">
        <ProfileFields />
        <hr className="border-border" />
        <p className="text-xs font-semibold text-text">First outlet & program</p>
        <label className="text-xs font-medium text-text">
          Outlet name
          <input name="outletName" required minLength={2} placeholder="SS15 branch" className={`mt-1 ${inputClass}`} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-text">
            Stamps for a reward
            <input name="stampsRequired" type="number" min={2} max={30} defaultValue={10} required className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-xs font-medium text-text">
            Reward
            <input name="rewardTitle" required minLength={2} placeholder="Free drink" className={`mt-1 ${inputClass}`} />
          </label>
        </div>
        <hr className="border-border" />
        <p className="text-xs font-semibold text-text">Owner&apos;s login</p>
        <label className="text-xs font-medium text-text">
          Owner&apos;s name
          <input name="ownerName" required minLength={2} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Owner&apos;s email
          <input name="ownerEmail" type="email" required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Owner&apos;s password
          <input name="ownerPassword" type="password" required minLength={8} placeholder="8+ characters" className={`mt-1 ${inputClass}`} />
        </label>
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Create merchant
        </button>
      </form>
    </Modal>
  );
}

export function EditMerchantButton({
  tenant,
}: {
  tenant: {
    id: string;
    name: string;
    plan: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string;
    logoUrl: string | null;
    modules: TenantModules;
  };
}) {
  return (
    <Modal
      title={`Edit ${tenant.name}`}
      buttonLabel="Edit"
      buttonClass="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
    >
      <form action={updateTenant} className="flex flex-col gap-3">
        <input type="hidden" name="tenantId" value={tenant.id} />
        <ProfileFields defaults={tenant} />
        <button className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Save changes
        </button>
      </form>
    </Modal>
  );
}

export function ManageMerchantButton({ name, slug }: { name: string; slug: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
      >
        Manage Merchant
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,400px)] rounded-2xl border border-border bg-surface p-5 text-text backdrop:bg-black/40"
      >
        <h2 className="text-sm font-semibold text-text">Open {name}&apos;s panel?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You&apos;ll see their admin view at /admin/{slug} — exactly what
          their team sees, with your system-admin powers.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/admin/${slug}`)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover"
          >
            Yes, open their panel
          </button>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-alt"
          >
            Cancel
          </button>
        </div>
      </dialog>
    </>
  );
}
