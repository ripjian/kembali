import type { Metadata } from "next";

import "./bento.css";
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
import { ChartTile, PointsTile, RewardFlipTile, StampTile } from "./tiles";

export const metadata: Metadata = {
  title: "Bento tour concept · Kembali",
  robots: { index: false, follow: false },
};

/* Concept 8 - Bento product tour. The grid IS the hero: each tile is a live
 * micro-demo of a real module (stamping, points, rewards, reports). Static
 * tiles carry the headline, QR, facts and brand legend. bento.css owns the
 * grid + tile styling; tiles.tsx owns the interactions. */

function QrMark() {
  // Decorative QR stand-in: three finder squares + a fixed module pattern.
  const mods: [number, number][] = [
    [3, 0], [5, 0], [0, 3], [2, 3], [4, 3], [6, 3], [3, 4], [5, 4],
    [0, 5], [3, 5], [6, 5], [4, 6], [3, 6],
  ];
  const finders: [number, number][] = [
    [0, 0],
    [4, 0],
    [0, 4],
  ];
  return (
    <svg viewBox="0 0 7 7" role="img" aria-label="QR code">
      <g fill="#0f3d32">
        {finders.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="3" height="3" rx="0.4" />
            <rect x={x + 0.7} y={y + 0.7} width="1.6" height="1.6" rx="0.2" fill="#fffdf7" />
            <rect x={x + 1.1} y={y + 1.1} width="0.8" height="0.8" rx="0.1" fill="#0f3d32" />
          </g>
        ))}
        {mods.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="0.86" height="0.86" rx="0.15" />
        ))}
      </g>
    </svg>
  );
}

export default function ConceptEight() {
  return (
    <main className="cx-root b-page" data-concept="8">
      <div className="b-wrap">
        {/* ---- Bento hero ---- */}
        <div className="b-grid">
          {/* headline */}
          <section className="b-tile b-tile-pandan b-2x2">
            <span className="b-tag">Kembali · Product tour</span>
            <h1 className="b-hero-title">{HERO.title}</h1>
            <p className="b-hero-sub">{HERO.sub}</p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a href="#start" className="b-btn b-btn-cream">
                {CTA.button}
              </a>
              <a href="#how" className="b-btn b-btn-primary">
                See how it works
              </a>
            </div>
          </section>

          <StampTile />
          <PointsTile />
          <RewardFlipTile />
          <ChartTile />

          {/* QR tile */}
          <section className="b-tile b-1x1">
            <span className="b-tag">Join</span>
            <div className="b-qr">
              <QrMark />
              <p className="b-qr-text">
                <b>Scan to join.</b>
                <br />
                No app, ready in 30 seconds.
              </p>
            </div>
          </section>

          {/* brand legend */}
          <section className="b-tile b-tile-alt b-2x1">
            <span className="b-tag">The colors</span>
            <div className="b-legend">
              <div className="b-legend-item">
                <span
                  className="b-swatch"
                  style={{ background: "var(--accent)" }}
                  aria-hidden
                />
                <span>
                  <b>Coral</b> is earned
                </span>
              </div>
              <div className="b-legend-item">
                <span
                  className="b-swatch"
                  style={{ background: "var(--primary)" }}
                  aria-hidden
                />
                <span>
                  <b>Pandan</b> is action
                </span>
              </div>
              <div className="b-legend-item">
                <span
                  className="b-swatch"
                  style={{ background: "var(--leaf)" }}
                  aria-hidden
                />
                <span>
                  <b>Leaf</b> is progress
                </span>
              </div>
            </div>
          </section>

          {/* fast facts */}
          <section className="b-tile b-2x1">
            <span className="b-tag">At a glance</span>
            <div className="b-facts">
              {FAST_FACTS.map((f) => (
                <div key={f.label}>
                  <p className="b-fact-val">{f.value}</p>
                  <p className="b-fact-label">{f.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- How it works ---- */}
        <section id="how" className="b-section scroll-mt-6">
          <p className="b-eyebrow">How it works</p>
          <h2 className="b-h2 mt-2">Easy for customers, easier for staff.</h2>
          <div className="b-steps mt-6">
            <div>
              {CUSTOMER_STEPS.map((s, i) => (
                <div key={s.step} className="b-step-row">
                  <span className="b-step-idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="b-step-text">{s.step}</span>
                  <span className="b-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
            <div>
              {STAFF_STEPS.map((s, i) => (
                <div key={s.step} className="b-step-row">
                  <span className="b-step-idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="b-step-text">{s.step}</span>
                  <span className="b-step-tag">{s.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Proof ---- */}
        <section className="b-section">
          <p className="b-eyebrow">{PROOF.caption}</p>
          <h2 className="b-h2 mt-2">{PROOF.shop}, this morning.</h2>
          <div className="b-stat-grid mt-6">
            {PROOF.stats.map((s) => (
              <div key={s.label} className="b-tile b-1x1">
                <p
                  className="b-stat-num"
                  data-stat
                  data-earn={s.label === "Redemptions"}
                >
                  {s.value}
                </p>
                <p className="b-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="b-activity">
            {PROOF.activity.map((a) => (
              <span key={a.who} className="b-act">
                <span
                  className="b-act-dot"
                  style={{
                    background: a.kind === "reward" ? "var(--accent)" : "var(--leaf)",
                  }}
                  aria-hidden
                />
                <b>{a.who}</b>
                <span>{a.what}</span>
              </span>
            ))}
          </div>
        </section>

        {/* ---- Pricing ---- */}
        <section className="b-section">
          <p className="b-eyebrow">Pricing</p>
          <h2 className="b-h2 mt-2">One price per outlet, per month.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
            {PRICING.teaser}
          </p>
          <div className="b-plans mt-6">
            {PRICING.plans.map((p) => (
              <div key={p.id} className="b-plan" data-featured={p.featured}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-text">{p.name}</p>
                  <span className="b-plan-badge">{p.badge}</span>
                </div>
                <p className="mt-3">
                  <span className="b-plan-price">{p.price}</span>{" "}
                  <span className="text-sm text-text-muted">{p.unit}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {p.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section id="start" className="b-cta scroll-mt-6">
          <h2>{CTA.title}</h2>
          <p>{CTA.body}</p>
          <div className="mt-6 flex justify-center">
            <a href="#start" className="b-btn b-btn-cream">
              {CTA.button}
            </a>
          </div>
          <p className="b-cta-reassure">{CTA.reassurance}</p>
        </section>
      </div>

      <ConceptNav current={8} />
    </main>
  );
}
