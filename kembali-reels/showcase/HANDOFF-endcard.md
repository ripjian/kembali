# Hand-off: give every Kembali reel the standard end card (option 3, "Sand")

Paste everything below the line into a new Claude Code session opened at
`/Users/markous/Documents/Projects/mobileLoyalty`.

---

You're taking over the Kembali Instagram reels. Goal: replace the ending of every reel with
one standard end card — the founder picked **option 3, "Sand"** — and re-render all ten reels.

## Read first
- `CLAUDE.md` (project SOP) and `brand/BRAND.md` (palette, copy rules: English only, no em dashes,
  no exclamation marks, sentence case, "Kembali" only as the brand name).
- `kembali-reels/showcase/NOTES.md` — status of every reel and the review process.
- Memory note "kembali-reel-standards": the founder checks frame by frame.

## The chosen end card
- Preview: `kembali-reels/showcase/out/endcards/endcard-3.png` (all five options side by side:
  `kembali-reels/showcase/out/endcards/all.jpg`).
- Source: `kembali-reels/showcase/src/endcards/EndCards.tsx`, component `V3`:
  sand canvas (`#F6F1E3` with a soft white radial), return-loop mark in pandan `#0F3D32`
  with the coral `#E0684B` dot (size 220), wordmark "kembali" in pandan with a coral final
  "i" (Jakarta 500, 170px, −0.045em), tagline "Loyalty your customers will love." (Fraunces
  italic 56, pandan), mono line "NO APP TO INSTALL" (PlexMono 26, 0.24em tracking, `#5C6B60`).
  Everything vertically centred; keep all of it inside y 420–1500.

## What to build
1. Turn `V3` into one shared, animated component, e.g. `src/endcards/StandardEnd.tsx`,
   `<StandardEnd f={f} start={frame} />`, with ONE consistent entrance used by every reel:
   sand canvas wipes or fades in (≈10 frames), the mark draws itself (arc stroke, then arrowhead
   pops, then the coral dot pops — the `Mark` component in `src/common.tsx` already takes
   `draw`, `arrow`, `dot`), the wordmark letters rise with a 1-frame stagger, then the tagline,
   then the mono line. Ease-out, transform/opacity only, about 1.2 s total, then hold.
   Hold it for at least ~2 s on screen. Land the mark/wordmark hits on music beats.
2. Swap it into every reel and delete/retire each reel's old ending. Old endings live here:

| Reel | Output to replace | Composition | Old ending in |
|---|---|---|---|
| 1 Showcase | `out/kembali-showcase.mp4` | Showcase (600f) | `src/EndCard.tsx` (`Iris`, `EndCard`) |
| 2 Swarm | `out/kembali-swarm.mp4` | Swarm (600f) | `src/swarm/Swarm.tsx` `End` |
| A Receipt | `out/kembali-receipt.mp4` | Receipt (600f) | `src/receipt/Receipt.tsx` `End` |
| C Cups | `out/kembali-cups.mp4` | Cups (840f) | `src/cups/Cups.tsx` `EndText` |
| 3 Street | `out/kembali-street.mp4` | Street (900f) | `src/street/Street.tsx` `NeonEnd` |
| 4 Café | `out/kembali-cafe.mp4` | Cafe (600f) | `src/cafe/Cafe.tsx` `End` |
| 5 Market | `out/kembali-market.mp4` | Market (840f) | `src/market/Market.tsx` `End` |
| 6 Salon | `out/kembali-salon.mp4` | Salon (690f) | `src/salon/Salon.tsx` `End` |
| 7 Town | `out/kembali-town.mp4` | Town (1200f) | `src/town/Town.tsx` `End` |
| 8 Tutorial | `out/kembali-tutorial.mp4` | Tutorial (900f) | `src/tutorial/Tutorial.tsx` `ModernEnd` |

(all paths relative to `kembali-reels/showcase/`)

3. Several reels BUILD the logo as their finale — Swarm (dots form the mark), Receipt (paper
   ribbon winds into the loop), Cups (foam latte art), Street (neon sign), Market (the stalls
   are the mark seen from above), Tutorial (VHS rewind into "NOW IN 2010→2026 QUALITY").
   Keep those build-ups — they're the payoff — and transition from the built logo INTO the
   standard sand card (e.g. the built mark scales/morphs to the end card's mark position while
   the sand canvas wipes in). For the Tutorial, keep the 2010→2026 joke: either keep the
   odometer line on the sand card in place of "NO APP TO INSTALL", or flip it just before.
   Ask the founder if unsure — don't drop a gag silently.
4. Reels whose ending was just a pull-back + wordmark (Café, Salon, Town, Showcase) simply cut
   or wipe to the standard card after the pull-back.
5. Keep each reel's total length and music clip unchanged unless the card can't get ~2 s; if
   so, tell the founder. Music fades must still end at the last frame.

## Constraints (hard)
- 1080×1920, 30 fps. Nothing important in the top 420 px or bottom 420 px.
- Remotion rules: no CSS transitions/animations; animate with `interpolate`/`tw` from
  `src/lib.ts`. Fonts load via `useFonts` in `src/swarm/shared.tsx`.
- Brand: pandan = actions, coral = earned rewards; the coral "i" and coral dot stay coral.
- Don't commit unless the founder asks; never add Co-Authored-By or AI trailers; never push.

## How to verify (SOP from NOTES.md)
- Typecheck: `npx tsc -p .` inside `kembali-reels/showcase`.
- Stills: `npx remotion still src/index.ts <Id> out/x.jpg --frame=N --scale=0.4 --image-format=jpeg`
- Render: `npx remotion render src/index.ts <Id> out/<file>.mp4 --codec=h264 --crf=16`
- For each reel, spawn an independent critique-only reviewer agent (no edits) to check the new
  ending frame by frame: safe zones, transition smoothness, nothing popping, the logo build-up
  handing off cleanly, the card holding long enough, audio fade. Fix and re-render until the
  reviewer says it's clean, THEN show the founder.
- Update `kembali-reels/showcase/NOTES.md` when done.
