"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

import { BrandAppDemo } from "./brand-app-demo";
import { DemoCard } from "./demo-card";

/* TEMPORARY: the design lab. Two switchers (font pairing, palette)
 * re-theme real components by overriding the .sc-root tokens inside the
 * .dl-scope wrapper, so what the founder sees is the actual system, not
 * a mockup. Delete with the page once a combo is chosen. */

interface FontPairing {
  id: string;
  label: string;
  note: string;
  vars: CSSProperties;
}

const FONTS: FontPairing[] = [
  {
    id: "current",
    label: "Fraunces + Jakarta",
    note: "What is live today. IBM Plex Mono for the technical voice.",
    vars: {},
  },
  {
    id: "urbanist",
    label: "Urbanist + Open Sans",
    note: "Geometric display over a neutral body. Modern, less editorial.",
    vars: {
      "--serif": "var(--font-urbanist), system-ui, sans-serif",
      "--sans": "var(--font-open-sans), system-ui, sans-serif",
    } as CSSProperties,
  },
  {
    id: "crimson",
    label: "Crimson Pro + VT323",
    note: "Serif for display and body, pixel terminal type as the ledger voice.",
    vars: {
      "--serif": "var(--font-crimson), serif",
      "--sans": "var(--font-crimson), serif",
      "--mono": "var(--font-vt323), monospace",
    } as CSSProperties,
  },
  {
    id: "zain",
    label: "Zain + Nunito",
    note: "Rounded and friendly. The softest option.",
    vars: {
      "--serif": "var(--font-zain), system-ui, sans-serif",
      "--sans": "var(--font-nunito), system-ui, sans-serif",
    } as CSSProperties,
  },
  {
    id: "playfair",
    label: "Playfair + Source Sans",
    note: "High contrast didone display. The most luxurious of the set.",
    vars: {
      "--serif": "var(--font-playfair), serif",
      "--sans": "var(--font-source-sans), system-ui, sans-serif",
    } as CSSProperties,
  },
  {
    id: "space",
    label: "Space Grotesk + Inter",
    note: "Techy grotesque display, neutral body, Space Mono as the ledger voice.",
    vars: {
      "--serif": "var(--font-space-grotesk), system-ui, sans-serif",
      "--sans": "var(--font-inter), system-ui, sans-serif",
      "--mono": "var(--font-space-mono), monospace",
    } as CSSProperties,
  },
  {
    id: "dmserif",
    label: "DM Serif + DM Sans",
    note: "One family, two voices. Warm serif display over a clean geometric body.",
    vars: {
      "--serif": "var(--font-dm-serif), serif",
      "--sans": "var(--font-dm-sans), system-ui, sans-serif",
    } as CSSProperties,
  },
  {
    id: "bricolage",
    label: "Bricolage + Figtree",
    note: "Characterful grotesque with optical sizing, friendly body.",
    vars: {
      "--serif": "var(--font-bricolage), system-ui, sans-serif",
      "--sans": "var(--font-figtree), system-ui, sans-serif",
    } as CSSProperties,
  },
];

interface Palette {
  id: string;
  label: string;
  note: string;
  swatches: [string, string, string];
  vars: CSSProperties;
}

/* Role structure stays fixed in every palette: primary = action + dark
 * canvas, accent = what you earn (stamps, rewards), progress = fills,
 * paper + ink for light sections. The winner gets run through the
 * @kembali/core contrast utilities before it touches BRAND.md. */
