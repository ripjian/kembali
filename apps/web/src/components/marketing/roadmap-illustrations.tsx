import type { CSSProperties } from "react";

/* Decorative, looping illustrations for the public roadmap — pure CSS
 * animations (globals.css `rm-*`), transform/opacity only, paused until
 * their section scrolls into view and disabled under reduced motion.
 * Coral = earned, leaf = progress, pandan = actions (BRAND.md). */

function iVar(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

const frame =
  "relative flex h-64 items-center justify-center overflow-hidden rounded-[40px] border border-border bg-surface";

/** Phase 1 — stamps landing on a card, one by one. */
export function StampsIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="rounded-3xl border border-border bg-bg p-6">
        <div className="flex gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={iVar(i)} className="rm-stamp size-9 rounded-full bg-accent" />
          ))}
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-tight text-text-muted">
          9 stamps → free kopi
        </p>
      </div>
    </div>
  );
}

/** Phase 2 — WhatsApp-first nudges arriving. */
export function MessagesIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="flex w-64 flex-col gap-3 font-mono text-xs leading-snug">
        <div style={iVar(0)} className="rm-bubble max-w-52 self-start rounded-2xl rounded-bl-md border border-border bg-bg px-4 py-2.5 text-text-secondary">
          Selamat datang! Your card is ready ☕
        </div>
        <div style={iVar(1)} className="rm-bubble max-w-52 self-start rounded-2xl rounded-bl-md border border-border bg-bg px-4 py-2.5 text-text-secondary">
          2 stamps to your free kopi 👀
        </div>
        <div style={iVar(2)} className="rm-bubble max-w-52 self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-on-primary">
          Happy birthday — treat&apos;s on us 🎂
        </div>
      </div>
    </div>
  );
}

/** Phase 3 — repeat visits climbing across branches. */
export function AnalyticsIllustration() {
  const heights = ["h-12", "h-20", "h-16", "h-28", "h-24", "h-36"];
  return (
    <div className={frame} aria-hidden>
      <div>
        <div className="flex items-end gap-3 border-b border-border pb-0.5">
          {heights.map((h, i) => (
            <span key={i} style={iVar(i)} className={`rm-bar w-8 rounded-t-lg bg-leaf ${h}`} />
          ))}
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-tight text-text-muted">
          Repeat visits ↗ member share ↗
        </p>
      </div>
    </div>
  );
}

/** Phase 4 — the platform opens up: API, webhooks, POS. */
export function PlatformIllustration() {
  const nodes = ["POS", "Kembali API", "Webhooks"];
  return (
    <div className={frame} aria-hidden>
      <div>
        <div className="flex items-center gap-2">
          {nodes.map((label, i) => (
            <span key={label} className="flex items-center gap-2">
              <span
                style={iVar(i)}
                className="rm-node rounded-full border border-border bg-bg px-4 py-2 font-mono text-xs uppercase tracking-tight text-text"
              >
                {label}
              </span>
              {i < nodes.length - 1 && <span className="h-px w-6 bg-border" />}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-xs uppercase tracking-tight text-text-muted">
          Points · tiers · integrations
        </p>
      </div>
    </div>
  );
}

/** Backlog — the wallet pass, waiting patiently in its slot. */
export function WalletIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="rounded-3xl border-2 border-dashed border-border p-4">
        <div className="rm-wallet w-56 rounded-2xl bg-primary p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-tight text-on-primary">
              Kopi Card
            </span>
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
          <p className="mt-4 font-mono text-[10px] uppercase tracking-tight text-on-primary/70">
            Add to Wallet — waiting in the backlog
          </p>
        </div>
      </div>
    </div>
  );
}
