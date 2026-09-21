"use client";

import { useEffect, useRef, useState } from "react";

import { completeCustomerOnboarding } from "./actions";

/* Three-card welcome the first time a member opens their card. Dismissal
 * is stored on the customer, so it shows once per person, not per device.
 * Native <dialog>, themed in the store's colours, transform/opacity only. */

const SLIDES = (store: string, stamps: number, points: boolean) => [
  {
    icon: "📱",
    title: "Show your code at the counter",
    body: `Tap "Show QR" and let the staff at ${store} scan it. One visit, one stamp.`,
  },
  {
    icon: "⭐",
    title: `Collect ${stamps} stamps for a treat`,
    body: points
      ? "You also earn points on what you spend. Both build up on this card."
      : "Your stamps build up on this card. No app to download, nothing to carry.",
  },
  {
    icon: "🎁",
    title: "Redeem when you're ready",
    body: "Pick a reward, show the coupon, done. Your card is always at this link, so bookmark it.",
  },
];

export function WelcomeGuide({
  store,
  stamps,
  points,
}: {
  store: string;
  stamps: number;
  points: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const slides = SLIDES(store, stamps, points);
  const last = i === slides.length - 1;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const slide = slides[i]!;
  return (
    <dialog
      ref={ref}
      aria-labelledby="welcome-title"
      className="admin-modal m-auto w-[min(92vw,380px)] rounded-2xl border border-border bg-surface p-0 text-text backdrop:bg-black/50"
      data-welcome
    >
      <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-7 text-center">
        <span aria-hidden className="text-4xl">{slide.icon}</span>
        <h2 id="welcome-title" className="text-lg font-semibold text-text">
          {slide.title}
        </h2>
        <p className="text-sm text-text-secondary">{slide.body}</p>
        <div className="mt-2 flex items-center gap-1.5" aria-hidden>
          {slides.map((_, k) => (
            <span
              key={k}
              className={`size-1.5 rounded-full ${k === i ? "bg-tenant-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <form action={completeCustomerOnboarding}>
          <button className="text-xs font-medium text-text-muted hover:text-text">
            Skip
          </button>
        </form>
        {last ? (
          <form action={completeCustomerOnboarding}>
            <button className="inline-flex h-10 items-center justify-center rounded-xl bg-tenant-primary px-5 text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover">
              Got it
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setI(i + 1)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-tenant-primary px-5 text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover"
          >
            Next
          </button>
        )}
      </div>
    </dialog>
  );
}
