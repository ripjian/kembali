"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Shared admin form pieces: native-<dialog> modal and the validated
 * square-image → data-URL input (used for merchant logos and reward
 * photos — PNG/JPG/WebP, square, ≤512 KB, re-checked server-side).
 * Entry animation is transform/opacity, <300ms, reduced-motion-aware
 * (the `.admin-modal` rule in globals.css) per emil-design-eng. */

export const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";

export function Modal({
  title,
  buttonLabel,
  buttonClass,
  defaultOpen = false,
  children,
}: {
  title: string;
  buttonLabel: string;
  buttonClass: string;
  /** Open on mount — used for the ?edit=1 deep-link from the row menu. */
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
  }, [defaultOpen]);

  return (
    <>
      <button type="button" className={buttonClass} onClick={() => ref.current?.showModal()}>
        {buttonLabel}
      </button>
      <dialog
        ref={ref}
        className="admin-modal m-auto w-[min(92vw,540px)] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/40"
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

const MAX_IMAGE_BYTES = 512 * 1024;

export function ImageDataUrlInput({
  label,
  fieldName,
  initialUrl,
}: {
  label: string;
  fieldName: string;
  initialUrl?: string | null;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const inputId = `${fieldName}-file`;

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
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
      setError("The image must be square (same width and height).");
      return;
    }
    setDataUrl(url);
  }

  const preview = dataUrl || initialUrl || null;
  return (
    <div>
      <label className="text-xs font-medium text-text" htmlFor={inputId}>
        {label}
      </label>
      <p className="mt-0.5 text-xs italic text-text-muted">
        Square image · PNG, JPG or WebP · up to 512 KB
      </p>
      <div className="mt-2 flex items-center gap-3">
        {preview && (
          <img
            src={preview}
            alt={`${label} preview`}
            className="size-12 rounded-lg border border-border object-cover"
          />
        )}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="text-xs text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-text"
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      <input type="hidden" name={fieldName} value={dataUrl} />
    </div>
  );
}
