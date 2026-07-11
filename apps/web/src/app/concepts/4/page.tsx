import type { Metadata } from "next";

import "./brutalist.css";
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

export const metadata: Metadata = {
  title: "Brutalist concept · Kembali",
  robots: { index: false, follow: false },
};

/* Ten-cell stamp card, coral fills = earned (roles kept: coral = earned). A
 * bold blocky graphic, not the interactive one from concept 1. */
const STAMPS = Array.from({ length: 10 }, (_, i) => i + 1);
const EARNED = 7;

/* Accent per fast-fact tile, roles honest: pandan = action facts (no app / no
 * hardware are the "we handle it" promises), leaf = the join/stamp speed. */
const FACT_STYLE = ["b-stat--leaf", "b-stat--pandan", "", ""] as const;

export default function ConceptFour() {
  return (
    <main className="cx-root b-page" data-concept="4">
      <div className="b-wrap">
        {/* ---- Hero ---- */}
        <section className="grid items-start gap-10 py-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:py-20">
          <div className="b-rise">
            <span className="b-eyebrow">{HERO.eyebrow}</span>

            <h1 className="b-display b-h1 mt-5">
              Loyalty cards your <span className="b-mark">customers</span> never
              lose
            </h1>

            <p className="b-lede mt-6">{HERO.sub}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#start" className="b-btn b-btn-primary">
                {CTA.button}
              </a>
              <a href="#how" className="b-btn b-btn-secondary">
                {HERO.secondaryCta}
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="b-sticker b-sticker-coral">Free 30 days</span>
              <span className="b-sticker b-sticker-leaf">No card to start</span>
            </div>

            <dl className="mt-9 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-2">
              {FAST_FACTS.map((f, i) => (
                <div key={f.label} className={`b-stat ${FACT_STYLE[i]}`}>
                  <dt className="b-stat-num">{f.value}</dt>
                  <dd className="b-stat-label">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* stamp card poster graphic */}
          <div className="b-rise flex justify-center lg:justify-end lg:pt-2">
            <div className="b-card w-full max-w-sm">
              <div className="b-card-head">
                <div>
                  <p className="b-card-shop">Corner Coffee</p>
                  <p className="b-card-sub">Coffee card · buy 9, get 1</p>
                </div>
                <span className="b-card-code">KMB-4821</span>
              </div>

              <div className="b-grid" aria-hidden>
                {STAMPS.map((n) =>
                  n === 10 ? (
                    <div key={n} className="b-slot" data-reward="true">
                      FREE
                    </div>
                  ) : (
                    <div
                      key={n}
                      className="b-slot"
                      data-filled={n <= EARNED}
                    >
                      {n}
                    </div>
                  ),
                )}
              </div>

              <div className="b-progress" aria-hidden>
                <div className="b-progress-fill" />
              </div>
              <p className="b-card-foot">7 of 10 stamps · 3 to a free coffee</p>
            </div>
          </div>
        </section>

        <hr className="b-rule" />

        {/* ---- How it works ---- */}
        <section id="how" className="scroll-mt-6 py-14 lg:py-20">
          <p className="b-kicker">How it works</p>
          <h2 className="b-display b-h2 mt-3 max-w-3xl">
            Easy for regulars, easier for staff
          </h2>

          <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:gap-8">
            <div>
              <span className="b-lane-head">For your customers</span>
              <div className="mt-4 grid gap-4">
                {CUSTOMER_STEPS.map((s, i) => (
                  <div key={s.step} className="b-step">
                    <span className="b-step-n">{i + 1}</span>
                    <div className="b-step-body">
                      <p className="b-step-title">{s.step}</p>
                      <span className="b-step-tag">{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="b-lane-head">For your staff</span>
              <div className="mt-4 grid gap-4">
                {STAFF_STEPS.map((s, i) => (
                  <div key={s.step} className="b-step">
                    <span className="b-step-n">{i + 1}</span>
                    <div className="b-step-body">
                      <p className="b-step-title">{s.step}</p>
                      <span className="b-step-tag">{s.detail}</span>
                    </div>
                  </div>
                ))}
                <div className="b-block flex items-center px-4 py-5">
                  <p className="text-sm font-semibold">
                    No terminal, no training. Any phone with a camera works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="b-rule" />

        {/* ---- Proof / stat moment ---- */}
        <section className="py-14 lg:py-20">
          <p className="b-kicker">{PROOF.caption}</p>
          <h2 className="b-display b-h2 mt-3 max-w-2xl">
            {PROOF.shop}, this morning
          </h2>

          <div className="mt-9 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-2">
              {PROOF.stats.map((s) => {
                const earned = s.label === "Redemptions";
                return (
                  <div
                    key={s.label}
                    className={`b-proof-tile ${earned ? "b-proof-tile--coral" : ""}`}
                  >
                    <p className="b-proof-num">{s.value}</p>
                    <p className="b-proof-label">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="b-activity">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                Live at the counter
              </p>
              {PROOF.activity.map((a) => (
                <div key={a.who} className="b-activity-row">
                  <span
                    className="b-activity-dot"
                    style={{
                      background:
                        a.kind === "reward"
                          ? "var(--coral)"
                          : "var(--leaf)",
                    }}
                  />
                  <span className="b-activity-who">{a.who}</span>
                  <span className="b-activity-what">{a.what}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="b-rule" />

        {/* ---- Pricing teaser ---- */}
        <section className="py-14 lg:py-20">
          <p className="b-kicker">Pricing</p>
          <h2 className="b-display b-h2 mt-3 max-w-2xl">
            One price per outlet, per month
          </h2>
          <p className="b-lede mt-4">{PRICING.teaser}</p>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="b-plan" data-featured={p.featured}>
                <p className="b-plan-name">{p.name}</p>
                <p className="b-plan-price">{p.price}</p>
                <p className="b-plan-unit">{p.unit}</p>
                <p className="b-plan-blurb">{p.blurb}</p>
                <span className="b-plan-badge">{p.badge}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Final CTA ---- */}
        <section id="start" className="scroll-mt-6 pb-28 pt-8 lg:pb-32">
          <div className="b-cta">
            <h2 className="b-cta-title">{CTA.title}</h2>
            <div className="b-cta-panel">
              <p className="b-cta-body">{CTA.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <a href="#start" className="b-btn b-btn-primary">
                  {CTA.button}
                </a>
                <p className="b-cta-note">{CTA.reassurance}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConceptNav current={4} />
    </main>
  );
}
