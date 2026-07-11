import type { Metadata } from "next";

import "./scrollytelling.css";
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
  title: "Scrollytelling concept · Kembali",
  robots: { index: false, follow: false },
};

/* Four journey beats. Copy comes from the canonical CUSTOMER_STEPS; the visual
 * for each is a phone screen. Beat four is the earned reward, so it carries the
 * coral role. Numbers are only the ones in content.ts. */
const BEATS = [0, 1, 2, 3] as const;

/* Kembali's return-loop mark in coral ink - an earned stamp. */
function Loop({ pop = false }: { pop?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={`sc-loop${pop ? " sc-loop-pop" : ""}`}
      aria-hidden
    >
      <path
        d="M64 40 A24 24 0 1 1 57 23"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <polygon points="62.7,28.7 60.5,19.5 53.5,26.5" fill="currentColor" />
      <circle cx="40" cy="40" r="9" fill="currentColor" />
    </svg>
  );
}

/* A decorative, deterministic QR-like field (aria-hidden). Three finder blocks
 * plus a fixed module pattern so it reads as a scannable code. */
function Qr() {
  const size = 11;
  const cell = 8;
  const gap = 1;
  const unit = cell + gap;
  const isFinder = (x: number, y: number) => {
    const box = (bx: number, by: number) =>
      x >= bx && x < bx + 3 && y >= by && y < by + 3;
    return box(0, 0) || box(size - 3, 0) || box(0, size - 3);
  };
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = isFinder(x, y) ? true : (x * 7 + y * 5 + x * y) % 3 === 0;
      if (on) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * unit}
            y={y * unit}
            width={cell}
            height={cell}
            rx={1.5}
          />,
        );
      }
    }
  }
  const dim = size * unit - gap;
  return (
    <svg className="sc-qr" viewBox={`0 0 ${dim} ${dim}`} aria-hidden>
      {rects}
    </svg>
  );
}

/* One phone screen per beat. Rendered both inside the sticky stage (stacked and
 * crossfaded on scroll) and, as a static fallback, inside each chapter. */
