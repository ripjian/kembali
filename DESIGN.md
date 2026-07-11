# Kembali — Design system

> Seeded for the impeccable design skill from `brand/BRAND.md` (Pandan palette v1.0).
> Follows the design.md format spec. Marketing surface is light-locked; the app/admin surfaces add dark mode.

## Theme

Warm, green, unmistakably SEA. Deep pandan ink and coral rewards on warm sand. Kopitiam nostalgia over frosted-SaaS restraint. Every direction keeps this identity as its base; shades may stretch, the identity does not change.

## Color palette

### Brand core

| Token | Hex | Role |
|---|---|---|
| Pandan | `#0F3D32` | Ink, headlines, logo, primary actions. The "do" color. |
| Coral | `#E0684B` | Stamps, rewards, coupons. The "earn" color. |
| Leaf | `#7FB069` | Progress fills, positive states, garnish. |
| Sand | `#F6F1E3` | Page canvas. |

### System tokens (light)

- Background `#F6F1E3` · Surface `#FFFFFF` · Surface alt `#EDE6D2`
- Text `#16261E` · Text secondary `#5C6B60` · Text muted `#8B9689`
- Border `#DCD5BF`
- Primary `#0F3D32` · Primary hover `#0A2C24` · On-primary `#FFFFFF`
- Accent (coral) `#E0684B` · Accent deep `#A93E24` (coral-tinted text) · Leaf `#7FB069`
- Success `#3B7D46` · Warning `#B45309` · Error `#C0392B` · Info `#2D6CB5`

### System tokens (dark, app/admin only)

- Background `#10201A` · Surface `#182B23` · Surface alt `#20362C`
- Text `#EDEEE2` · Border `#2F443A`
- Primary `#3E8A72` (pandan lifted) · On-primary `#0B1712`
- Accent `#EC7F63` · Accent deep `#F4A98F`

### Alternate palettes (reference, for stretched directions)

- **Kopi & kunyit** (warmer kopitiam): `#3A2A21` / `#E8A33D` / `#14594A` / `#FAF4E8`
- **Senja** (techier, premium): `#2B2E5A` / `#E4645A` / `#D9A441` / `#FAF6F0`

### Color rules

- **Pandan = do, coral = earn, leaf = progress. Never swap.**
- Coral is decorative/status only. It fails contrast as body text on sand (~3.2:1). Use accent-deep `#A93E24` for coral text.
- Leaf is garnish only, never a primary action.
- WCAG AA everywhere. Contrast (light): pandan on sand ≈ 10.9:1, white on pandan ≈ 12:1, text on sand ≈ 13:1. Verify derived shades with `@kembali/core` (`contrastRatio`, `ensureReadable`, `onColor`).
- Never invent hex values outside these; derive variants with `color-mix` from tokens and flag the gap.

## Typography

- **UI / system:** Plus Jakarta Sans (warm, SEA-popular), weights 400/500/600. `tabular-nums` for stamp counts and dashboards.
- **Marketing display + serif cut:** Fraunces or Lora. The reference frosted-SaaS marketing site uses Inter 500 tight-tracked for display, 16px body, JetBrains Mono for technical micro-labels.
- The wordmark's final "i" is coral (the last stamp). Sentence case everywhere; uppercase is a CSS treatment, not a writing style.

## Components

- **Stamp card** is the hero object across surfaces: a grid of stamp slots, coral fills as stamps land, leaf progress bar underneath.
- Buttons: pandan filled for the single primary action per surface; verb-first labels 2 to 4 words.
- Cards / surfaces: white on sand, 1px `#DCD5BF` hairlines preferred over heavy shadows (frosted-SaaS reference). Radii 8/12/16/9999px.
- Reward / coupon chips: coral, single-use codes formatted `KMB-XXXX-XXXX`.

## Layout

- Mobile-first, checked at 360px and desktop. No horizontal overflow at 360px.
- Marketing: white canvas, generous whitespace, hairline dividers, glass only on floating elements. Light-locked via `data-theme="marketing"`.
- App/admin: light + dark, Plus Jakarta Sans, denser.

## Motion

- Transform and opacity only. Strong ease-out for entries. UI transitions under 300ms. Stagger 30 to 80ms. Never animate from `scale(0)`.
- Respect `prefers-reduced-motion` with full static fallbacks. Pause decorative loops off-screen.
- In-page animation is CSS. Video assets use Remotion, never in the web UI runtime.
