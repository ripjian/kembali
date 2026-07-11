import type { Metadata } from "next";

import "./glass.css";
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
import { WalletPass } from "./wallet-pass";

export const metadata: Metadata = {
  title: "Dark glass concept · Kembali",
  robots: { index: false, follow: false },
};

export default function ConceptTwo() {
  return (
    <main className="cx-root g-page" data-concept="2">
      <div className="g-wrap">
        {/* ---- Hero ---- */}
        <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="text-center lg:text-left">
            <p className="g-eyebrow">{HERO.eyebrow}</p>
            <h1 className="g-h1 mt-4">{HERO.title}</h1>
            <p className="g-lede mx-auto mt-5 max-w-md lg:mx-0">{HERO.sub}</p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <a href="#start" className="g-btn g-btn-primary">
                {CTA.button}
              </a>
              <a href="#how" className="g-btn g-btn-ghost">
                {HERO.secondaryCta}
              </a>
            </div>

            <dl className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-5 lg:mx-0">
              {FAST_FACTS.map((f) => (
                <div key={f.label} className="text-left">
                  <dt className="g-fact-num g-num">{f.value}</dt>
                  <dd className="g-fact-label">{f.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="g-rise flex justify-center">
            <WalletPass />
          </div>
        </section>

        <hr className="g-rule" />

        {/* ---- How it works ---- */}
        <section id="how" className="scroll-mt-8 py-14 lg:py-20">
          <p className="g-eyebrow text-center">How it works</p>
          <h2 className="g-h2 mx-auto mt-3 max-w-2xl text-center">
            One QR to join, one scan to stamp.
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            <div className="g-glass p-6 backdrop-blur-md">
              <p className="g-step-head">For your customers</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                From first scan to free coffee.
              </p>
              <div className="mt-4">
                {CUSTOMER_STEPS.map((s, i) => (
                  <div key={s.step} className="g-step-row">
                    <span aria-hidden className="g-step-idx">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="g-step-text">{s.step}</span>
                    <span className="g-step-tag">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="g-glass p-6 backdrop-blur-md">
              <p className="g-step-head">For your staff</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                No terminal, no training.
              </p>
              <div className="mt-4">
                {STAFF_STEPS.map((s, i) => (
                  <div key={s.step} className="g-step-row">
                    <span aria-hidden className="g-step-idx">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="g-step-text">{s.step}</span>
                    <span className="g-step-tag">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <hr className="g-rule" />

        {/* ---- Proof / stat moment ---- */}
        <section className="py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="g-eyebrow">{PROOF.caption}</p>
              <h2 className="g-h2 mt-3">{PROOF.shop}, right now.</h2>
              <p className="g-lede mt-4 max-w-md">
                The numbers a shop owner checks over morning coffee. Who came in,
                who signed up, who earned a reward.
              </p>
              <ul className="mt-6 space-y-3">
                {PROOF.activity.map((a) => (
                  <li key={a.who} className="flex items-center gap-2.5 text-sm">
                    <span aria-hidden className="g-dot" data-kind={a.kind} />
                    <span
                      className="g-act-who"
                      data-earn={a.kind === "reward"}
                    >
                      {a.who}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {a.what}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {PROOF.stats.map((s) => (
                <div key={s.label} className="g-stat">
                  <p className="g-stat-num" data-earn={s.label === "Redemptions"}>
                    {s.value}
                  </p>
                  <p className="g-stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="g-rule" />

        {/* ---- Pricing teaser ---- */}
        <section className="py-14 lg:py-20">
          <p className="g-eyebrow text-center">Pricing</p>
          <h2 className="g-h2 mx-auto mt-3 max-w-2xl text-center">
            One price per outlet, per month.
          </h2>
          <p className="g-lede mx-auto mt-4 max-w-xl text-center">
            {PRICING.teaser}
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div
                key={p.id}
                className={p.featured ? "g-plan backdrop-blur-md" : "g-plan"}
                data-featured={p.featured}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text)]">{p.name}</p>
                  <span className="g-badge" data-featured={p.featured}>
                    {p.badge}
                  </span>
                </div>
                <p className="mt-4">
                  <span className="g-plan-price">{p.price}</span>{" "}
                  <span className="text-sm text-[var(--text-secondary)]">
                    {p.unit}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Final CTA ---- */}
        <section
          id="start"
          className="scroll-mt-8 pb-24 pt-8 text-center lg:pb-28"
        >
          <div className="g-glass mx-auto max-w-2xl px-8 py-12 backdrop-blur-xl">
            <h2 className="g-h2">{CTA.title}</h2>
            <p className="g-lede mx-auto mt-4 max-w-lg">{CTA.body}</p>
            <div className="mt-7 flex justify-center">
              <a href="#start" className="g-btn g-btn-primary">
                {CTA.button}
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {CTA.reassurance}
            </p>
          </div>
        </section>
      </div>

      <ConceptNav current={2} />
    </main>
  );
}