function Scene({ beat }: { beat: number }) {
  return (
    <div className="sc-scene" data-beat={beat + 1}>
      <div className="sc-phone">
        <div className="sc-screen">
          <span className="sc-notch" aria-hidden />
          <p className="sc-screen-shop">{PROOF.shop}</p>
          <p className="sc-screen-sub">Coffee Card · buy 9, get 1 free</p>

          {beat === 0 && (
            <>
              <Qr />
              <span className="sc-scanline" aria-hidden />
              <p className="sc-screen-cap">
                Point the camera. <b>Join in 30 seconds.</b>
              </p>
            </>
          )}

          {beat === 1 && (
            <>
              <div className="sc-grid" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className="sc-slot"
                    data-reward={i === 9 ? true : undefined}
                  >
                    {i === 9 ? "★" : i + 1}
                  </span>
                ))}
              </div>
              <p className="sc-screen-cap">
                Their card, <b>on their phone.</b>
              </p>
            </>
          )}

          {beat === 2 && (
            <>
              <div className="sc-grid" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => {
                  const filled = i < 7;
                  const reward = i === 9;
                  return (
                    <span
                      key={i}
                      className="sc-slot"
                      data-filled={filled ? true : undefined}
                      data-reward={reward ? true : undefined}
                    >
                      {filled ? (
                        <Loop pop={i === 6} />
                      ) : reward ? (
                        "★"
                      ) : (
                        i + 1
                      )}
                    </span>
                  );
                })}
              </div>
              <p className="sc-plus" aria-hidden>
                +1
              </p>
              <div className="sc-progress" aria-hidden>
                <i />
              </div>
              <p className="sc-screen-cap">
                Stamp 7 of 10. <b>Three visits to go.</b>
              </p>
            </>
          )}

          {beat === 3 && (
            <>
              <div className="sc-coupon">
                <p className="sc-coupon-eyebrow">Reward ready</p>
                <p className="sc-coupon-reward">Free coffee</p>
                <p className="sc-coupon-code">KMB-7F2A-9C4D</p>
              </div>
              <p className="sc-screen-cap">
                Show at the counter. <b>Earned on visit ten.</b>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConceptThree() {
  return (
    <main className="cx-root sc-page" data-concept="3">
      <div className="sc-wrap">
        {/* ---------------------------------------------------------- Hero */}
        <section className="sc-hero">
          <p className="sc-eyebrow sc-anim sc-anim-d1">{HERO.eyebrow}</p>
          <h1 className="sc-kinetic sc-h1">
            <span className="sc-hero-line sc-anim sc-anim-d2">
              Loyalty cards
            </span>
            <span className="sc-hero-line sc-anim sc-anim-d3">
              your customers
            </span>
            <span className="sc-hero-line sc-anim sc-anim-d4">
              <span className="accent">never lose</span>
            </span>
          </h1>
          <p className="sc-lede sc-anim sc-anim-d5 mx-auto mt-6 max-w-xl">
            {HERO.sub}
          </p>

          <div className="sc-anim sc-anim-d5 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#start" className="sc-btn sc-btn-primary">
              {CTA.button}
            </a>
            <a href="#journey" className="sc-btn sc-btn-ghost">
              {HERO.secondaryCta}
            </a>
          </div>

          <dl className="sc-facts">
            {FAST_FACTS.map((f) => (
              <div key={f.label} className="sc-fact sc-reveal">
                <dt className="sc-fact-v">{f.value}</dt>
                <dd className="sc-fact-l">{f.label}</dd>
              </div>
            ))}
          </dl>

          <p className="sc-cue" aria-hidden>
            Scroll the journey
            <span />
          </p>
        </section>

        {/* ------------------------------------------------------- Journey */}
        <section id="journey" className="sc-journey scroll-mt-4">
          <div className="sc-journey-head">
            <p className="sc-eyebrow sc-reveal">How it works</p>
            <h2 className="sc-h2 sc-reveal mt-3">
              From a scan to a free coffee, one visit at a time.
            </h2>
            <p className="sc-lede sc-reveal mx-auto mt-4 max-w-lg">
              Scroll to follow a customer through their first reward. Everything
              below stays readable if you turn motion off.
            </p>
          </div>

          <div className="sc-journey-grid">
            {/* sticky phone stage - enhanced desktop only, decorative */}
            <div className="sc-stage" aria-hidden>
              <div className="sc-phone-stack">
                {BEATS.map((b) => (
                  <Scene key={b} beat={b} />
                ))}
              </div>
            </div>

            {/* the four beats: readable static sections; each carries its own
                figure that the sticky stage hides once it takes over */}
            <div className="sc-chapters">
              {CUSTOMER_STEPS.map((s, i) => {
                const earned = i === 3;
                return (
                  <article key={s.step} className="sc-chapter">
                    <div className="sc-reveal">
                      <p className="sc-beat-no">{i + 1}</p>
                      <h3 className="sc-beat-title">{s.step}</h3>
                      <p className="sc-beat-detail" data-earn={earned}>
                        <span className="dot" aria-hidden />
                        {s.detail}
                      </p>
                    </div>
                    <div className="sc-chapter-figure sc-reveal">
                      <Scene beat={i} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* staff counterpart */}
          <div className="sc-staff sc-reveal">
            <h3>The same three seconds for your staff</h3>
            <p className="sub">No terminal, no training. Any phone works.</p>
            <div className="sc-staff-steps">
              {STAFF_STEPS.map((s, i) => (
                <div key={s.step} className="sc-staff-step">
                  <p className="n">Step {i + 1}</p>
                  <p className="t">{s.step}</p>
                  <p className="d">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- Proof */}
        <section className="sc-section">
          <p className="sc-eyebrow sc-reveal">{PROOF.caption}</p>
          <h2 className="sc-h2 sc-reveal mt-3 max-w-2xl">
            {PROOF.shop}, this morning.
          </h2>

          <div className="sc-stats">
            {PROOF.stats.map((s) => (
              <div key={s.label} className="sc-stat sc-reveal">
                <p
                  className="sc-stat-v"
                  data-earn={s.label === "Redemptions" ? true : undefined}
                >
                  {s.value}
                </p>
                <p className="sc-stat-l">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="sc-activity">
            {PROOF.activity.map((a) => (
              <li key={a.who} className="sc-reveal">
                <span
                  className="dot"
                  aria-hidden
                  style={{
                    background:
                      a.kind === "reward"
                        ? "var(--coral)"
                        : "var(--leaf)",
                  }}
                />
                <b>{a.who}</b>
                <span className="w">{a.what}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------- Pricing */}
        <section className="sc-section">
          <p className="sc-eyebrow sc-reveal">Pricing</p>
          <h2 className="sc-h2 sc-reveal mt-3 max-w-2xl">
            One price per outlet, per month.
          </h2>
          <p className="sc-lede sc-reveal mt-4 max-w-xl">{PRICING.teaser}</p>

          <div className="sc-plans">
            {PRICING.plans.map((p) => (
              <div
                key={p.id}
                className="sc-plan sc-reveal"
                data-featured={p.featured}
              >
                <div className="sc-plan-head">
                  <p className="sc-plan-name">{p.name}</p>
                  <span className="sc-plan-badge">{p.badge}</span>
                </div>
                <p className="mt-3">
                  <span className="sc-plan-price">{p.price}</span>{" "}
                  <span className="sc-plan-unit">{p.unit}</span>
                </p>
                <p className="sc-plan-blurb">{p.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- Final CTA */}
        <section id="start" className="sc-section scroll-mt-4 pb-28">
          <div className="sc-cta sc-reveal">
            <h2>{CTA.title}</h2>
            <p>{CTA.body}</p>
            <div className="mt-7 flex justify-center">
              <a href="#start" className="sc-btn sc-btn-primary">
                {CTA.button}
              </a>
            </div>
            <p className="reassure">{CTA.reassurance}</p>
          </div>
        </section>
      </div>

      <ConceptNav current={3} />
    </main>
  );
}
