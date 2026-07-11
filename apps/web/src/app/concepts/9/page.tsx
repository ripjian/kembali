import type { Metadata } from "next";

import "./dimensional.css";
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
import { DimensionalCard } from "./dimensional-card";

export const metadata: Metadata = {
  title: "Dimensional card concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 9 - Dimensional card. The stamp card is a CSS 3D object on a calm
 * pandan backdrop: it tilts to the pointer and its layers separate on scroll,
 * with a flat, readable fallback on touch / reduced-motion. dimensional.css
 * owns the 3D; dimensional-card.tsx owns the pointer tilt. */

export default function ConceptNine() {
  return (
    <main className="cx-root d9-page" data-concept="9">
      <div className="d9-wrap">
        {/* ---- Hero ---- */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div>
            <p className="d9-eyebrow">Their card, in your hand</p>
            <h1 className="d9-h1 mt-4">{HERO.title}</h1>
            <p className="d9-lede mt-5 max-w-md">{HERO.sub}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#start" className="d9-btn d9-btn-primary">
                {CTA.button}
              </a>
              <a href="#how" className="d9-btn d9-btn-ghost">
                See how it works
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-5">
              {FAST_FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="d9-fact-num">{f.value}</dt>
                  <dd className="d9-fact-label">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="py-6">
            <DimensionalCard />
          </div>
        </section>

        <hr className="d9-rule" />

        {/* ---- How it works ---- */}
        <section id="how" className="scroll-mt-8 py-16 lg:py-20">
          <p className="d9-eyebrow">How it works</p>
          <h2 className="d9-h2 mt-3">Easy for customers, easier for staff.</h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="d9-panel">
              <p className="d9-step-head">For your customers</p>
              <div className="mt-2">
                {CUSTOMER_STEPS.map((s, i) => (
                  <div key={s.step} className="d9-step-row">
                    <span className="d9-step-idx">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="d9-step-text">{s.step}</span>
                    <span className="d9-step-tag">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="d9-panel">
              <p className="d9-step-head">For your staff</p>
              <div className="mt-2">
                {STAFF_STEPS.map((s, i) => (
                  <div key={s.step} className="d9-step-row">
                    <span className="d9-step-idx">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="d9-step-text">{s.step}</span>
                    <span className="d9-step-tag">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <hr className="d9-rule" />

        {/* ---- Proof ---- */}
        <section className="py-16 lg:py-20">
          <p className="d9-eyebrow">{PROOF.caption}</p>
          <h2 className="d9-h2 mt-3">{PROOF.shop}, this morning.</h2>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROOF.stats.map((s) => (
              <div key={s.label} className="d9-stat">
                <p
                  className="d9-stat-num"
                  data-stat
                  data-earn={s.label === "Redemptions"}
                >
                  {s.value}
                </p>
                <p className="d9-stat-label">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
            {PROOF.activity.map((a) => (
              <li key={a.who} className="flex items-center gap-2.5 text-sm">
                <span
                  className="d9-dot"
                  data-kind={a.kind === "reward" ? "reward" : "progress"}
                  aria-hidden
                />
                <span className="d9-act-who" data-earn={a.kind === "reward"}>
                  {a.who}
                </span>
                <span className="text-[var(--text-soft)]">{a.what}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="d9-rule" />

        {/* ---- Pricing ---- */}
        <section className="py-16 lg:py-20">
          <p className="d9-eyebrow">Pricing</p>
          <h2 className="d9-h2 mt-3">One price per outlet, per month.</h2>
          <p className="d9-lede mt-4 max-w-xl">{PRICING.teaser}</p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="d9-plan" data-featured={p.featured}>
                <div className="flex items-center justify-between gap-2">
                  <p className="d9-plan-name">{p.name}</p>
                  <span className="d9-badge" data-featured={p.featured}>
                    {p.badge}
                  </span>
                </div>
                <p className="mt-3">
                  <span className="d9-plan-price">{p.price}</span>{" "}
                  <span className="text-sm text-[var(--text-muted)]">
                    {p.unit}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section
          id="start"
          className="d9-cta scroll-mt-8 my-8 px-8 py-14 text-center"
        >
          <h2 className="d9-h2">{CTA.title}</h2>
          <p className="d9-lede mx-auto mt-4 max-w-lg">{CTA.body}</p>
          <div className="mt-7 flex justify-center">
            <a href="#start" className="d9-btn d9-btn-primary">
              {CTA.button}
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            {CTA.reassurance}
          </p>
        </section>
      </div>

      <ConceptNav current={9} />
    </main>
  );
}
