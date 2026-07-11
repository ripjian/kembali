"use client";

import { useState } from "react";

import { CTA } from "../content";
import {
  DEFAULTS,
  GOALS,
  OUTLETS,
  priceFor,
  SHOP_TYPES,
} from "./presets";

/* The conversational hero. This renders identically on the server with the
 * DEFAULT answers, so with no JavaScript the visitor sees a complete, correct
 * page (cafe, 1 outlet, bring regulars back) and the chips just show those
 * defaults. With JavaScript, clicking a chip updates the state and the live
 * preview (headline, example card, pricing math) re-renders. */

function Loop() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill="currentColor" />
      <circle cx="40" cy="40" r="9" fill="currentColor" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function ChatLanding() {
  const [shopId, setShopId] = useState<string>(DEFAULTS.shop);
  const [outletId, setOutletId] = useState<string>(DEFAULTS.outlet);
  const [goalId, setGoalId] = useState<string>(DEFAULTS.goal);

  const shop = SHOP_TYPES.find((s) => s.id === shopId) ?? SHOP_TYPES[0]!;
  const outlet = OUTLETS.find((o) => o.id === outletId) ?? OUTLETS[0]!;
  const goal = GOALS.find((g) => g.id === goalId) ?? GOALS[0]!;
  const price = priceFor(outlet.count);
  const filled = Math.round(shop.visits * 0.6);

  return (
    <div className="c10-hero">
      {/* ---- chat ---- */}
      <div className="c10-chat">
        <div className="c10-chat-top">
          <span className="c10-avatar" aria-hidden>
            <span style={{ color: "#e0684b" }}>
              <Loop />
            </span>
          </span>
          <div>
            <p className="c10-chat-name">Kembali</p>
            <p className="c10-chat-status">Answer three quick questions</p>
          </div>
        </div>

        <div className="c10-q">
          <p className="c10-prompt">What kind of shop do you run?</p>
          <div className="c10-opts">
            {SHOP_TYPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="c10-chip"
                data-selected={s.id === shopId}
                aria-pressed={s.id === shopId}
                onClick={() => setShopId(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="c10-q">
          <p className="c10-prompt">How many outlets?</p>
          <div className="c10-opts">
            {OUTLETS.map((o) => (
              <button
                key={o.id}
                type="button"
                className="c10-chip"
                data-selected={o.id === outletId}
                aria-pressed={o.id === outletId}
                onClick={() => setOutletId(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="c10-q">
          <p className="c10-prompt">What matters most right now?</p>
          <div className="c10-opts">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="c10-chip"
                data-selected={g.id === goalId}
                aria-pressed={g.id === goalId}
                onClick={() => setGoalId(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <p className="c10-summary">
          Your card, built for a <b>{shop.label.toLowerCase()}</b> with{" "}
          <b>{outlet.label}</b>, to <b>{goal.phrase}</b>.
        </p>
      </div>

      {/* ---- live preview ---- */}
      <div>
        <p className="c10-eyebrow">Your card, on the right</p>
        <h1 className="c10-headline">
          The {shop.card} your {shop.audience} keep.
        </h1>
        <p className="c10-subline">
          Set up a loyalty card that helps you {goal.phrase}. Customers join in
          30 seconds from a QR at your counter, with no app to download.
        </p>

        <div className="c10-card">
          <div className="c10-card-head">
            <span className="c10-card-shop">Your shop</span>
            <span className="c10-card-type">{shop.card}</span>
          </div>
          <div className="c10-slots">
            {Array.from({ length: shop.visits }, (_, i) => {
              const isFilled = i < filled;
              const isReward = i === shop.visits - 1;
              return (
                <span
                  key={i}
                  className="c10-slot"
                  data-filled={isFilled}
                  data-reward={isReward}
                >
                  {isFilled ? <Loop /> : isReward ? "★" : null}
                </span>
              );
            })}
          </div>
          <p className="c10-reward">
            <b>Reward:</b> {shop.reward.toLowerCase()}
          </p>
          <div className="c10-price">
            <span className="c10-price-math">{price.math}</span>
            <span className="c10-price-note">{price.note}</span>
          </div>
        </div>

        <div className="c10-cta-row">
          <a href="#start" className="c10-btn c10-btn-primary">
            {CTA.button}
          </a>
          <a href="#pricing" className="c10-btn c10-btn-ghost">
            See full pricing
          </a>
        </div>
      </div>
    </div>
  );
}

export { Check };
