"use client";

import { useRef } from "react";

import { reserveRedemption } from "../../actions";

/* The friendly in-store gate: the coupon is single-use and short-lived, so
 * we check the customer is actually at the counter before showing it. */

export function RedeemConfirm({
  rewardItemId,
  title,
  pointsCost,
  affordable,
  balance,
}: {
  rewardItemId: string;
  title: string;
  pointsCost: number;
  affordable: boolean;
  balance: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  if (!affordable) {
    return (
      <div className="rounded-xl bg-surface-alt p-4 text-center">
        <p className="text-sm font-medium text-text">
          {pointsCost - balance} more points to go
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Keep visiting — every ringgit counts.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Redeem for {pointsCost} points
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,380px)] rounded-2xl border border-border bg-surface p-5 text-text backdrop:bg-black/50"
      >
        <h2 className="text-sm font-semibold text-text">
          Are you at the store right now?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your coupon for {title.toLowerCase()}{" "}
          lasts 15 minutes and works once. Redeem it when you&apos;re ready
          to order.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <form action={reserveRedemption}>
            <input type="hidden" name="rewardItemId" value={rewardItemId} />
            <button className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
              Yes — show my coupon
            </button>
          </form>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-text hover:bg-surface-alt"
          >
            Not yet
          </button>
        </div>
      </dialog>
    </>
  );
}
