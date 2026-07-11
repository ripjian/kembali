import type { Metadata } from "next";

import "./stories.css";
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
  title: "Shop stories concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 6 - Shop stories, photography-forward.
 * PLACEHOLDER IMAGERY: the .p-photo panels are CSS duotone stand-ins, not real
 * photos. Production replaces each with licensed or own photography of real
 * Malaysian shops, served from /public (never hotlinked). See stories.css. */

// Maps each customer step to the placeholder scene it should eventually show.
const STORY_SCENES = ["is-phone", "is-counter", "is-hands", "is-morning"] as const;

export default function ConceptSix() {
  return (
    <main className="cx-root p-page" data-concept="6">
      {/* ---- Hero: full-bleed placeholder photo, oversized type over it ---- */}
      <section className="p-photo is-morning p-hero">
        <span className="p-ph-tag">Placeholder photo</span>
        <div className="p-hero-inner">
          <p className="p-kicker" style={{ color: "var(--photo-ink-soft)" }}>
            Kembali · Shop stories
          </p>
          <h1
            className="p-display mt-3 text-[var(--photo-ink)]"
            style={{ fontSize: "clamp(2.6rem, 8vw, 5.2rem)" }}
          >
            The regulars
            <br />
            always come back.
          </h1>
          <p className="p-lede mt-5 max-w-xl text-[var(--photo-ink-soft)]">
            {HERO.sub}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#start" className="p-btn p-btn-primary">
              {CTA.button}
            </a>
            <a href="#stories" className="p-btn p-btn-light">
              See how it works
            </a>
          </div>

          <dl className="p-overlay-stats mt-9">
            {FAST_FACTS.map((f) => (
              <div key={f.label} className="p-overlay-stat">
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <b>{f.value}</b>
                  <span>{f.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="p-wrap">
        <p className="p-note mt-4 text-center">
          Imagery on this page is placeholder. Production uses licensed or own
          shop photography.
        </p>

        {/* ---- Shop stories: the journey told scene by scene ---- */}
        <section id="stories" className="scroll-mt-6 py-14 lg:py-20">
          <p className="p-kicker text-[var(--coral-deep)]">The story</p>
          <h2 className="p-serif mt-3 max-w-2xl text-3xl leading-tight sm:text-4xl text-[var(--pandan)]">
            From the first scan to a free coffee, on their own phone.
          </h2>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CUSTOMER_STEPS.map((s, i) => (
              <article
                key={s.step}
                className={`p-photo p-story ${STORY_SCENES[i]}`}
              >
                <span className="p-ph-tag">Placeholder</span>
                <p className="p-story-step">Step {i + 1}</p>
                <p className="p-story-cap">{s.step}</p>
                <p className="p-story-detail">{s.detail}</p>
              </article>
            ))}
          </div>

          {/* staff counterpart, on paper */}
          <div className="mt-6 rounded-2xl border border-[var(--hair)] bg-[var(--surface)] p-6">
            <p className="p-kicker text-[var(--leaf-deep)]">Behind the counter</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {STAFF_STEPS.map((s, i) => (
                <div key={s.step} className="flex items-baseline gap-2.5">
                  <span className="font-[var(--font-space)] text-sm text-[var(--ink-soft)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-[var(--ink)]">
                    {s.step}
                    <span className="ml-1.5 text-[var(--ink-soft)]">
                      · {s.detail}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ---- Proof band: stats laid over a placeholder photo ---- */}
      <section className="p-photo is-counter py-14 lg:py-20">
        <span className="p-ph-tag">Placeholder photo</span>
        <div className="p-wrap">
          <p className="p-kicker text-[var(--photo-ink-soft)]">
            {PROOF.caption}
          </p>
          <h2 className="p-serif mt-3 text-3xl leading-tight text-[var(--photo-ink)] sm:text-4xl">
            {PROOF.shop}, this morning.
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROOF.stats.map((s) => (
              <div key={s.label} className="p-proof-chip">
                <p
                  className="p-proof-num"
                  data-stat
                  data-earn={s.label === "Redemptions"}
                >
                  {s.value}
                </p>
                <p className="p-proof-label">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 flex flex-col gap-2.5">
            {PROOF.activity.map((a) => (
              <li
                key={a.who}
                className="flex items-center gap-2.5 text-sm text-[var(--photo-ink-soft)]"
              >
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{
                    background:
                      a.kind === "reward" ? "#f4a98f" : "var(--leaf)",
                  }}
                />
                <span className="font-semibold text-[var(--photo-ink)]">
                  {a.who}
                </span>
                <span>{a.what}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="p-wrap">
        {/* ---- Pricing teaser (paper) ---- */}
        <section className="py-14 lg:py-20">
          <p className="p-kicker text-[var(--coral-deep)]">Pricing</p>
          <h2 className="p-serif mt-3 max-w-2xl text-3xl leading-tight text-[var(--pandan)] sm:text-4xl">
            One price per outlet, per month.
          </h2>
          <p className="p-lede mt-4 max-w-xl text-[var(--ink-soft)]">
            {PRICING.teaser}
          </p>

          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="p-plan" data-featured={p.featured}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--ink)]">{p.name}</p>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={
                      p.featured
                        ? { background: "var(--pandan)", color: "#fffdf7" }
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
                  <span className="p-plan-price">{p.price}</span>{" "}
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
      </div>

      {/* ---- Final CTA over a placeholder photo ---- */}
      <section
        id="start"
        className="p-photo is-morning scroll-mt-6 py-20 text-center lg:py-28"
      >
        <span className="p-ph-tag">Placeholder photo</span>
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="p-serif text-3xl leading-tight text-[var(--photo-ink)] sm:text-4xl">
            {CTA.title}
          </h2>
          <p className="p-lede mx-auto mt-4 max-w-lg text-[var(--photo-ink-soft)]">
            {CTA.body}
          </p>
          <div className="mt-7 flex justify-center">
            <a href="#start" className="p-btn p-btn-primary">
              {CTA.button}
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--photo-ink-soft)]">
            {CTA.reassurance}
          </p>
        </div>
      </section>

      <ConceptNav current={6} />
    </main>
  );
}
