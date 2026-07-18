"use client";

import Link from "next/link";
import { useState } from "react";

/* Build-your-own plan: pick modules, see a monthly estimate.
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
  note: string;
  price: number;
  live: boolean;
}

const MODULES: Module[] = [
  {
    id: "points",
    label: "Points and rewards",
    note: "Spend earns points, points buy rewards",
    price: 59,
    live: true,
  },
  {
    id: "wallet",
    label: "Apple and Google Wallet cards",
    note: "The card lives in the phone's wallet",
    price: 29,
    live: false,
  },
  {
    id: "vip",
    label: "VIP member tags",
    note: "Point multipliers for your best regulars",
    price: 29,
    live: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp reminders and campaigns",
    note: "Includes RM30 of message credits monthly",
    price: 79,
    live: false,
  },
  {
    id: "referrals",
    label: "Referral rewards",
    note: "Both the sender and the friend earn",
    price: 39,
    live: false,
  },
  {
    id: "domain",
    label: "Your own domain",
    note: "Cards at loyalty.yourbrand.com",
    price: 49,
    live: false,
  },
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
  const growthCheaper = perOutlet >= GROWTH_PRICE;

  return (
    <div className="builder reveal" id="builder">
      <div className="builder-left">
        <div className="builder-outlets">
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
        </div>

        <div className="builder-modules">
          <p className="col-label mono">Pick your modules</p>

          <div className="bm-row bm-core" aria-disabled>
            <span className="bm-check on" aria-hidden />
            <span className="bm-text">
              <b>Core stamp cards</b>
              <small>QR kit, team roles, reports, free data export</small>
            </span>
            <span className="bm-price mono">RM{CORE_PRICE}</span>
          </div>

          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`bm-row${picked.has(m.id) ? " on" : ""}`}
              aria-pressed={picked.has(m.id)}
              onClick={() => toggle(m.id)}
            >
              <span className={`bm-check${picked.has(m.id) ? " on" : ""}`} aria-hidden />
              <span className="bm-text">
                <b>
                  {m.label}
                  {!m.live && <span className="soon-chip mono">Coming soon</span>}
                </b>
                <small>{m.note}</small>
              </span>
              <span className="bm-price mono">+RM{m.price}</span>
            </button>
          ))}

          <button
            type="button"
            className={`bm-row bm-app${app ? " on" : ""}`}
            aria-pressed={app}
            onClick={() => setApp((a) => !a)}
          >
            <span className={`bm-check${app ? " on" : ""}`} aria-hidden />
            <span className="bm-text">
              <b>Your own branded app</b>
              <small>For chains with 6 or more outlets. Priced on a call.</small>
            </span>
            <span className="bm-price mono">On a call</span>
          </button>
          <p className="bm-applink">
            <Link href="/your-app">See what your app could look like</Link>
          </p>
        </div>
      </div>

      <aside className="builder-total">
        <p className="col-label mono">Your estimate</p>
        <p className="bt-per">
          <span className="price">RM{perOutlet}</span>
          <span className="plan-per mono">/outlet/month</span>
        </p>
        {discounted && <p className="bt-line mono">20% chain discount applied</p>}
        <p className="bt-monthly">
          RM{monthly} a month for {outlets} {outlets === 1 ? "outlet" : "outlets"}
          {app && ", plus the app"}
        </p>
        {growthCheaper && (
          <p className="bt-hint">Growth bundles all of this for RM{GROWTH_PRICE}. Ask us which fits.</p>
        )}
        <a className="btn btn-solid" href={buildMailto(outlets, pickedModules, app, monthly)}>
          Send this plan to us
        </a>
        <p className="bt-note mono">
          An estimate, not a quote. We confirm module prices on a call.
        </p>
      </aside>
    </div>
  );
}
