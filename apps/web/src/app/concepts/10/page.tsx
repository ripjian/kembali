import type { Metadata } from "next";

import "./conversational.css";
import {
  CTA,
  CUSTOMER_STEPS,
  FAST_FACTS,
  PRICING,
  PROOF,
  STAFF_STEPS,
} from "../content";
import { ConceptNav } from "../shared/concept-nav";
import { ChatLanding, Check } from "./chat-landing";

export const metadata: Metadata = {
  title: "Conversational concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 10 - Conversational landing. The hero is a three-question chat that
 * personalizes the headline, example card and pricing math (chat-landing.tsx).
 * It server-renders with sensible defaults, so the page below is a complete,
 * correct landing page even with no JavaScript. Everything under the hero is
 * static: how it works, proof, transparent pricing, CTA. */

const TRUST = [
  "30-day free pilot",
  "No card to start",
  "We invoice after the pilot",
  "Free data export, forever",
];

export default function ConceptTen() {
  return (
    <main className="cx-root c10-page" data-concept="10">
      <div className="c10-wrap">
        <ChatLanding />

        {/* ---- fast facts ---- */}
        <section className="c10-section">
          <p className="c10-kicker">Why shops pick it</p>
          <div className="c10-facts mt-6">
            {FAST_FACTS.map((f) => (
              <div key={f.label}>
                <p className="c10-fact-num">{f.value}</p>
                <p className="c10-fact-label">{f.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- how it works ---- */}
        <section id="how" className="c10-section scroll-mt-6">
          <p className="c10-kicker">How it works</p>
          <h2 className="c10-h2 mt-2">Easy for customers, easier for staff.</h2>
          <div className="mt-6 grid gap-x-12 gap-y-2 lg:grid-cols-2">
            <div>
              <p className="c10-kicker mb-1">For your customers</p>
              {CUSTOMER_STEPS.map((s, i) => (
                <div key={s.step} className="c10-step">
                  <span className="c10-step-n">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.step}</span>
                  <span className="c10-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="c10-kicker mb-1">For your staff</p>
              {STAFF_STEPS.map((s, i) => (
                <div key={s.step} className="c10-step">
                  <span className="c10-step-n">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.step}</span>
                  <span className="c10-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- proof ---- */}
        <section className="c10-section">
          <p className="c10-kicker">{PROOF.caption}</p>
          <h2 className="c10-h2 mt-2">{PROOF.shop}, this morning.</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {PROOF.stats.map((s) => (
              <div key={s.label}>
                <p
                  className="c10-stat-num"
                  data-stat
                  data-earn={s.label === "Redemptions"}
                >
                  {s.value}
                </p>
                <p className="c10-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-sm">
            {PROOF.activity.map((a) => (
              <li key={a.who} className="flex items-center gap-2.5">
                <span
                  className="c10-dot"
                  style={{
                    background: a.kind === "reward" ? "var(--coral)" : "var(--leaf)",
                  }}
                  aria-hidden
                />
                <span className="font-semibold text-[var(--ink)]">{a.who}</span>
                <span className="text-[var(--ink-soft)]">{a.what}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- transparent pricing (trust block) ---- */}
        <section id="pricing" className="c10-section scroll-mt-6">
          <p className="c10-kicker">Pricing, in the open</p>
          <h2 className="c10-h2 mt-2">One price per outlet, per month.</h2>
          <p className="c10-lede mt-3 max-w-xl">{PRICING.teaser}</p>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="c10-plan" data-featured={p.featured}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--ink)]">{p.name}</p>
                  <span className="c10-badge">{p.badge}</span>
                </div>
                <p className="mt-3">
                  <span className="c10-plan-price">{p.price}</span>{" "}
                  <span className="text-sm text-[var(--muted)]">{p.unit}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>

          <div className="c10-trust">
            {TRUST.map((t) => (
              <span key={t}>
                <Check />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section id="start" className="c10-cta scroll-mt-6">
          <h2>{CTA.title}</h2>
          <p>{CTA.body}</p>
          <div className="mt-6 flex justify-center">
            <a href="#start" className="c10-btn c10-btn-ghost">
              {CTA.button}
            </a>
          </div>
          <p className="mt-4 text-sm text-[rgba(246,241,227,0.7)]">
            {CTA.reassurance}
          </p>
        </section>
      </div>

      <ConceptNav current={10} />
    </main>
  );
}
