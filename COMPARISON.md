# Concept comparison

Ten landing-page directions for Kembali, all on the `design-explorations`
branch at `/concepts/1` through `/concepts/10` (index at `/concepts`). Every
concept uses the same real Kembali content and the Pandan palette as its base
(coral = earned, pandan = action), so this compares direction, not facts.

Two lines each: where the concept is strongest, and the honest trade-off
(mostly build cost to productionize).

## 1. Kopitiam skeuomorphism
Best first impression of the set: the paper card on marble and the rubber-stamp
press are tactile and unmistakably Kembali, and the nostalgia lands with the SEA
audience. Highest craft cost to maintain (hand-built textures, ink SVG filters,
the stamp interaction), and the warmth can read as retro if the rest of the
brand modernizes.

## 2. Dark glassmorphism
Strong premium, "this is a real product" first impression, carried by the wallet
pass floating in layered glass. Conversion clarity is lower than the product-led
concepts (mood over message), and the glass and drift need care to stay legible
and cheap on low-end phones.

## 3. Motion scrollytelling
Strongest at teaching the scan-to-reward journey, so conversion clarity is high
for a visitor who scrolls. Highest build cost and risk of the set: scroll-driven
timelines plus a full static fallback are a lot of surface to test, and the
payoff only exists on desktop with motion enabled.

## 4. Neo-brutalist poster
Stops the scroll and reads well on mobile, where the huge type wraps into a
confident poster. It is the most polarizing direction and the least "warm," so it
may fit a campaign or launch better than the evergreen homepage; build cost is
low since it is mostly static.

## 5. Editorial zine
Best for trust and credibility: the broadsheet layout makes Kembali feel
considered and established, and it ages well. The editorial pace slows the path
to the CTA (lower conversion urgency), and it leans on real typographic care to
avoid looking like a generic template.

## 6. Shop stories (photography-forward)
Highest emotional ceiling if real photography exists: full-bleed shop life makes
the value feel human before a word is read. The whole direction is only as good
as the photos, so the real productionize cost is licensing or shooting them; the
CSS placeholders here are stand-ins, not shippable art.

## 7. Kinetic type specimen
Most distinctive first impression as pure craft: the variable font at poster
scale, returning on scroll and reacting to the pointer, is memorable and light on
assets. It sells feeling over specifics (lower conversion clarity), and the
kinetic payoff needs a fine pointer plus motion, so many visitors see the tasteful
static version.

## 8. Bento product tour
Strongest conversion clarity: every tile is the actual product working (stamp,
points, reward code, chart), so a shop owner sees exactly what they buy, and it
stacks cleanly on mobile. Highest ongoing cost to keep honest, since each live
tile is real UI that must track the product as it changes.

## 9. Dimensional card
Best desktop delight: the card tilting to the pointer and separating into parallax
layers is a genuine "wow" that suits a single hero object. That wow is desktop and
fine-pointer only (mobile and reduced-motion get the flat card), and the 3D needs a
performance budget, so the effort buys a moment rather than the whole page.

## 10. Conversational landing
Strongest conversion mechanics: it qualifies the visitor and shows personalized
pricing math up front, which is the clearest path from "what is this" to "what will
it cost me." Highest logic cost to build and maintain (presets, personalization,
the no-JS default that must stay correct), and it asks the visitor to interact
before it rewards them.

---

## Quick read

- **Lead with the product working:** 8 (bento), 10 (conversational).
- **Lead with feeling / brand:** 1 (kopitiam), 6 (photography), 7 (kinetic), 2 (glass).
- **Lead with craft moment:** 9 (dimensional), 3 (scrollytelling).
- **Cheapest to ship well:** 4 (brutalist), 5 (editorial).
- **Most expensive to ship well:** 6 (needs real photography), 3 and 10 (most
  moving parts to build and keep correct).
- **Best mobile feel:** 4, 7, 8, 1 (all strong); the desktop-delight concepts
  (9, 3) intentionally fall back to calmer static layouts on phones.
