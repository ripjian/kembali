# Kembali showcase

A standalone, dependency-free showcase site for Kembali. Four pages share one
engine (`js/main.js`, feature-guarded per page):

- `index.html` — business-first landing: industry band (cafes, restaurants,
  dessert, gyms, salons, car washes, wellness; duotone at rest, colour on hover),
  join-in-one-scan with the live phone demo, merchant dashboard + real product
  proof, setup + founding price.
- `story.html` — "Ten visits", Aisyah's story: the original scroll narrative.
  Scrolling fills her card in the corner; the tenth stamp is the reward, and a
  closing chapter starts card number two.
- `roadmap.html` — the ledger timeline: live rows are stamped coral, upcoming
  rows dashed. Content mirrors ROADMAP.md in public language.
- `pricing.html` — PRICING.md §8: Founding RM99 hero coupon (rubber-stamped),
  Starter RM149, Growth RM279, notes and FAQ.

Not part of the production marketing surface (`apps/web`); it deliberately breaks
the DESIGN-dub frosted-SaaS system as an art-directed piece while staying inside
the BRAND.md Pandan palette and §5 copy rules.

## Run

```
npx http-server showcase -p 4173
```

Or use the `showcase` entry in `.claude/launch.json`. Everything is static; no build.

## Techniques

- Raw WebGL2 fragment shader on the hero panel: duotone photo, procedural rising
  steam (fbm), pointer parallax and ripple, animated film grain, breathing zoom.
- Custom scroll narrative engine: pinned 520vh "ritual" scene mapping scroll progress
  to an append-only ledger, stamp-by-stamp card fill, photo crossfades and Ken Burns.
- Canvas ink systems: click-anywhere rubber stamps, ink-blob burst + shockwave at the
  reward, distress-masked "Redeemed" stamp.
- Kinetic variable typography: Fraunces `opsz`/`wght` axes animated on scroll.
- Live coded product demo: join → OTP (dev code 888888) → card, on a loop.
- Real product photography: `real-admin.png` / `real-card.png` are unedited
  screenshots of the seeded dev app captured headlessly via Playwright.

All motion respects `prefers-reduced-motion`. The rAF loop is guarded; a failure
logs to console instead of freezing the page.

## Photography

Natural colour with a light in-house grade (founder direction 2026-07-12:
premium, presentable, no duotone overlay on photos). Sourced through Openverse:

| Asset | Subject | Source | License |
|---|---|---|---|
| hero-serve.jpg | Barista serving a customer at the counter | Wikimedia (Shixart1985) | CC BY 2.0 |
| story-eat.jpg | Customer enjoying a bowl in a cafe chair | Wikimedia (Shixart1985) | CC BY 2.0 |
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

Attribution also appears in the site footers. Full source URLs: `manifest.json`
files from the sourcing runs (scratchpad) or the source pages by title.

## Known placeholders

- `kembali.app` domain and `hello@kembali.app` are unregistered placeholders.
- The QR encodes `https://kembali.app/join/corner-coffee`; regenerate via the
  pipeline script when the real domain exists.
- `og:image` uses a relative path; make it absolute when deployed.
