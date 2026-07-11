import type { Metadata } from "next";

import "./zine.css";
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
  title: "Editorial zine concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 5 - Editorial zine. A newspaper feature about Kembali: Fraunces
 * masthead + headlines + figures, multi-column lead with a drop cap, thin
 * rules between sections, and halftone imagery built from CSS dot patterns.
 * Server component; the only motion is a CSS reveal-on-load (see zine.css). */

// The printed loyalty card fills one stamp per visit; show Aisyah's card at 7.
const STAMPS_EARNED = 7;
const STAMP_TOTAL = 10;
const STAMP_SLOTS = Array.from({ length: STAMP_TOTAL }, (_, i) => i + 1);

export default function ConceptFive() {
  return (
    <main className="cx-root z-page" data-concept="5">
      <div className="z-wrap">
        {/* ---------- Masthead ---------- */}
        <header className="z-masthead z-rise">
          <div className="z-masthead-top">
            <span className="z-mono">No. 01 · Kuala Lumpur</span>
            <span className="z-mono">Est. 2026</span>
          </div>
          <h1 className="z-wordmark">
            Kembali<span className="z-dot">.</span>
          </h1>
          <div className="z-dateline">
            <span className="z-mono">Loyalty, in print</span>
            <span className="z-dateline-mid">
              A field guide for shop owners
            </span>
            <span className="z-mono">Free to read</span>
          </div>
        </header>

        {/* ---------- Hero / lead ---------- */}
        <section className="z-hero">
          <p className="z-kicker z-rise" style={{ textAlign: "center" }}>
            {HERO.eyebrow}
          </p>
          <h2 className="z-headline z-rise" style={{ animationDelay: "60ms" }}>
            {HERO.title}
          </h2>

          <div className="z-hero-body">
            <div className="z-rise" style={{ animationDelay: "120ms" }}>
              <p className="z-standfirst">{HERO.sub}</p>
              <div className="z-actions">
                <a href="#start" className="z-btn z-btn-primary">
                  {CTA.button}
                </a>
                <a href="#how" className="z-btn z-btn-ghost">
                  {HERO.secondaryCta}
                </a>
              </div>
            </div>

            {/* halftone plate: a printed photograph of a coffee, CSS dots */}
            <figure className="z-plate z-rise" style={{ animationDelay: "180ms" }}>
              <div className="z-plate-frame">
                <div className="z-cup" aria-hidden="true">
                  <span className="z-steam" />
                </div>
              </div>
              <figcaption className="z-plate-caption">
                <span className="z-mono z-fig">Fig. 1</span>
                <span className="z-cap-text">
                  A stamp for every cup, printed in coral halftone.
                </span>
              </figcaption>
            </figure>
          </div>

          {/* printed stamp-card strip */}
          <div className="z-cardstrip z-rise" style={{ animationDelay: "220ms" }}>
            <div className="z-cardstrip-label">
              <p className="h">The Coffee Card</p>
              <p className="s">One stamp per visit, free coffee on visit ten.</p>
            </div>
            <div
              className="z-stamps"
              role="img"
              aria-label={`Stamp card, ${STAMPS_EARNED} of ${STAMP_TOTAL} stamps collected`}
            >
              {STAMP_SLOTS.map((n) => (
                <span
                  key={n}
                  className="z-slot"
                  data-filled={n <= STAMPS_EARNED}
                  data-reward={n === STAMP_TOTAL}
                >
                  <span className="z-slot-num" aria-hidden="true">
                    {n === STAMP_TOTAL ? "★" : n}
                  </span>
                </span>
              ))}
            </div>
            <p className="z-cardstrip-prog">
              <b>{STAMPS_EARNED}</b> <span>of {STAMP_TOTAL}</span>
            </p>
          </div>

          {/* fast-facts stat strip */}
          <dl className="z-facts z-rise" style={{ animationDelay: "260ms" }}>
            {FAST_FACTS.map((f) => (
              <div key={f.label} className="z-fact">
                <dt className="z-fact-num">{f.value}</dt>
                <dd className="z-fact-label">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how" className="z-section" style={{ scrollMarginTop: "1rem" }}>
          <div className="z-section-head">
            <h2 className="z-section-title">How it works</h2>
            <span className="z-mono">Section II · The counter</span>
          </div>

          <div className="z-how">
            {/* customer steps as the main numbered column */}
            <ol className="z-steps">
              {CUSTOMER_STEPS.map((s) => (
                <li key={s.step} className="z-step">
                  <span className="z-step-text" style={{ gridColumn: 2 }}>
                    {s.step}
                  </span>
                  <span className="z-step-meta">{s.detail}</span>
                </li>
              ))}
            </ol>

            {/* staff steps as a boxed sidebar */}
            <aside className="z-sidebar">
              <span className="z-sidebar-kicker">For your staff</span>
              <h3>No terminal, no training</h3>
              <p className="z-sidebar-sub">Any phone at the counter works.</p>
              <ol>
                {STAFF_STEPS.map((s) => (
                  <li key={s.step}>
                    <span>{s.step}</span>
                    <span className="m">{s.detail}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        {/* ---------- Proof ---------- */}
        <section className="z-section">
          <div className="z-section-head">
            <h2 className="z-section-title">{PROOF.shop}, today</h2>
            <span className="z-mono">Section III · Dispatch</span>
          </div>
          <p className="z-proof-caption">{PROOF.caption}.</p>

          <div className="z-figures">
            {PROOF.stats.map((s) => (
              <div
                key={s.label}
                className="z-figure"
                data-earn={s.label === "Redemptions"}
              >
                <p className="z-figure-num">{s.value}</p>
                <p className="z-figure-label">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="z-activity">
            {PROOF.activity.map((a) => (
              <li key={a.who}>
                <span
                  className="dot"
                  aria-hidden="true"
                  style={{
                    background:
                      a.kind === "reward" ? "var(--coral)" : "var(--leaf)",
                  }}
                />
                <span className="who">{a.who}</span>
                <span className="what">{a.what}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Pricing rate card ---------- */}
        <section className="z-section">
          <div className="z-section-head">
            <h2 className="z-section-title">The rate card</h2>
            <span className="z-mono">Section IV · Per outlet, per month</span>
          </div>
          <p className="z-teaser">{PRICING.teaser}</p>

          <div className="z-ratecard">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="z-rate" data-featured={p.featured}>
                <div className="z-rate-name">
                  <span className="n">{p.name}</span>
                  <span className="z-rate-badge">{p.badge}</span>
                </div>
                <p className="z-rate-blurb">{p.blurb}</p>
                <p className="z-rate-price">
                  <b>{p.price}</b>
                  <span className="u">{p.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Closing notice ---------- */}
        <section id="start" style={{ scrollMarginTop: "1rem" }}>
          <div className="z-notice">
            <span className="z-mono">Founding notice</span>
            <h2>{CTA.title}</h2>
            <p>{CTA.body}</p>
            <div className="z-actions">
              <a href="#start" className="z-btn z-btn-primary">
                {CTA.button}
              </a>
            </div>
            <p className="z-reassure">{CTA.reassurance}</p>
          </div>

          <p className="z-colophon z-mono">
            Kembali · Set in Fraunces &amp; Jakarta · Printed on the web
          </p>
        </section>
      </div>

      <ConceptNav current={5} />
    </main>
  );
}
