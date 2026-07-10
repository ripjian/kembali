import type { CSSProperties } from "react";

/* Decorative, looping illustrations for the public roadmap - pure CSS
 * animations (globals.css `rm-*`), transform/opacity only, paused until
 * their section scrolls into view and disabled under reduced motion.
 * Coral = earned, leaf = progress, pandan = actions (BRAND.md).
 * Mono micro-labels are the technical voice (DESIGN-dub.md Geist role). */

function iVar(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

const frame =
  "relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-alt";

/** Shipped - the platform layers, stacking from the bottom up. */
export function FoundationsIllustration() {
  const layers = [
    { label: "Your brand & card", width: "w-36", i: 2 },
    { label: "Tamper-proof stamp ledger", width: "w-44 sm:w-48", i: 1 },
    { label: "Isolated data per merchant", width: "w-52 sm:w-60", i: 0 },
  ];
  return (
    <div className={frame} aria-hidden>
      <div className="flex flex-col items-center gap-2">
        {layers.map((layer) => (
          <div
            key={layer.label}
            style={iVar(layer.i)}
            className={`rm-slab ${layer.width} rounded-full border border-border bg-surface px-4 py-2 text-center text-xs font-medium text-text-secondary`}
          >
            {layer.label}
          </div>
        ))}
        <p className="mt-3 font-mono text-xs text-text-muted">
          built bottom-up · security first
        </p>
      </div>
    </div>
  );
}

/** Phase 1 - stamps landing on a card, one by one (5 × 2 rows). */
export function StampsIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="panel-ring rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={iVar(i)} className="rm-stamp size-7 rounded-full bg-accent sm:size-9" />
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-text-muted">
          10 stamps → free coffee
        </p>
      </div>
    </div>
  );
}

/** Points and rewards (live): points climb toward a reward you can redeem. */
export function PointsIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="panel-ring w-full max-w-64 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-secondary">Points this visit</span>
          <span className="font-mono text-text-muted tabular-nums">RM1 = 1</span>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          <span className="rm-fill block h-full w-full rounded-full bg-leaf" />
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-accent/40 bg-surface p-2.5">
          <span style={iVar(4)} className="rm-pop size-8 shrink-0 rounded-lg bg-accent" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent-deep">Free coffee</p>
            <p className="text-[10px] text-text-muted">Ready to redeem</p>
          </div>
        </div>
        <p className="mt-4 font-mono text-xs text-text-muted">
          spend → points → rewards
        </p>
      </div>
    </div>
  );
}

/** Phase 2 - the card sliding into the phone's own wallet. */
export function WalletIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="panel-ring w-full max-w-64 rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div className="rm-wallet w-full rounded-xl bg-primary p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-primary">Coffee Card</span>
            <span className="size-3 rounded-full bg-accent" />
          </div>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={
                  i < 3 ? "size-4 rounded-full bg-accent" : "size-4 rounded-full border border-on-primary/40"
                }
              />
            ))}
          </div>
          <p className="mt-4 text-[10px] text-on-primary/70">
            Add to Apple &amp; Google Wallet
          </p>
        </div>
      </div>
    </div>
  );
}

/** Phase 3 - WhatsApp-first nudges arriving. */
export function MessagesIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="flex w-full max-w-64 flex-col gap-3 px-3 text-xs leading-snug">
        <div style={iVar(0)} className="rm-bubble max-w-52 self-start rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-2.5 text-text-secondary">
          Welcome! Your card is ready ☕
        </div>
        <div style={iVar(1)} className="rm-bubble max-w-52 self-start rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-2.5 text-text-secondary">
          2 stamps to your free coffee 👀
        </div>
        <div style={iVar(2)} className="rm-bubble max-w-52 self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-on-primary">
          Happy birthday, a treat&apos;s on us 🎂
        </div>
      </div>
    </div>
  );
}

/** Phase 4 - a link travels from one customer to a friend; both win. */
export function ReferralIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-xs font-medium text-on-primary">
              A
            </span>
            <span
              style={iVar(6)}
              className="rm-stamp absolute -right-1 -top-1 size-5 rounded-full bg-accent"
            />
          </div>
          <div className="relative h-px w-14 bg-border sm:w-24">
            <span className="rm-travel absolute -top-1.5 left-0 size-3 rounded-full bg-leaf" />
          </div>
          <div className="relative">
            <span className="flex size-14 items-center justify-center rounded-full border border-border bg-surface text-xs font-medium text-text">
              B
            </span>
            <span
              style={iVar(8)}
              className="rm-stamp absolute -right-1 -top-1 size-5 rounded-full bg-accent"
            />
          </div>
        </div>
        <p className="mt-5 text-center font-mono text-xs text-text-muted">
          share a link · both get rewarded
        </p>
      </div>
    </div>
  );
}

/** Phase 5 - the platform opens up: API, webhooks, POS. */
export function PlatformIllustration() {
  const nodes = ["POS", "Kembali API", "Webhooks"];
  return (
    <div className={frame} aria-hidden>
      <div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {nodes.map((label, i) => (
            <span key={label} className="flex items-center gap-2">
              <span
                style={iVar(i)}
                className="rm-node rounded-full border border-border bg-surface px-4 py-2 font-mono text-xs text-text"
              >
                {label}
              </span>
              {i < nodes.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" />}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-xs text-text-muted">
          points · tiers · integrations
        </p>
      </div>
    </div>
  );
}
