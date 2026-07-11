# Kembali showcase · "Ten visits"

A standalone, dependency-free showcase site for Kembali. The page is structured as a
stamp card being filled: scrolling the story stamps a persistent card in the corner,
and the tenth stamp earns the reward. Not part of the production marketing surface
(`apps/web`); it deliberately breaks the DESIGN-dub frosted-SaaS system as an
art-directed piece while staying inside the BRAND.md Pandan palette and §5 copy rules.

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

Wikimedia Commons, graded in-house into a pandan duotone / warm filmic pair
(pipeline: scratchpad `grade.py`, Pillow):

| Asset | Source | Author | License |
|---|---|---|---|
| hero-pull.jpg | "Teh tarik man pulling tea" | Cheng (Austin, US) | CC BY-SA 2.0 |
| scene-interior.jpg | "Kopitiam by Wilai, Phuket" (cropped) | Thanakrit Gu | CC BY 2.0 |
| scene-shophouse.jpg | "Lu San Coffee Shop 1" (Muar) | Slleong | CC0 |
| food-kaya.jpg | "Kaya toast, Yinzo Kopi, Ipoh" | Sharon Hahn Darlin | CC BY 2.0 |
| food-kopi.jpg | "Kopi Rasa" | さえぼー | CC0 |
| food-teh.jpg | "Teh tarik 2" | Alpha (Melbourne) | CC BY-SA 2.0 |
| food-egg.jpg | "Kaya toast dip into soft boiled egg" | Pinklily08 | CC BY-SA 4.0 |

Attribution also appears in the site footer. Full source URLs: see
`credits.json` from the sourcing run (scratchpad) or the Commons file pages by title.

## Known placeholders

- `kembali.app` domain and `hello@kembali.app` are unregistered placeholders.
- The QR encodes `https://kembali.app/join/corner-coffee`; regenerate via the
  pipeline script when the real domain exists.
- `og:image` uses a relative path; make it absolute when deployed.
