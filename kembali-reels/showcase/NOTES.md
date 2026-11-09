# Kembali showcase reels — status and notes (2026-10-01)

Remotion project. Render any reel with:
`npx remotion render src/index.ts <Id> out/<file>.mp4 --codec=h264 --crf=16`

## Deliverables (out/)

| # | File | Id | Song (clip) | Length | Status |
|---|---|---|---|---|---|
| 1 | kembali-showcase.mp4 | Showcase | track.mp3 0:00 | 20s | Delivered |
| 2 | kembali-swarm.mp4 | Swarm | Funk Taka 0:13–0:30 | 20s | Delivered |
| A | kembali-receipt.mp4 | Receipt | Desire 0:08–0:29.3 | 21.3s (was 20s) | Delivered |
| C | kembali-cups.mp4 | Cups | Rec2 Funk 0:00–0:28 | 28s | Delivered |
| 3 | kembali-street.mp4 | Street | Que Loucura 0:00–0:31.8 | 31.8s (was 30s) | Delivered, approved style |
| 4 | kembali-cafe.mp4 | Cafe | Desire 0:08–0:29.2 | 21.2s (was 20s) | Final ("free reward" wording) |
| 5 | kembali-market.mp4 | Market | Rec2 Funk 0:00–0:28 | 28s | Final, approved |
| 6 | kembali-salon.mp4 | Salon | Pink Panther 1:21–1:45.3 | 24.3s (was 23s) | Final — reviewer pass 4: clean |
| 7 | kembali-town.mp4 | Town | Dive 0:00–0:42.5 | 42.5s (was 40s) | Final — 6 review passes; shops furnished (tables, benches, shelves, extra staff/customers) |
| 8 | kembali-tutorial.mp4 | Tutorial | Candyland 0:12–0:42.8 | 30.8s (was 30s) | Final — 4 review passes; last item (snow hid the rewind) fixed |

## Standard end card (2026-10-03, founder picked option 3 "Sand")
Every reel ends on `src/endcards/StandardEnd.tsx` (`<StandardEnd f start from? mono? />`).
- One entrance everywhere (frames after `start`): nothing on `start` itself; the sand disc
  shows on 1 and grows with a quadratic ease-out to the far corner on 12 (visible every frame);
  loop draws 5–22, arrowhead 20–28, coral dot 23–31 (first pixel on 24), wordmark letters
  14–37 (1-frame stagger), tagline 22–34, mono line 28–38, then hold. Layout matches the
  approved still within a pixel; all of it sits in y 663–1251.
- Reels that build the logo pass `from` (position/size/colour of their built mark): Swarm (dots),
  Receipt (paper loop), Cups (foam), Street (neon sign, after the neon wordmark lights), Market
  (stalls from above). The ramp's start value is 0.25·size (never shown) so the first disc frame
  already clears the built mark's arrowhead and glow, and the card's pandan mark is clipped to
  the disc, so the reveal is a clean cut (never a half-faded ring); the mark is then carried
  into place over 18 frames and is pixel-still from start+18, where the impact starts. The
  built mark must match the card's geometry exactly (Mark stroke 6/80, size measured from the
  reel's own scale — Market is 835 px, Cups' LogoArt takes width 24) and must be still on the
  cut frame (Swarm fades its beat pulse, kick and yaw over END−14..END−6).
- Pull-back reels (Showcase, Café, Salon, Town) draw the mark fresh after the pull-back.
- Tutorial keeps its joke: the mono line is the "NOW IN 2010 → 2026 QUALITY" odometer (rolls at
  start+42…53; digits clipped to cap-height..baseline; two switch2 clicks on the digit starts).
