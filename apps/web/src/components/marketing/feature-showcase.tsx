"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal } from "./reveal";

/* Steep-style scroll showcase: feature chapters on the left, a sticky phone
 * mockup on the right whose screen switches between scenes as each chapter
 * crosses the middle of the viewport. On small screens the phone renders
 * inline inside each chapter instead (no stickiness).
 *
 * The scenes are faithful, light-mode recreations of the real /app customer
 * screens: the card home, the Show-QR modal, the rewards list and the redeem
 * coupon. The wallet scene keeps its own animation but now opens from the
 * app's "Add to Apple Wallet" button before the pass slides in. All scene
 * motion is CSS (`rm-*` / `.scene` in globals.css). */

const CHAPTERS = [
  {
    id: "card",
    tag: "At launch",
    title: "Their card, always on their phone",
    body: "Customers open their card in the browser and see stamps, points and their own code. No app store, no download, nothing to lose.",
  },
  {
    id: "showqr",
    tag: "At launch",
    title: "One code at the counter",
    body: "They tap Show QR and your staff scan it. The code refreshes every 90 seconds, so a screenshot won't work twice.",
  },
  {
    id: "rewards",
    tag: "At launch",
    title: "Points add up to real rewards",
    body: "Every ringgit spent earns points. Customers spend them on rewards you pick, from a free coffee to a pastry.",
  },
  {
    id: "redeem",
    tag: "At launch",
    title: "Redeem in a couple of taps",
    body: "They confirm they're at your counter and get a single-use code. Points leave their balance only when your staff mark it done.",
  },
  {
    id: "wallet",
    tag: "Up next",
    title: "Straight into their wallet",
    body: "One tap adds the card to Apple Wallet or Google Wallet. It updates the moment a stamp lands and sits next to their boarding passes.",
  },
];

export function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // A narrow band around the viewport's vertical center decides the
    // active chapter, the standard scroll-narrative pattern.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of chapterRefs.current) {
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <div>
        {CHAPTERS.map((chapter, i) => (
          <div
            key={chapter.id}
            data-index={i}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className={`flex flex-col justify-center gap-3 py-12 transition-opacity duration-300 lg:min-h-[70vh] lg:py-0 ${
              active === i ? "opacity-100" : "lg:opacity-40"
            }`}
          >
            <span className="w-fit rounded-full border border-border bg-surface px-3 py-0.5 text-xs font-medium text-text-muted">
              {chapter.tag}
            </span>
            <h3 className="text-2xl font-medium leading-tight tracking-[-0.02em] text-text sm:text-3xl">
              {chapter.title}
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
              {chapter.body}
            </p>

            {/* Small screens: the scene lives inline in its chapter */}
            <Reveal className="mt-6 flex justify-center lg:hidden">
              <PhoneMock scene={i} />
            </Reveal>
          </div>
        ))}
      </div>

      {/* Large screens: one sticky phone, scenes swap on scroll */}
      <div className="hidden lg:block">
        <div className="sticky top-24 flex justify-center pb-16">
          <PhoneMock scene={active} />
        </div>
      </div>
    </div>
  );
}

function PhoneMock({ scene }: { scene: number }) {
  return (
    <div
      aria-hidden
      className="panel-ring relative h-[560px] w-[272px] overflow-hidden rounded-[44px] border-[6px] border-text bg-bg"
    >
      {/* dynamic island */}
      <div className="absolute left-1/2 top-3 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-text" />
      <div className="relative h-full w-full overflow-hidden bg-bg">
        <CardHomeScene active={scene === 0} />
        <ShowQrScene active={scene === 1} />
        <RewardsScene active={scene === 2} />
        <RedeemScene active={scene === 3} />
        <WalletScene active={scene === 4} />
      </div>
    </div>
  );
}

function SceneShell({
  active,
  center,
  children,
}: {
  active: boolean;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-active={active ? "true" : "false"}
      className={`scene absolute inset-0 flex flex-col gap-4 overflow-hidden px-5 ${
        center ? "justify-center py-6" : "pt-11 pb-6"
      }`}
    >
      {children}
    </div>
  );
}

/** The real app header: logo mark, store name, customer name, sign out. */
function AppHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">Corner Coffee</p>
          <p className="text-[10px] text-text-muted">Aisyah</p>
        </div>
      </div>
      <span className="text-[10px] font-medium text-text-muted">Sign out</span>
    </div>
  );
}

/** A 2×5 stamp grid; the next open slot pops as a fresh stamp lands. */
function StampRows({ filled, pop }: { filled: number; pop?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, i) => {
        if (pop && i === filled) {
          return (
            <span key={i} className="relative flex items-center justify-center">
              <span className="rm-ring absolute inset-0 rounded-full border-2 border-accent" />
              <span className="rm-pop aspect-square w-full rounded-full bg-accent" />
            </span>
          );
        }
        return (
          <span
            key={i}
            className={
              i < filled
                ? "aspect-square w-full rounded-full bg-accent"
                : "aspect-square w-full rounded-full border-2 border-dashed border-border"
            }
          />
        );
      })}
    </div>
  );
}

