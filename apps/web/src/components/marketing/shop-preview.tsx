"use client";

import { useState } from "react";

/* The reach-out section as a live preview, not a form. As a visitor types
 * their shop name and reward and picks a brand color, the stamp card beside
 * the fields updates in real time, so they see their own card before they
 * ever talk to us. The CTA prefills an email (contact-to-invoice, no signup);
 * swap in WhatsApp + a real inbox when they exist. */

const CONTACT_EMAIL = "hello@kembali.app";

// Preset swatches, all dark enough to carry white text on the card band.
const SWATCHES = [
  { name: "Pandan", value: "#0f3d32" },
  { name: "Coral", value: "#c8502f" },
  { name: "Ocean", value: "#1f6f8b" },
  { name: "Grape", value: "#5b4b9e" },
  { name: "Rose", value: "#b03060" },
  { name: "Espresso", value: "#4a342a" },
];

const FILLED = 4;
const TOTAL = 10;

function buildMailto(shop: string, reward: string, color: string): string {
  const name = shop.trim() || "my shop";
  const subject = `Kembali for ${name}`;
  const body = [
    "Hi Kembali,",
    "",
    `I built a quick preview of a loyalty card for ${name}:`,
    `- Reward: ${reward.trim() || "a free coffee"}`,
    `- Brand color: ${color}`,
    "",
    "I'd love to see how it fits. Here's how to reach me:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ShopPreview() {
  const [shop, setShop] = useState("");
  const [reward, setReward] = useState("");
  const [color, setColor] = useState(SWATCHES[0]!.value);

  const shopName = shop.trim() || "Your shop";
  const rewardName = reward.trim() || "a free coffee";

  return (
    <div className="panel-ring mx-auto grid w-full max-w-4xl gap-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
      {/* Fields — three inputs, then the CTA */}
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">
            Shop name
          </span>
          <input
            type="text"
            value={shop}
            maxLength={28}
            onChange={(e) => setShop(e.target.value)}
            placeholder="Corner Coffee"
            className="h-11 rounded-lg border border-smoke bg-surface px-3.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">
            Reward for a full card
          </span>
          <input
            type="text"
            value={reward}
            maxLength={32}
            onChange={(e) => setReward(e.target.value)}
            placeholder="A free coffee"
            className="h-11 rounded-lg border border-smoke bg-surface px-3.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-secondary">
            Brand color
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setColor(s.value)}
                aria-label={s.name}
                aria-pressed={color === s.value}
                style={{ backgroundColor: s.value }}
                className={`press size-8 rounded-full transition-transform ${
                  color === s.value
                    ? "ring-2 ring-text ring-offset-2 ring-offset-surface"
                    : ""
                }`}
              />
            ))}
            <label className="press grid size-8 cursor-pointer place-items-center rounded-full border border-dashed border-smoke text-xs text-text-muted">
              +
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <a
            href={buildMailto(shop, reward, color)}
            className="press inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:bg-primary-hover"
          >
            Send it to us
          </a>
        </div>
        <p className="text-xs text-text-muted">
          Your preview is prefilled into the email. Nothing is sent or stored
          until you send it.
        </p>
      </div>

      {/* Live mock card — tenant brand color drives the header and stamps
          (white-label preview; BRAND.md allows tenant colors to override). */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ backgroundColor: color }}
          >
            <span className="grid size-9 place-items-center rounded-lg bg-white/20 text-sm font-semibold text-white">
              {shopName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {shopName}
              </p>
              <p className="text-[11px] text-white/70">Loyalty card</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold text-text">Stamp card</p>
              <p className="font-mono text-[11px] text-text-muted tabular-nums">
                {FILLED}/{TOTAL}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: TOTAL }, (_, i) => (
                <span
                  key={i}
                  style={i < FILLED ? { backgroundColor: color } : undefined}
                  className={
                    i < FILLED
                      ? "aspect-square w-full rounded-full"
                      : "aspect-square w-full rounded-full border-2 border-dashed border-border"
                  }
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-text-secondary">
              Collect {TOTAL} stamps to get {rewardName.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