- Same end sound everywhere: `endSfx(start, carried)` = `whoosh-long.wav` (the stock whoosh
  stretched 0.4×, ~380 ms) at start−4 peaking as the disc appears, then a bell on start+24 (the
  first visible dot pixel — the bell's energy is in its first frame) or a soft impact on the
  landing at start+18 (carried). Music is ducked 50% under the hits (`endDuck`, linear ramps
  start−8..−3 and +32..+50) so they read over the song, and every fade reaches zero 4 frames
  before the last frame so no hi-hat ticks on the final frame.
- **Audio priming trimmed at mux time** (`out/end/render-all.sh`): Remotion's AAC track kept its
  2048-sample encoder priming as audio with no edit list, so every sound and the music played
  1.28 frames late. The script re-muxes with `-itsoffset -0.042667` on the audio (stream copy,
  drops the two priming packets); `out/end/lag.py reel.mp4 sfx.wav frame…` cross-correlates a
  placed sound and must print lag 0.00. Use the script for every render, including body-only
  changes. (This also settles the "possible audio offset" note below.)
- **Peak limiter at mux** (same script): Remotion sums sounds without normalising, so stacked
  hits (stamp clicks over music beats) exceeded full scale in several reels. The mux step now
  decodes Remotion's AAC (which keeps the overs as floats), limits at 0.95 and re-encodes once
  at 256 kb/s. A WAV render is not an alternative: Remotion writes 16-bit PCM, already clipped.
- Starts are on beats: drawn → first dot pixel (start+24) on a beat; carried → landing (start+18)
  on a beat.
- Body sounds that were placed a frame or two EARLY to compensate the old audio lag (Receipt's
  POP/TEAR/LAND and arrowhead bell, Market's settle bell) are now on their frames; Street's neon
  switch clicks sit a frame early only because the files have 1.35/1.57 frames of lead-in.
- Tutorial's VHS static uses seed 1 + (f % 13): feTurbulence renders seed 0 and 1 identically.
- Town's stamp click (`mouse-click-loud.wav`) is two events — a 1 ms down-click at 0 and the loud
  up-click 2.82 frames in — so it is placed at s−1 with `trimBefore={2}` and the music dips 30 %
  under each stamp. Street's switch clicks use lead-trimmed copies (`*-trim.wav`). Receipt's
  ribbon carries a round cap on its start edge so the reveal matches the Mark's round caps.
- `Grain` (src/common.tsx) uses seed 1 + (f % 7) for the same feTurbulence reason. Receipt's
  ribbon has a short plain arc under each striped segment, in that segment's shade (fills the
  notches at the 70 segment joins without showing through as ticks), plus a disc on its start
  edge for the round cap; the leading tip stays flat. Hits that land on loud beats (Town stamps, Street switches, Receipt and Market
  bells) get a 30 % music dip with linear ramps so they read without pushing levels into the limiter.
- Mono WAV sfx (the whooshes) play ×1.41 (+3 dB) of their `volume` after Remotion's stereo upmix;
  stereo .ogg files play at the stated level. Set mono-file levels with that in mind.
- Songs decoded from mp3 play ~0.75 frames late (LAME encoder delay that Remotion's decoder does
  not skip): Market's END and settle bell carry a +1 for it. The sfx (wav/ogg) are exact.
- Body audio levels trimmed where reviewers measured clipping: Street's neon switch clicks and
  its 766 whoosh. Measure peaks per channel or with `pan=mono|c0=0.5*c0+0.5*c1` — `ffmpeg -ac 1`
  SUMS stereo and inflates transients (that artefact briefly halved Town's stamp clicks).
- Six reels got longer so the card holds ~2 s after settling without cutting a payoff (see
  table): Receipt +40f, Street +55f, Café +35f, Salon +40f, Town +75f (the stamped town now
  holds 34f before the wipe), Tutorial +25f. Music clips start where they did and run on,
  except Receipt, whose song hits a breakdown at ~580: its fade runs 572–606 so the breakdown
  is the fade and the song never restarts (≈1 s of silent card at the end).
- Hand-off rules learned from the reviewers: Market's saturation filter eases off during the
  rise so its built coral matches the brand; the Tutorial keeps its static on under the card
  until the disc has covered the frame; Showcase's PDPA card is simply covered by the disc (an
  opacity fade read as a one-frame ghost); Cups' outer cups fade linearly.
- Pre-change renders: out/pre-endcard/. Retired code: retired/.
- Review rounds (2026-10-03): nine rounds of critique-only reviewer agents, one per reel per
  round, each extracting every frame of the ending and measuring pixels and audio. Final CLEAN
  verdicts: Showcase/Café/Salon round 4 (+ pixel-diff for the later shared tagline/grain
  re-renders), Cups/Tutorial round 5, Swarm/Town round 6, Market round 7, Receipt round 8,
  Street round 9. Brief with every round's changes: out/end/REVIEW-BRIEF.md. Proof sheets:
  out/end/proof/ (final-cards.png = all ten last frames; handoff-*.png = S−1 … S+38 per reel).
- Tools: out/end/render-all.sh [Id…] (render + mux), out/end/lag.py (sfx onset vs placed
  frame), out/end/diff.py (pixel diff of two renders), out/end/strip.sh (stills strip).
- `EndPreview` composition previews the card alone; `EndCards` still renders the five options.

## Review process used (keep doing this)
Each diorama reel goes to an independent reviewer agent that only critiques (no edits),
then I fix and re-render, repeated until the reviewer calls it clean. Typical catches:
- depth/occlusion (things drawn in front of what they stand behind — sort by x+y, or draw
  in back-to-front order; walls/partitions often need to move later in the draw list)
- people popping in/out or clipping through furniture (salon/café use the tile planner in
  src/cafe/plan.ts with an obstacle map; check with src/cafe/check.ts)
- props not held by anyone, objects teleporting between states
- headlines overlapping during hand-offs (exit must finish before the next enters)
- sound effects that don't match a visible change, or are inaudible (trim leading
  silence; short clicks need boosting — see public/sfx/web/click-hard.wav)
- text in the top/bottom 420px (Instagram UI); cards must end above y 1500
- data that contradicts itself (stamp counts vs rules, points totals, services vs looks)

## Not done / open
- **Media is not in git** (public repo): `public/` (music, sfx, fonts) and all renders stay local.
  A fresh checkout cannot render a reel until `public/` is copied back in.
- ~~Possible audio offset~~ — confirmed as the AAC priming (1.28 frames) and fixed at mux
  time; see "Standard end card".
- **Music rights:** all songs are commercial tracks baked into the audio; Instagram may
  mute them. Safer to add the song through Reels' music library.
- **Placeholders:** shop names, customer names, prices, dates and dashboard numbers are
  illustrative. No call to action or URL (kembali.app is unregistered).
- **New copy not founder-approved:** e.g. "Every small business has its regulars.",
  "Built for every kind of small business.", "Walk in for a cut. Leave as a regular.",
  the parody's 2010 slang.
- Nothing in kembali-reels/ is committed to git.