const PALETTES: Palette[] = [
  {
    id: "pandan",
    label: "Pandan",
    note: "What is live today. Deep green, coral earnings, warm sand.",
    swatches: ["#0F3D32", "#E0684B", "#F6F1E3"],
    vars: {},
  },
  {
    id: "teh",
    label: "Teh tarik",
    note: "Caramel and espresso, burnt tangerine earnings. Warmest option.",
    swatches: ["#6B4423", "#D95D39", "#F8F1E5"],
    vars: {
      "--pandan": "#6B4423",
      "--pandan-deep": "#4A2E16",
      "--pandan-night": "#33200F",
      "--coral": "#D95D39",
      "--coral-deep": "#A33E1F",
      "--leaf": "#8A9B4F",
      "--sand": "#F8F1E5",
      "--sand-dim": "#EFE5D2",
      "--ink": "#2B2118",
    } as CSSProperties,
  },
  {
    id: "selat",
    label: "Selat",
    note: "Straits dusk: deep indigo, sunset coral earnings, cool paper.",
    swatches: ["#1F3A5F", "#E76F51", "#F1F1E8"],
    vars: {
      "--pandan": "#1F3A5F",
      "--pandan-deep": "#162944",
      "--pandan-night": "#0E1C30",
      "--coral": "#E76F51",
      "--coral-deep": "#B04A2F",
      "--leaf": "#5C9E77",
      "--sand": "#F1F1E8",
      "--sand-dim": "#E6E5D6",
      "--ink": "#17202B",
    } as CSSProperties,
  },
  {
    id: "bunga",
    label: "Bunga",
    note: "Plum and marigold. The boldest departure, dessert-shop energy.",
    swatches: ["#522E4F", "#E39A2D", "#F8F0E6"],
    vars: {
      "--pandan": "#522E4F",
      "--pandan-deep": "#3A1F38",
      "--pandan-night": "#271426",
      "--coral": "#E39A2D",
      "--coral-deep": "#9C6812",
      "--leaf": "#7FA96B",
      "--sand": "#F8F0E6",
      "--sand-dim": "#EFE3D3",
      "--ink": "#2A1E28",
    } as CSSProperties,
  },
  {
    id: "hibiscus",
    label: "Hibiscus",
    note: "Keeps the forest green, swaps earnings to crimson. Rubber-stamp red.",
    swatches: ["#1C4632", "#C4384E", "#F7F2E7"],
    vars: {
      "--pandan": "#1C4632",
      "--pandan-deep": "#133527",
      "--pandan-night": "#0A241A",
      "--coral": "#C4384E",
      "--coral-deep": "#8E2438",
      "--leaf": "#86A96F",
      "--sand": "#F7F2E7",
      "--sand-dim": "#EEE7D3",
      "--ink": "#1B2A20",
    } as CSSProperties,
  },
  {
    id: "songket",
    label: "Songket",
    note: "Gold thread on midnight indigo. The most premium read.",
    swatches: ["#202A52", "#C9A227", "#F6F1E4"],
    vars: {
      "--pandan": "#202A52",
      "--pandan-deep": "#161D3B",
      "--pandan-night": "#0D1226",
      "--coral": "#C9A227",
      "--coral-deep": "#8F721B",
      "--leaf": "#7FA98C",
      "--sand": "#F6F1E4",
      "--sand-dim": "#EDE6CE",
      "--ink": "#1B2136",
    } as CSSProperties,
  },
  {
    id: "orkid",
    label: "Orkid",
    note: "Deep teal with orchid violet earnings. Calm with a surprise.",
    swatches: ["#175149", "#9C5BC0", "#F5F1EA"],
    vars: {
      "--pandan": "#175149",
      "--pandan-deep": "#0F3A34",
      "--pandan-night": "#082420",
      "--coral": "#9C5BC0",
      "--coral-deep": "#6E3A8C",
      "--leaf": "#8FB56E",
      "--sand": "#F5F1EA",
      "--sand-dim": "#EAE4D8",
      "--ink": "#16211E",
    } as CSSProperties,
  },
  {
    id: "monsun",
    label: "Monsun",
    note: "Storm slate with electric lime earnings. The wild card.",
    swatches: ["#37414F", "#A8C93A", "#F2F1EC"],
    vars: {
      "--pandan": "#37414F",
      "--pandan-deep": "#262E39",
      "--pandan-night": "#161B22",
      "--coral": "#A8C93A",
      "--coral-deep": "#66771D",
      "--leaf": "#6FA3B8",
      "--sand": "#F2F1EC",
      "--sand-dim": "#E5E4DB",
      "--ink": "#1A2027",
    } as CSSProperties,
  },
];

