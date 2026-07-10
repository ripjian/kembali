"use client";

import { useRef, useState } from "react";

import { QrPanel } from "./qr-panel";

/* "Show QR" modal: the rotating stamp code + paste fallback, opened only
 * when the customer is at the counter. The panel mounts on open so the
 * token loop isn't polling in the background. */

export function ShowQrButton() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-tenant-primary text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover"
      >
        Show QR to collect stamps
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,380px)] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-center text-sm font-semibold text-text">
            Show this at the counter
          </h2>
          <div className="mt-4">{open && <QrPanel />}</div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt"
          >
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
