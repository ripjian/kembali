"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal } from "./reveal";

/* Steep-style scroll showcase: feature chapters on the left, a sticky
 * phone mockup on the right whose screen switches between low-fi scenes
 * as each chapter crosses the middle of the viewport. On small screens
 * the phone renders inline inside each chapter instead (no stickiness).
 * All scene motion is CSS (`rm-*` / `.scene` in globals.css). */

const CHAPTERS = [
  {
    id: "card",
    tag: "At launch",
    title: "A card on their phone",
    body: "Customers open their card right in the browser — stamps, rewards and their personal QR code. No app store, no download, nothing to forget.",
  },
  {
    id: "wallet",
    tag: "Up next",
    title: "Straight into their wallet",
    body: "One tap adds the card to Apple Wallet or Google Wallet. It updates the moment a stamp lands — and sits next to their boarding passes.",
  },
  {
    id: "stamping",
    tag: "At launch",
    title: "Stamping in seconds",
    body: "Staff scan the customer's QR with any phone camera. The stamp lands instantly — and codes expire, so screenshots don't work.",
  },
];

export function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // A narrow band around the viewport's vertical center decides the
    // active chapter — the standard scroll-narrative pattern.
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
      <div className="absolute left-1/2 top-3 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-text" />
      <div className="relative h-full w-full overflow-hidden bg-surface">
        <WebCardScene active={scene === 0} />
        <WalletScene active={scene === 1} />
        <StampingScene active={scene === 2} />
      </div>
    </div>
  );
}

function SceneShell({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-active={active ? "true" : "false"}
      className="scene absolute inset-0 flex flex-col justify-center gap-5 px-6"
    >
      {children}
    </div>
  );
}

function MiniHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary">
        <span className="size-2.5 rounded-full bg-accent" />
      </span>
      <div>
        <p className="text-xs font-semibold text-text">Corner Coffee</p>
        <p className="text-[10px] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function Dots({ filled, total, pop }: { filled: number; total: number; pop?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {Array.from({ length: total }, (_, i) => {
        if (pop && i === filled) {
          return (
            <span key={i} className="relative flex items-center justify-center">
              <span className="rm-ring absolute inset-0 rounded-full border-2 border-accent" />
              <span className="rm-pop size-8 rounded-full bg-accent" />
            </span>
          );
        }
        return (
          <span
            key={i}
            className={
              i < filled
                ? "size-8 rounded-full bg-accent"
                : "size-8 rounded-full border-2 border-dashed border-border"
            }
          />
        );
      })}
    </div>
  );
}

/** Scene 1 — the web card in the browser. */
function WebCardScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <MiniHeader label="Coffee Card" />
      <div className="rounded-xl border border-border bg-bg p-4">
        <Dots filled={4} total={10} />
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
          <div className="rm-fill h-full w-full rounded-full bg-leaf" />
        </div>
        <p className="mt-2.5 text-[10px] text-text-secondary">
          6 more stamps to a free coffee
        </p>
      </div>
      {/* QR placeholder */}
      <div className="mx-auto grid size-24 grid-cols-3 gap-1 rounded-xl border border-border bg-bg p-2.5">
        {[0, 2, 3, 5, 6, 7].map((n) => (
          <span key={n} className={`rounded-[3px] bg-text ${n % 2 ? "opacity-70" : ""}`} />
        ))}
        {[1, 4, 8].map((n) => (
          <span key={`e${n}`} className="rounded-[3px] border border-border" />
        ))}
      </div>
      <span className="mx-auto rounded-lg bg-primary px-4 py-2 text-[10px] font-medium text-on-primary">
        Show my QR code
      </span>
    </SceneShell>
  );
}

/** Scene 2 — the same card, inside Apple/Google Wallet. */
function WalletScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <p className="text-center text-[10px] font-medium text-text-muted">Wallet</p>
      {/* other passes peeking behind */}
      <div className="flex flex-col gap-2">
        <div className="h-9 rounded-t-xl border border-border bg-surface-alt" />
        <div className="-mt-4 h-9 rounded-t-xl border border-border bg-bg" />
        {/* the Kembali-powered pass sliding in */}
        <div className="rm-wallet -mt-3 rounded-xl bg-primary p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-on-primary">Corner Coffee</span>
            <span className="size-2.5 rounded-full bg-accent" />
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={
                  i < 4
                    ? "size-3 rounded-full bg-accent"
                    : "size-3 rounded-full border border-on-primary/40"
                }
              />
            ))}
          </div>
          <p className="mt-3 text-[9px] text-on-primary/70">
            Updates the moment a stamp lands
          </p>
        </div>
      </div>
      <span className="mx-auto rounded-lg bg-text px-4 py-2 text-[10px] font-medium text-bg">
        Add to wallet
      </span>
    </SceneShell>
  );
}

/** Scene 3 — a new stamp landing after a scan. */
function StampingScene({ active }: { active: boolean }) {
  return (
    <SceneShell active={active}>
      <MiniHeader label="Stamping" />
      <div className="rounded-xl border border-border bg-bg p-4">
        <Dots filled={7} total={10} pop />
        <p className="mt-3 text-[10px] text-text-secondary">
          Scanned — stamp added in 3 seconds
        </p>
      </div>
      {/* frosted confirmation toast */}
      <div className="rm-toast glass backdrop-blur-md mx-auto flex items-center gap-2 rounded-full px-4 py-2">
        <span className="size-2 rounded-full bg-leaf" />
        <span className="text-[10px] font-medium text-text">+1 stamp collected</span>
      </div>
    </SceneShell>
  );
}