/** A low-fi QR block that reads as a scannable code. */
function QrBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-4 gap-1 rounded-xl border border-border bg-white p-2 ${className}`}>
      {[0, 1, 3, 4, 6, 7, 9, 10, 12, 15].map((n) => (
        <span key={n} className="aspect-square rounded-[2px] bg-text" />
      ))}
      {[2, 5, 8, 11, 13, 14].map((n) => (
        <span key={`e${n}`} className="aspect-square rounded-[2px] bg-surface-alt" />
      ))}
    </div>
  );
}

/** Scene 1 - the card home, front and centre. */
function CardHomeScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <AppHeader />
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold text-text">Coffee Card</p>
          <p className="font-mono text-[10px] text-text-muted tabular-nums">4/10</p>
        </div>
        <div className="mt-3">
          <StampRows filled={4} pop />
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="rm-fill h-full w-full rounded-full bg-leaf" />
        </div>
        <p className="mt-2.5 text-[10px] text-text-secondary">
          6 more stamps to a free coffee
        </p>
        <span className="mt-4 flex h-9 items-center justify-center rounded-xl bg-primary text-[11px] font-semibold text-on-primary">
          Show QR to collect stamps
        </span>
        <p className="mt-2.5 text-center text-[10px] text-text-muted">
          Points balance{" "}
          <span className="font-semibold text-text tabular-nums">120</span>
        </p>
      </div>
    </SceneShell>
  );
}

/** Scene 2 - the Show-QR modal over the dimmed card. */
function ShowQrScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      {/* the card, dimmed behind the modal */}
      <div className="pointer-events-none opacity-40">
        <AppHeader />
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <StampRows filled={4} />
        </div>
      </div>
      {/* scrim + modal */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-5">
        <div className="w-full rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-[11px] font-semibold text-text">
            Show this at the counter
          </p>
          <QrBlock className="mx-auto mt-3 size-32" />
          <p className="mt-2.5 text-[9px] text-text-muted">
            Refreshes automatically. Screenshots won&apos;t work.
          </p>
          <span className="mt-3 flex h-8 items-center justify-center rounded-xl border border-border text-[10px] font-medium text-text">
            Done
          </span>
        </div>
      </div>
    </SceneShell>
  );
}

/** Scene 3 - the rewards list ("Treat yourself"). */
function RewardsScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <AppHeader />
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold text-text">Treat yourself</p>
        <p className="mt-1 text-[10px] text-text-muted">
          Spend your points on something nice.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-alt text-sm">
              🎁
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-text">
                Free coffee
              </span>
              <span className="block text-[9px] text-success">Ready to redeem</span>
            </span>
            <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[9px] font-semibold text-text tabular-nums">
              100 pts
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-alt text-sm">
              🥐
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-text">
                Pastry of the day
              </span>
              <span className="block text-[9px] text-text-muted">20 pts to go</span>
            </span>
            <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[9px] font-semibold text-text tabular-nums">
              140 pts
            </span>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/** Scene 4 - the redeem coupon, single-use and short-lived. */
function RedeemScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active} center>
      <div className="rounded-2xl border border-border bg-surface p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-text">Free coffee</p>
        <p className="mt-0.5 font-mono text-[10px] text-text-muted tabular-nums">
          100 points
        </p>
        <p className="mt-3 text-[10px] text-text-secondary">
          Show this to the staff. It works once.
        </p>
        <QrBlock className="mx-auto mt-4 size-36" />
        <p className="mt-3 rounded-lg bg-surface-alt py-1.5 font-mono text-[11px] font-medium tracking-widest text-text">
          KMB-7Q4X-2P9C
        </p>
        <p className="mt-2 text-[9px] text-text-muted">Expires in 14:32</p>
      </div>
    </SceneShell>
  );
}

/** Scene 5 - from the app's Add to Wallet tap into the pass sliding in. */
function WalletScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active} center>
      {/* the app's add-to-wallet moment */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <span className="size-2 rounded-full bg-accent" />
          </span>
          <p className="text-[11px] font-semibold text-text">Coffee Card</p>
        </div>
        <span className="mt-3 flex h-8 items-center justify-center rounded-lg bg-text text-[10px] font-medium text-bg">
            Add to Apple Wallet
        </span>
      </div>

      <p className="text-center text-[10px] text-text-muted">Added to Wallet</p>

      {/* the wallet stack, branded pass sliding into its slot */}
      <div className="flex flex-col gap-2">
        <div className="h-8 rounded-t-xl border border-border bg-surface-alt" />
        <div className="-mt-4 h-8 rounded-t-xl border border-border bg-surface" />
        <div className="rm-wallet -mt-3 rounded-xl bg-primary p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-on-primary">
              Corner Coffee
            </span>
            <span className="size-2.5 rounded-full bg-accent" />
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={
                  i < 4
                    ? "size-2.5 rounded-full bg-accent"
                    : "size-2.5 rounded-full border border-on-primary/40"
                }
              />
            ))}
          </div>
          <p className="mt-2.5 text-[9px] text-on-primary/70">
            Updates the moment a stamp lands
          </p>
        </div>
      </div>
    </SceneShell>
  );
}
