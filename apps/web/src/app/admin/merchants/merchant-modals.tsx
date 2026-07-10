"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ImageDataUrlInput, inputClass, Modal } from "@/components/admin/form-bits";
import { createTenant, updateTenant } from "@/lib/admin-actions";
import { modulesForPlan, type TenantModules } from "@/lib/modules";
import { PLAN_LABELS, PLAN_TYPES } from "@/lib/plans";

/* Create/edit merchant modals. Create is a sectioned form (General → Plan &
 * modules → Program → Outlets → Owner). Choosing a plan preselects its
 * module set; the boxes stay adjustable. Address lives on outlets now, so
 * the outlets section repeats a block per branch. */

const MODULE_FIELDS = [
  ["mod_stamps", "stamps", "Stamp cards"],
  ["mod_scan", "scan", "Scan & stamp"],
  ["mod_reports", "reports", "Reports"],
  ["mod_points", "points", "Points"],
  ["mod_rewards", "rewards", "Rewards"],
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  );
}

function GeneralSection({ defaults }: { defaults?: { name: string; logoUrl: string | null } }) {
  return (
    <>
      <SectionLabel>General</SectionLabel>
      <label className="text-xs font-medium text-text">
        Store name
        <input name="name" required minLength={2} defaultValue={defaults?.name ?? ""} className={`mt-1 ${inputClass}`} />
      </label>
      <ImageDataUrlInput label="Brand logo" fieldName="logoDataUrl" initialUrl={defaults?.logoUrl} />
    </>
  );
}

function PlanModulesSection({
  defaultPlan,
  defaultModules,
}: {
  defaultPlan?: string;
  defaultModules?: TenantModules;
}) {
  const [plan, setPlan] = useState(defaultPlan ?? "founding");
  const [mods, setMods] = useState<TenantModules>(
    defaultModules ?? modulesForPlan(defaultPlan ?? "founding"),
  );
  return (
    <>
      <SectionLabel>Plan &amp; modules</SectionLabel>
      <label className="text-xs font-medium text-text">
        Plan
        <select
          name="plan"
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setMods(modulesForPlan(e.target.value));
          }}
          className={`mt-1 ${inputClass}`}
        >
          {PLAN_TYPES.map((p) => (
            <option key={p} value={p}>
              {PLAN_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-xs font-medium text-text">Modules</legend>
        {MODULE_FIELDS.map(([name, key, label]) => (
          <label key={name} className="mr-4 inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <input
              type="checkbox"
              name={name}
              checked={mods[key]}
              onChange={(e) => setMods((m) => ({ ...m, [key]: e.target.checked }))}
              className="size-4 accent-[var(--primary)]"
            />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
}

function ProgramSection() {
  return (
    <>
      <SectionLabel>Program</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs font-medium text-text">
          Stamps for a reward
          <input name="stampsRequired" type="number" min={2} max={30} defaultValue={10} required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Points per RM1
          <input name="pointsPerRm" type="number" step="0.1" min={0} max={1000} defaultValue={1} required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs font-medium text-text">
          Reward
          <input name="rewardTitle" required minLength={2} placeholder="Free drink" className={`mt-1 ${inputClass}`} />
        </label>
      </div>
    </>
  );
}

function OutletBlock({ index, onRemove }: { index: number; onRemove?: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text">
          {index === 0 ? "Main outlet" : `Outlet ${index + 1}`}
        </p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-medium text-error hover:underline">
            Remove
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <input name="outletName" required={index === 0} placeholder="Outlet name (e.g. SS15 branch)" className={inputClass} />
        <input name="outletAddress" placeholder="Address line" className={inputClass} />
        <div className="grid grid-cols-4 gap-2">
          <input name="outletPostcode" placeholder="Postcode" className={inputClass} />
          <input name="outletCity" placeholder="City" className={`col-span-1 ${inputClass}`} />
          <input name="outletState" placeholder="State" className={inputClass} />
          <input name="outletCountry" defaultValue="Malaysia" placeholder="Country" className={inputClass} />
        </div>
      </div>
    </div>
  );
}

function OutletsSection() {
  const [ids, setIds] = useState<number[]>([0]);
  const nextId = useRef(1);
  return (
    <>
      <SectionLabel>Outlets</SectionLabel>
      {ids.map((id, i) => (
        <OutletBlock
          key={id}
          index={i}
          onRemove={i === 0 ? undefined : () => setIds((cur) => cur.filter((x) => x !== id))}
        />
      ))}
      <button
        type="button"
        onClick={() => setIds((cur) => [...cur, nextId.current++])}
        className="self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
      >
        + Add another outlet
      </button>
    </>
  );
}

function OwnerSection() {
  return (
    <>
      <SectionLabel>Owner&apos;s login</SectionLabel>
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
        <GeneralSection />
        <PlanModulesSection />
        <ProgramSection />
        <OutletsSection />
        <OwnerSection />
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
        <GeneralSection defaults={tenant} />
        <PlanModulesSection defaultPlan={tenant.plan} defaultModules={tenant.modules} />
        <p className="text-xs text-text-muted">
          Outlets and their addresses are managed per branch.
        </p>
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
        Manage merchant
      </button>
      <dialog
        ref={ref}
        className="admin-modal m-auto w-[min(92vw,400px)] rounded-2xl border border-border bg-surface p-5 text-text backdrop:bg-black/40"
      >
        <h2 className="text-sm font-semibold text-text">Open {name}&apos;s panel</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You&apos;ll see their admin view at /admin/{slug}. It matches what
          their team sees, with your system-admin powers.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/admin/${slug}`)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover"
          >
            Open their panel
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
