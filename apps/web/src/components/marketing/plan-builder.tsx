"use client";

import Link from "next/link";
import { useState } from "react";

/* Build-your-own plan: tap chips, watch the receipt fill in.
 * (Founder-picked design, 2026-07-19: every choice prints a ledger line,
 * like the product itself.)
 *
 * Numbers come from PRICING.md §9 and are a PROPOSAL: the UI always
 * frames them as an estimate confirmed on a call, never a quote. The
 * three tiers stay the obvious buy; this exists for odd combos, chains,
 * and as a lead qualifier (the mailto carries the whole selection). */

const CONTACT_EMAIL = "hello@kembali.app";
const CORE_PRICE = 99;
const CHAIN_DISCOUNT_AT = 5;
const GROWTH_PRICE = 279;

interface Module {
  id: string;
  label: string;
  price: number;
  live: boolean;
}

const MODULES: Module[] = [
  { id: "points", label: "Points and rewards", price: 59, live: true },
  { id: "wallet", label: "Apple and Google Wallet cards", price: 29, live: false },
  { id: "vip", label: "VIP member tags", price: 29, live: false },
  { id: "whatsapp", label: "WhatsApp reminders and campaigns", price: 79, live: false },
  { id: "referrals", label: "Referral rewards", price: 39, live: false },
  { id: "domain", label: "Your own domain", price: 49, live: false },
];

function buildMailto(outlets: number, picked: Module[], app: boolean, monthly: number) {
  const body = [
    "Hi Kembali,",
    "",
    "I built a plan on your pricing page:",
    `- Outlets: ${outlets}`,
    "- Core stamp cards",
    ...picked.map((m) => `- ${m.label}`),
    ...(app ? ["- A branded app for our chain"] : []),
    `- Estimated monthly: RM${monthly}`,
    "",
    "Here is a bit about our brand:",
    "",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("A plan for our outlets")}&body=${encodeURIComponent(body)}`;
}

export function PlanBuilder() {
  const [outlets, setOutlets] = useState(3);
  const [picked, setPicked] = useState<Set<string>>(new Set(["points"]));
  const [app, setApp] = useState(false);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pickedModules = MODULES.filter((m) => picked.has(m.id));
  const perOutletFull = CORE_PRICE + pickedModules.reduce((sum, m) => sum + m.price, 0);
  const discounted = outlets >= CHAIN_DISCOUNT_AT;
  const perOutlet = discounted ? Math.round(perOutletFull * 0.8) : perOutletFull;
  const monthly = perOutlet * outlets;

  return (
    <div className="bvr" id="builder">
      <div className="bvr-left">
        <p className="col-label mono">How many outlets?</p>
        <div className="bo-stepper">
          <button
            type="button"
            className="bo-btn"
            aria-label="One outlet fewer"
            onClick={() => setOutlets((n) => Math.max(1, n - 1))}
          >
            &minus;
          </button>
          <span className="bo-count mono">{outlets}</span>
          <button
            type="button"
            className="bo-btn"
            aria-label="One outlet more"
            onClick={() => setOutlets((n) => Math.min(15, n + 1))}
          >
            +
          </button>
        </div>
        {outlets >= 10 && (
          <p className="bo-note mono">Chains this size get custom pricing. Talk to us.</p>
        )}

        <p className="col-label mono bvr-chips-label">Tap what you need</p>
        <div className="bvr-chips">
          <span className="bvr-chip bvr-chip-core">
            Core stamp cards <b className="mono">RM{CORE_PRICE}</b>
          </span>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`bvr-chip${picked.has(m.id) ? " on" : ""}`}
              aria-pressed={picked.has(m.id)}
              onClick={() => toggle(m.id)}
            >
              {m.label} <b className="mono">+RM{m.price}</b>
              {!m.live && <i className="mono">soon</i>}
            </button>
          ))}
          <button
            type="button"
            className={`bvr-chip bvr-chip-app${app ? " on" : ""}`}
            aria-pressed={app}
            onClick={() => setApp((a) => !a)}
          >
            Your own branded app <b className="mono">on a call</b>
          </button>
        </div>
        <p className="bvr-applink">
          <Link href="/your-app">See what your app could look like</Link>
        </p>
      </div>

      <div className="bvr-receipt" aria-live="polite">
        <p className="bvr-rhead mono">Kembali &middot; monthly estimate</p>
        <div className="bvr-lines mono">
          <div className="bvr-line">
            <span>Core stamp cards</span>
            <span>{CORE_PRICE}</span>
          </div>
          {pickedModules.map((m) => (
            <div key={m.id} className="bvr-line">
              <span>{m.label}</span>
              <span>{m.price}</span>
            </div>
          ))}
          <div className="bvr-line bvr-line-sub">
            <span>Per outlet</span>
            <span>{perOutletFull}</span>
          </div>
          {discounted && (
            <div className="bvr-line bvr-line-sub">
              <span>Chain discount 20% off</span>
              <span>&minus;{perOutletFull - perOutlet}</span>
            </div>
          )}
          <div className="bvr-line bvr-line-sub">
            <span>Outlets</span>
            <span>&times; {outlets}</span>
          </div>
          <div className="bvr-line bvr-total">
            <span>Total a month</span>
            <span>RM {monthly}</span>
          </div>
          {app && (
            <div className="bvr-line bvr-line-app">
              <span>Your own branded app</span>
              <span>on a call</span>
            </div>
          )}
        </div>
        {perOutlet >= GROWTH_PRICE && (
          <p className="bvr-hint">Growth bundles all of this for RM{GROWTH_PRICE}. Ask us which fits.</p>
        )}
        <a className="btn btn-solid" href={buildMailto(outlets, pickedModules, app, monthly)}>
          Send this plan to us
        </a>
        <p className="bvr-note mono">An estimate, not a quote. We confirm module prices on a call.</p>
      </div>
    </div>
  );
}