export function DesignLab({ fontVars }: { fontVars: string }) {
  const [fontId, setFontId] = useState("current");
  const [paletteId, setPaletteId] = useState("pandan");

  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0]!;
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0]!;
  const scopeVars = { ...palette.vars, ...font.vars };

  return (
    <>
      <section className="page-hero" data-theme="dark">
        <div className="wrap">
          <p className="eyebrow reveal">Temporary &middot; design lab</p>
          <h1 className="hero-title page-title" id="heroTitle">
            <span className="line"><span className="w">Try</span> <span className="w">the</span> <span className="w accent-w">combinations.</span></span>
          </h1>
          <p className="hero-sub">Pick a font pairing and a palette. Everything below is the
          real system re-themed live, not a mockup. Reply with the two names you like.</p>
        </div>
      </section>

      <div className="dl-controls" data-theme="light">
        <div className="wrap dl-controls-inner">
          <div className="dl-group">
            <p className="dl-group-label mono">Fonts</p>
            <div className="dl-chips">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`dl-chip${f.id === fontId ? " on" : ""}`}
                  aria-pressed={f.id === fontId}
                  onClick={() => setFontId(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="dl-group">
            <p className="dl-group-label mono">Colours</p>
            <div className="dl-chips">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`dl-chip dl-chip-palette${p.id === paletteId ? " on" : ""}`}
                  aria-pressed={p.id === paletteId}
                  onClick={() => setPaletteId(p.id)}
                >
                  <span className="dl-swatches" aria-hidden>
                    {p.swatches.map((s) => (
                      <i key={s} style={{ background: s }} />
                    ))}
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <p className="dl-note mono">
            {font.label}: {font.note} &middot; {palette.label}: {palette.note}
          </p>
        </div>
      </div>

      <div className={`dl-scope ${fontVars}`} data-font={fontId} style={scopeVars}>
        {/* ---------- landing elements ---------- */}
        <section className="dl-dark" data-theme="dark">
          <div className="wrap">
            <p className="dl-label mono">Landing &middot; dark canvas</p>
            <p className="eyebrow"><span>Digital stamp cards</span><span className="dot-sep"></span><span>Built for Malaysian shops</span></p>
            <h2 className="section-title dl-title">
              Your <em className="dl-accent">regulars</em> are the whole business.
            </h2>
            <p className="dl-sub">Kembali puts a stamp card in every customer's phone.
            Staff scan a code and the stamp lands in seconds.</p>
            <div className="dl-actions">
              <a className="btn btn-solid" href="#f" onClick={(e) => e.preventDefault()}>Start your card</a>
              <a className="btn btn-ghost" href="#f" onClick={(e) => e.preventDefault()}>Watch a card fill</a>
              <span className="chip-cta dl-chipcta">Merchant login</span>
            </div>
            <p className="dl-ticker mono">7:48 am &middot; white coffee &middot; RM 4.00 &middot; stamp 3 of 10 &nbsp;&nbsp; 9:15 am &middot; wash and vacuum &middot; RM 28.00 &middot; stamp 6 of 9</p>
          </div>
        </section>

        {/* ---------- paper + customer card ---------- */}
        <section className="dl-paper paper" data-theme="light">
          <div className="wrap dl-grid">
            <div>
              <p className="dl-label mono">Paper section &middot; customer card</p>
              <p className="eyebrow">One card, many counters</p>
              <h2 className="section-title dl-title-ink">Anywhere people come back.</h2>
              <p className="dl-prose">You set what a visit earns and what the reward is.
              Kembali does the counting, the coupons, and the reports. The card opens in
              the browser, already in your colours.</p>
              <dl className="faq-list dl-faq">
                <div className="faq-row">
                  <dt>Do customers download an app?</dt>
                  <dd>No. The card opens in the phone's browser from a QR scan.</dd>
                </div>
              </dl>
            </div>
            <div className="dl-cardcol">
              <DemoCard initial={8} />
            </div>
          </div>
        </section>

        {/* ---------- backend ---------- */}
        <section className="dl-paper paper dl-backend" data-theme="light">
          <div className="wrap">
            <p className="dl-label mono">Backend &middot; the merchant dashboard</p>
            <div className="dash dl-dash">
              <div className="dash-chrome">
                <span className="dc-dot"></span><span className="dc-dot"></span><span className="dc-dot"></span>
                <span className="dc-url mono">kembali.app/admin/corner-coffee</span>
              </div>
              <div className="dash-body">
                <aside className="dash-nav">
                  <span className="dn-item active">Overview</span>
                  <span className="dn-item">Customers</span>
                  <span className="dn-item">Rewards</span>
                  <span className="dn-item">Reports</span>
                </aside>
                <div className="dash-main">
                  <div className="dash-tiles">
                    <div className="tile"><span className="tile-num">41</span><span className="tile-label">stamps today</span></div>
                    <div className="tile"><span className="tile-num">6</span><span className="tile-label">rewards redeemed</span></div>
                    <div className="tile"><span className="tile-num">RM 512</span><span className="tile-label">recorded today</span></div>
                  </div>
                  <div className="dash-week">
                    <p className="mono dw-label">STAMPS THIS WEEK</p>
                    <div className="dw-bars">
                      <div className="dw-bar dl-bar" style={{ "--v": 0.45 } as CSSProperties}><i></i><b>M</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.62 } as CSSProperties}><i></i><b>T</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.55 } as CSSProperties}><i></i><b>W</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.78 } as CSSProperties}><i></i><b>T</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.92 } as CSSProperties}><i></i><b>F</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.7 } as CSSProperties}><i></i><b>S</b></div>
                      <div className="dw-bar dl-bar" style={{ "--v": 0.3 } as CSSProperties}><i></i><b>S</b></div>
                    </div>
                  </div>
                  <div className="dash-feed">
                    <p className="mono dw-label">JUST NOW</p>
                    <div className="df-row"><span className="df-dot"></span>Aisyah &middot; stamp 10 of 10 &middot; RM 0.00 &middot; SS2 outlet</div>
                    <div className="df-row"><span className="df-dot"></span>Priya &middot; reward confirmed &middot; latte &middot; Damansara outlet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- app ---------- */}
        <section className="dl-dark dl-app" data-theme="dark">
          <div className="wrap">
            <p className="dl-label mono">The branded app demo</p>
            <BrandAppDemo />
          </div>
        </section>
      </div>

      <section className="dl-paper paper" data-theme="light">
        <div className="wrap">
          <p className="dl-foot mono">Temporary page, linked from nowhere. Reply with one font pairing and one palette.</p>
        </div>
      </section>
    </>
  );
}
