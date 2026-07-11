import type { Metadata } from "next";

import "./kopitiam.css";
import {
  CTA,
  CUSTOMER_STEPS,
  FAST_FACTS,
  PRICING,
  PROOF,
  STAFF_STEPS,
} from "../content";
import { ConceptNav } from "../shared/concept-nav";
import { StampCard } from "./stamp-card";

export const metadata: Metadata = {
  title: "Kopitiam concept · Kembali",
  robots: { index: false, follow: false },
};

export default function ConceptOne() {
  return (
    <main className="cx-root k-page" data-concept="1">
      <span aria-hidden className="k-grain" />

      <div className="k-wrap">
        {/* ---- Hero ---- */}
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="text-center lg:text-left">
            <p className="k-eyebrow">The paper card, made to last</p>
            <h1 className="k-h1 mt-4">
              The stamp card
              <br />
              nobody leaves at home.
            </h1>
            <p className="k-lede mx-auto mt-5 max-w-md lg:mx-0">
              Kembali puts your Coffee Card on your customers&apos; phones. They
              join in 30 seconds from a QR at your counter, and every visit
              brings them closer to a free coffee.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <a href="#start" className="k-btn k-btn-primary">
                {CTA.button}
              </a>
              <a href="#how" className="k-btn k-btn-ghost">
                See how it works
              </a>
            </div>

            <dl className="mx-auto mt-9 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 lg:mx-0">
              {FAST_FACTS.map((f) => (
                <div key={f.label} className="text-left">
                  <dt className="k-serif text-2xl">{f.value}</dt>
                  <dd className="mt-0.5 text-sm text-[var(--ink-soft)]">
                    {f.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* the marble prop: card + rubber stamp, coffee ring behind */}
          <div className="relative flex justify-center">
            <span aria-hidden className="k-stain -right-2 -top-4" />
            <span
              aria-hidden
              className="k-stain"
              style={{ left: "-1rem", bottom: "1rem", width: 92, height: 92 }}
            />
            <div className="relative w-full max-w-sm">
              <StampCard />
            </div>
          </div>
        </section>

        <hr className="k-rule" />

        {/* ---- How it works ---- */}
        <section id="how" className="scroll-mt-8 py-14 lg:py-20">
          <p className="k-eyebrow text-center">How it works</p>
          <h2 className="k-serif mx-auto mt-3 max-w-2xl text-center text-3xl leading-tight sm:text-4xl">
            Easy for your regulars. Easier for your staff.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            <div className="k-receipt" style={{ transform: "rotate(-1deg)" }}>
              <p className="k-card-shop">For your customers</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                From first scan to free coffee.
              </p>
              <div className="mt-3">
                {CUSTOMER_STEPS.map((s) => (
                  <div key={s.step} className="k-receipt-row">
                    <span>{s.step}</span>
                    <span aria-hidden className="lead" />
                    <span className="k-receipt-val">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="k-receipt" style={{ transform: "rotate(1deg)" }}>
              <p className="k-card-shop">For your staff</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                No terminal, no training.
              </p>
              <div className="mt-3">
                {STAFF_STEPS.map((s) => (
                  <div key={s.step} className="k-receipt-row">
                    <span>{s.step}</span>
                    <span aria-hidden className="lead" />
                    <span className="k-receipt-val">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <hr className="k-rule" />

        {/* ---- Proof / stat moment ---- */}
        <section className="py-14 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="k-eyebrow">{PROOF.caption}</p>
              <h2 className="k-serif mt-3 text-3xl leading-tight sm:text-4xl">
                {PROOF.shop}, this morning.
              </h2>
              <p className="k-lede mt-4 max-w-md">
                The numbers a shop owner actually checks over coffee. Who came
                in, who signed up, who earned a reward.
              </p>
              <ul className="mt-6 space-y-2.5">
                {PROOF.activity.map((a) => (
                  <li key={a.who} className="flex items-center gap-2.5 text-sm">
                    <span
                      aria-hidden
                      className="inline-block size-2 rounded-full"
                      style={{
                        background:
                          a.kind === "reward"
                            ? "var(--coral)"
                            : "var(--leaf)",
                      }}
                    />
                    <span className="font-semibold text-[var(--ink)]">
                      {a.who}
                    </span>
                    <span className="text-[var(--ink-soft)]">{a.what}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {PROOF.stats.map((s) => (
                <div key={s.label} className="k-stat">
                  <p
                    className="k-stat-num"
                    data-stat
                    data-earn={s.label === "Redemptions"}
                  >
                    {s.value}
                  </p>
                  <p className="k-stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="k-rule" />

        {/* ---- Pricing teaser ---- */}
        <section className="py-14 lg:py-20">
          <p className="k-eyebrow text-center">Pricing</p>
          <h2 className="k-serif mx-auto mt-3 max-w-2xl text-center text-3xl leading-tight sm:text-4xl">
            One price per outlet, per month.
          </h2>
          <p className="k-lede mx-auto mt-4 max-w-xl text-center">
            {PRICING.teaser}
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="k-plan" data-featured={p.featured}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--ink)]">{p.name}</p>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={
                      p.featured
                        ? { background: "var(--pandan)", color: "#f7f1e2" }
                        : {
                            border: "1px solid var(--hair)",
                            color: "var(--ink-soft)",
                          }
                    }
                  >
                    {p.badge}
                  </span>
                </div>
                <p className="mt-3">
                  <span className="k-plan-price">{p.price}</span>{" "}
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

        {/* ---- Final CTA ---- */}
        <section
          id="start"
          className="scroll-mt-8 pb-24 pt-8 text-center lg:pb-28"
        >
          <div
            className="k-card mx-auto max-w-2xl px-8 py-12"
            style={{ background: "linear-gradient(180deg,#fbf6ea,#f4ecd8)" }}
          >
            <h2 className="k-serif text-3xl leading-tight sm:text-4xl">
              {CTA.title}
            </h2>
            <p className="k-lede mx-auto mt-4 max-w-lg">{CTA.body}</p>
            <div className="mt-7 flex justify-center">
              <a href="#start" className="k-btn k-btn-primary">
                {CTA.button}
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              {CTA.reassurance}
            </p>
          </div>
        </section>
      </div>

      <ConceptNav current={1} />
    </main>
  );
}
