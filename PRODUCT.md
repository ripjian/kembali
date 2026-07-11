# Kembali — Product context

> Seeded for the impeccable design skill from `ROADMAP.md` §1 (vision) and `brand/BRAND.md`.
> Scope note: this repo is a multi-surface monorepo. This file describes the **marketing / landing** surface (`apps/web/src/app/(marketing)` and the sandbox `/concepts/*`). The customer PWA and admin dashboard are the *product* register and follow BRAND.md app tokens.

## Register

brand

Marketing and landing pages: the design *is* the product. Sell the feeling of regulars coming back. Warm, confident, concrete. Never commanding.

## Platform

web

## Target users

- **Shop owners** running cafes, bubble tea shops, salons, gyms, bakeries in Malaysia and SEA. Not startup people. They know paper stamp cards get lost and want something their regulars will actually use.
- **Their customers**, who join a loyalty card by scanning a QR at the counter. No app download, ever. The card lives in a web PWA and later in Apple Wallet / Google Wallet.
- **Staff**, who stamp by scanning the customer's QR on any phone camera in under 3 seconds.

## Product purpose

A multi-tenant SaaS digital stamp-card loyalty platform. Replace the paper card that customers lose and shops reprint. Customers join from a QR in under 30 seconds, collect stamps and points, and redeem rewards in store. Merchants get their own branded card, simple reports, and manual per-outlet invoicing (no payments in-product).

The one promise, in one word: **Kembali** (Malay for "return / come back"). Used only as the brand name, never as a word in copy.

## Positioning

Against paper cards (lost, forgotten, reprinted) and against heavyweight loyalty apps that demand a download. Kembali is the middle: no app for customers, no hardware for shops, live in minutes. Reference competitors: Stampede, Loopy Loyalty, Stamp Me. Kembali is warmer, SEA-first, and cheaper to start.

## Brand personality

- Warm and inviting, never commanding. Invitations ("See how it fits your shop") over demands ("Tell us about your business").
- Confident and concrete. Real numbers over vague claims: "Set up in 10 minutes", "3 seconds a stamp", "Join in under 30 seconds".
- Unmistakably SEA. Pandan green, coral, warm sand. Kopitiam nostalgia is a texture we can reach for, not a gimmick.
- Honest. We mark what is live vs planned. No hype vocabulary.

## Brand references (feel, not copy)

Warm daylight kopitiam tabletops, marble counters, rubber stamps and ink pads, enamel mugs, old shop signage, paper grain. Modern frosted-SaaS restraint underneath the warmth.

## Anti-references (never this)

- Cold enterprise SaaS with stock gradients and abstract 3D blobs.
- Loud growth-hacky landing pages with exclamation marks and rhetorical questions.
- AI-tell vocabulary: seamless, effortless, unlock, empower, elevate, supercharge, streamline, robust, delve, game-changer.
- The "it's not just X, it's Y" and "Whether you're A or B" constructions. Rule-of-three flourishes. Headline rhetorical questions.
- Em dashes anywhere. Any Malay word except the brand name "Kembali".

## Strategic design principles

1. **Brand colors are the base of every direction.** Pandan `#0F3D32` = actions. Coral `#E0684B` = earned rewards. Leaf `#7FB069` = progress. Sand `#F6F1E3` = canvas. Stretch the shades; never replace the identity.
2. **Coral = earned, pandan = do.** Never swap the two roles.
3. **Show the card.** The stamp card is the hero object. Let people feel a stamp land.
4. **WCAG AA text contrast everywhere.** Coral fails as body text on sand; use deep coral `#A93E24` for coral-tinted text. Use the `@kembali/core` contrast utilities to verify.
5. **Mobile-first.** Checked at 360px and desktop. No horizontal overflow.
6. **Copy is warm, concrete, English only.** Sentence case. Buttons verb-first, 2 to 4 words. Front-load the benefit.
