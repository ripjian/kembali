"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { createTenant, updateTenant } from "@/lib/admin-actions";
import type { TenantModules } from "@/lib/modules";
import { PLAN_LABELS, PLAN_TYPES } from "@/lib/plans";

/* Client pieces for the merchants directory: create/edit modals (native
 * <dialog>) and the Manage Merchant confirmation. Forms submit to server
 * actions; the logo input converts a validated square image to a data URL
 * in a hidden field. */

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";

function Modal({
  title,
  buttonLabel,
  buttonClass,
  children,
}: {
  title: string;
  buttonLabel: string;
  buttonClass: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={buttonClass} onClick={() => ref.current?.showModal()}>
        {buttonLabel}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,540px)] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-text-muted hover:bg-surface-alt hover:text-text"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </dialog>
    </>
  );
}

const MAX_LOGO_BYTES = 512 * 1024;

function LogoInput({ initialUrl }: { initialUrl?: string | null }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("That file is over 512 KB. Export a smaller version.");
      return;
    }
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width === img.height);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!ok) {
      setError("The logo must be square (same width and height).");
      return;
    }
    setDataUrl(url);
  }

  const preview = dataUrl || initialUrl || null;
  return (
    <div>
      <label className="text-xs font-medium text-text" htmlFor="logo-file">
        Brand logo
      </label>
      <p className="mt-0.5 text-xs italic text-text-muted">
        Square image · PNG, JPG or WebP · up to 512 KB
      </p>
      <div className="mt-2 flex items-center gap-3">
        {preview && (
          <img
            src={preview}
            alt="Logo preview"
            className="size-12 rounded-lg border border-border object-cover"
          />
        )}
        <input
          id="logo-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="text-xs text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-text"
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      <input type="hidden" name="logoDataUrl" value={dataUrl} />
    </div>
  );
}

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
  const m = defaults?.modules ?? { stamps: true, scan: true, reports: true };
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
      <LogoInput initialUrl={defaults?.logoUrl} />
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
