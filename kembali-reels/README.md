# Kembali reels — series of three

Built by hand (not the brag skill): a shared kit (`kit/assets/kit.css`, `kit/assets/kit.js`) plus one composition per reel. Hyperframes is only the renderer. Run `./sync.sh` after editing the kit, then `npx hyperframes render` inside a reel folder.

Renders: `out/reel-01.mp4`, `out/reel-02.mp4`, `out/reel-03.mp4` (1080×1920, thumbnail baked as frame 0, posters as .jpg).

## Series consistency
- Same canvas, glow, fonts, music bed (happy-beats vol-12, beat-synced).
- Same series tag ("KEMBALI · 0N / 03"), same caption slot with in-place crossfades, same sub-line.
- Signature transition: the coral stamp dot swells over the frame and shrinks back.
- Same end card: the mark draws itself, wordmark, tagline, one reel-specific line.
- Reels safe zone: readable content inside y 250–1535, centred; side elements above y 860.
- UI is rebuilt from the real app (customer card, owner overview, reports, settings, team, QR kit, cashier scan) with Corner Coffee's real colours and copy.

## Motion per reel
- **01 It just works** (18.8s): gravity card pile, shared-element flight (poster QR into the camera), camera-flash cut, synchronized split screens with a travelling arc connecting them, stamp slam with squash and shockwave, live list insertion, fast-forward counter chip, leaderboard reorder as Mark overtakes the regulars, confetti.
- **02 Ten jobs** (24.2s): masked headline reveals, one tile that morphs its shape via clip-path for every feature, ripple fill, SVG ring sweep with rolling counter, 3D card deal, coupon tear-off with stamp, dashed link draw between avatars, synchronized live tiles, bar grow plus heatmap wash, pin drops with ripple, CSS-variable theme morphing, progress fill, bento flip-in finale.
- **03 From sign-in to first stamp** (22.2s): step cards collapsing into story-progress bars, simulated cursor with click ripples, per-character typing, modal pop and dropdown, page swaps inside a desktop window, poster print and 3D lay-flat onto a counter, desktop shrink to picture-in-picture while the cashier phone scans, overview ticking in the corner.

## Captions

**01**
Paper stamp cards get lost. This one can't.
Your customer scans the poster at your counter, types their number, and their card is open. You see every stamp land the moment it happens, and your regulars climb your reports on their own.
Nothing to install. Nothing to lose.
#loyaltyprogram #stampcard #malaysiacafe #kopitiam #smallbusinessmalaysia #kembali

**02**
One card. Ten jobs.
Stamps, points, rewards you set, one-tap coupons, referrals, a live overview, busy-hour reports, every outlet in one view, your own colours, and data export on every plan.
All on the phones you and your customers already have.
#loyaltyprogram #cafeowner #malaysiacafe #smallbusinessmalaysia #kembali

**03**
From sign-in to first stamp, in four steps.
Set your card. Add your team. Print the poster. Take the first stamp.
No developer, no hardware, no app to build.
#smallbusinessmalaysia #cafeowner #loyaltyprogram #kembali

## Reel 02 variants (smooth rebuild)
The first reel 02 faded each feature out, reshaped the tile, then faded the next in, leaving a dead beat every three seconds. The variants never leave an empty frame: every hand-off overlaps. All three share the same ten panels (`kit/assets/features.js`), captions and end card, so they differ only in staging.

- **A · Orbit** (`out/reel-02a.mp4`, 25s, 3D): the ten panels on a rotating 3D ring. The ring spins in from deep space, turns one step per feature while the old panel dims and the new one lights, bobs on arrival, then pulls back to show all ten.
- **B · Journey** (`out/reel-02b.mp4`, 25s, 2.5D): one unbroken camera glide down a coral road. Panels tilt up as they arrive and lie back as they pass; polaroids of real cafés, bakeries, salons, a car wash and shophouses drift behind at half speed; the finale pulls out to the whole road.
- **C · In hand** (`out/reel-02c.mp4`, 25s, 3D): a phone held in a hand at the counter, scrolling through the ten jobs while the shop behind it changes every two (café, bakery, salon, kopitiam, restaurant) with a slow Ken Burns. The phone turns in on the way in and turns round to show the Kembali back on the way out.
