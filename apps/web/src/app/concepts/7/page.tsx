import type { Metadata } from "next";

import "./kinetic.css";
import {
  CTA,
  CUSTOMER_STEPS,
  FAST_FACTS,
  HERO,
  PRICING,
  PROOF,
  STAFF_STEPS,
} from "../content";
import { ConceptNav } from "../shared/concept-nav";
import { KineticHeadline } from "./kinetic";

export const metadata: Metadata = {
  title: "Kinetic type concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 7 - Kinetic type specimen. A variable font at poster scale is the
 * whole design. The hero returns on scroll and reacts to the pointer
 * (kinetic.tsx); section headings and figures settle their weight on entry.
 * kinetic.css owns the type + motion, all gated with static fallbacks. */

export default function ConceptSeven() {
  return (
    <main className="cx-root k7-page" data-concept="7">
      <div className="k7-wrap">
        {/* ---- Hero ---- */}
        <section className="pt-16 pb-14 lg:pt-24 lg:pb-20">
          <p className="k7-eyebrow">Kembali · A type specimen</p>
          <div className="mt-6">
            <KineticHeadline />
          </div>
          <p className="k7-lede mt-8">{HERO.sub}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#start" className="k7-btn k7-btn-primary">
              {CTA.button}
            </a>
            <a href="#how" className="k7-btn k7-btn-ghost">
              See how it works
            </a>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {FAST_FACTS.map((f) => (
              <div key={f.label}>
                <dt className="k7-fact-num">{f.value}</dt>
                <dd className="k7-fact-label">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <hr className="k7-rule" />

        {/* ---- How it works ---- */}
        <section id="how" className="scroll-mt-8 py-16 lg:py-20">
          <p className="k7-kicker">How it works</p>
          <h2 className="k7-flex k7-h2 mt-3">Scan. Stamp. Return.</h2>

          <div className="mt-8 grid gap-x-14 gap-y-2 lg:grid-cols-2">
            <div>
              <p className="k7-kicker mb-1">For your customers</p>
              {CUSTOMER_STEPS.map((s, i) => (
                <div key={s.step} className="k7-step">
                  <span className="k7-step-n">{i + 1}</span>
                  <span className="k7-step-text">{s.step}</span>
                  <span className="k7-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="k7-kicker mb-1">For your staff</p>
              {STAFF_STEPS.map((s, i) => (
                <div key={s.step} className="k7-step">
                  <span className="k7-step-n">{i + 1}</span>
                  <span className="k7-step-text">{s.step}</span>
                  <span className="k7-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="k7-rule" />

        {/* ---- Proof ---- */}
        <section className="py-16 lg:py-20">
          <p className="k7-kicker">{PROOF.caption}</p>
          <h2 className="k7-flex k7-h2 mt-3">{PROOF.shop}, this morning.</h2>

          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PROOF.stats.map((s) => (
              <div key={s.label}>
                <p
                  className="k7-stat-num"
                  data-stat
                  data-earn={s.label === "Redemptions"}
                >
                  {s.value}
                </p>
                <p className="k7-stat-label">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5 text-sm">
            {PROOF.activity.map((a) => (
              <li key={a.who} className="flex items-center gap-2.5">
                <span
                  className="k7-dot"
                  style={{
                    background:
                      a.kind === "reward" ? "var(--coral)" : "var(--leaf)",
                  }}
                  aria-hidden
                />
                <span className="font-semibold text-[var(--ink)]">{a.who}</span>
                <span className="text-[var(--ink-soft)]">{a.what}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="k7-rule" />

        {/* ---- Pricing ---- */}
        <section className="py-16 lg:py-20">
          <p className="k7-kicker">Pricing</p>
          <h2 className="k7-flex k7-h2 mt-3">One price per outlet.</h2>
          <p className="k7-lede mt-4">{PRICING.teaser}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="k7-plan" data-featured={p.featured}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[var(--ink)]">{p.name}</p>
                  <span className="k7-badge">{p.badge}</span>
                </div>
                <p className="mt-3">
                  <span className="k7-plan-price">{p.price}</span>{" "}
                  <span className="text-sm text-[var(--ink-soft)]">
                    {p.unit}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section id="start" className="scroll-mt-8 py-20 text-center lg:py-28">
          <h2 className="k7-flex k7-h2">{CTA.title}</h2>
          <p className="k7-lede mx-auto mt-5 text-center">{CTA.body}</p>
          <div className="mt-8 flex justify-center">
            <a href="#start" className="k7-btn k7-btn-primary">
              {CTA.button}
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-soft)]">
            {CTA.reassurance}
          </p>
        </section>
      </div>

      <ConceptNav current={7} />
    </main>
  );
}
