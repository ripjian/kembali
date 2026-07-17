# Kembali — Marketing design system

> The public surface: `/`, `/story`, `/roadmap`, `/pricing`, `/security`,
> `/privacy`, `/contact`, `/about`.
> **Supersedes `DESIGN-dub.md`** (founder, 2026-07-12). Companion to `BRAND.md`
> (tokens, voice) and `CLAUDE.md` (SOP).

An art-directed editorial surface, not a SaaS template. Deep pandan canvas, warm
sand paper, coral reserved for what you earn. Where DESIGN-dub was a frosted
white dashboard aesthetic, this is closer to a printed magazine that happens to
run in a browser: big serif display type, real photography, and one motion idea
per page carried all the way through.

Nothing here applies to `/app` or `/admin`, which keep their own light+dark theme
(`globals.css`, Plus Jakarta Sans).

## 1. Where it lives

```
apps/web/src/app/(marketing)/
  layout.tsx        .sc-root wrapper, loader, nav, footer, engine
  showcase.css      the whole design system, scoped under .sc-root
  page.tsx          landing · story/ roadmap/ pricing/ security/ privacy/ contact/ about/
apps/web/src/components/marketing/
  showcase-engine.ts   all motion; init returns a teardown
  showcase-shell.tsx   runs the engine, keyed to the pathname
  site-nav.tsx  site-footer.tsx  reach-out.tsx  demo-card.tsx
apps/web/public/showcase/   photography, fonts, the stamp-dot QR
```

**Scoping is load-bearing.** Every rule in `showcase.css` sits under `.sc-root`,
so the reset, the tokens and the base element styles never reach `/app` or
`/admin`. Base element rules (`a`, `img`, the reset) use `:where()` to keep zero
specificity: scoping `a { color: inherit }` to `.sc-root a` once raised it above
`.chip-cta` and drained every link-button of its colour. If you add a bare
element selector, wrap it in `:where()`.

## 2. Tokens

Pandan palette only (BRAND.md §2). Never invent hex; derive with `color-mix`.

| Token | Value | Role |
|---|---|---|
| `--pandan` / `--pandan-deep` / `--pandan-night` | `#0F3D32` `#0A2C24` `#071E18` | ink, dark canvases, the journey |
| `--coral` / `--coral-deep` | `#E0684B` `#A93E24` | **what you earn**: stamps, rewards, live status |
| `--leaf` | `#7FB069` | progress fills only |
| `--sand` / `--sand-dim` | `#F6F1E3` `#EDE6D2` | paper sections, the floating hero shell |
| `--ink` | `#16261E` | body text on sand |

**Coral is earned, pandan is action, leaf is progress. Never swap.** A merchant's
brand colour may dress a card, but the stamps stay coral.

## 3. Type

| Role | Face | Notes |
|---|---|---|
| Display | **Fraunces** (variable, `opsz` 40 to 144) | headlines, card titles, the wordmark. Italic + coral for the one accent word per headline |
| Body | **Plus Jakarta Sans** | 15 to 21px, `max-width` 40 to 62ch |
| Technical | **IBM Plex Mono** | uppercase micro-labels, ledger rows, timestamps, captions |

Self-hosted `.woff2` in `public/showcase/fonts` via `@font-face`, `display: swap`.
The mono voice is the product's voice: ledger lines, outlet names, code strings.

## 4. Sections

`data-theme` on each section drives the nav re-theming (`dark`, `light`, `coral`).
Alternate dark and sand so the page breathes; coral is a whole-section flood used
exactly once (the story's reward).

- **Floating hero shell** (landing): a rounded sand card over the pandan canvas.
- **Paper sections**: `.paper` adds an SVG grain wash.
- **Ledger ticker**: the append-only ledger as a stock ticker.
- **Station timeline** (roadmap): solid coral track between reached stops via
  `:has(+ reached)`, dashed ahead, the New stop pings.

## 5. Motion

Follows `.claude/skills/emil-design-eng/SKILL.md`: transform/opacity only, strong
ease-out for entries, UI under 300ms, stagger 30 to 80ms, never from `scale(0)`,
loops pause off-screen, `prefers-reduced-motion` keeps meaning and drops movement.

The engine (`showcase-engine.ts`) is one `initShowcase()` that returns a teardown.
Every listener, observer, timer and frame loop registers its own cleanup, because
the marketing layout survives client navigation: `ShowcaseShell` re-keys the
engine to the pathname. **If you add motion, register its teardown.**

Features initialise only when their elements exist, so one engine serves every
page: WebGL hero panel (duotone photo, procedural steam, pointer ripple, grain),
scroll-mapped story ledger, canvas ink stamps on click, roadmap cursor-following
previews, dashboard counters, the join phone demo.

## 6. Photography

Natural colour with a light in-house grade (founder, 2026-07-12: premium,
presentable, no duotone overlay on photos). Sourced through Openverse; every
image is CC0 or CC BY with attribution in the footer.

| Asset | Subject | Source | License |
|---|---|---|---|
| hero-serve.jpg | Barista serving a customer at the counter | Wikimedia (Shixart1985) | CC BY 2.0 |
| story-serve.jpg | A regular handed their cup at the counter | Wikimedia (Artaxerxes) | CC BY 4.0 |
| scene-corner.jpg | Cafe corner, marble tables | Rawpixel | CC0 |
| scene-shophouse.jpg | Lu San Coffee Shop, Muar | Wikimedia (Slleong) | CC0 |
| food-coffee.jpg | Flat white on dark wood | Rawpixel | CC0 |
| food-breakfast.jpg | Breakfast spread from above | StockSnap | CC0 |
| food-tea.jpg | Teapot and glasses | Rawpixel | CC0 |
| food-croissant.jpg | Filled croissant | StockSnap (Kristin Hardwick) | CC0 |
| ind-cafe.jpg | Warm cafe interior, wooden tables | Wordpress Photos (Nilo Velez) | CC0 |
| ind-restaurant.jpg | Fine dining plate | Wikimedia (Jussi Ulkunniemi / ELO Foundation) | CC BY |
| ind-dessert.jpg | Cream dessert bowl | Rawpixel | CC0 |
| ind-gym.jpg | Gym interior | StockSnap (Humphrey Muleba) | CC0 |
| ind-salon.jpg | Barber combing and trimming | Wikimedia (Nenad Stojkovic) | CC BY 2.0 |
| ind-carwash.jpg | Drying a wet red car | Rawpixel | CC0 |
| ind-wellness.jpg | Spa massage | StockSnap (Authentic Stock) | CC0 |
| real-admin.png · real-admin-mobile.png · real-card.png | The actual product, captured from the seeded dev app (the mobile admin capture serves phones via `<picture>`) | in-house | — |

New photography: grade it to match (light desaturation, gentle contrast, a warm
lift) or it will read as a different shoot. Add the credit here and in the footer.

## 7. Copy

SOP 3 + BRAND.md §5 apply with no exceptions: English only, "Kembali" is a name
never a verb, sentence case, buttons verb-first 2 to 4 words, no em dashes, none
of the banned AI-tell vocabulary, concrete numbers over vague claims. Grep before
shipping.

## 8. Known placeholders

- `kembali.app` and `hello@kembali.app` are unregistered. Every CTA is a mailto.
- The QR poster encodes `https://kembali.app/join/corner-coffee`. Regenerate when
  the domain exists.
- No sitemap or robots.txt yet.
- `og:image` is set per page but points at relative paths; make them absolute at
  deploy.
