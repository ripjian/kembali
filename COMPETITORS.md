# Kembali — Competitive Landscape & Differentiation (2026-07-09)

> Companion to `ROADMAP.md` §2. Internal doc — jargon allowed. Pricing verified from public pages/reviews on 2026-07-09; re-verify before quoting in sales material.

## 1. The field

### Direct — SEA
| Platform | Price | Model | Strengths | Exploitable gaps |
|---|---|---|---|---|
| **Stampede** (SG) | ~$50/mo/outlet | Web-app stamp card, no consumer app | CX-first (30s phone+code login, 3s scan), WhatsApp/email/SMS campaigns, AI weekly reports + food AI, Meta ads, referrals, white-label custom domain, fraud detection, real local case studies | **No Apple/Google Wallet passes**; stamps-only; single-founder-brand dependency (sells via founder's WhatsApp) |
| **Advocado** (SG/MY) | ~SGD 158/mo | CRM + loyalty (points, stamps, referrals) | 15-second phone-number enrolment, automation bot, 1,000+ outlets, POS integrations | Price ~3× Stampede; dated CRM feel; no wallet-first story; heavier onboarding |
| **Eber** (SG) | ~SGD 299/mo | Full loyalty marketing cloud | Points/tiers/memberships, **has Apple+Google Wallet**, 80+ POS/ecom integrations, gamification | Enterprise price & complexity — overkill for a 1–3 outlet cafe; not stamp-card-simple |
| **Poket** (SG/MY) | Free tier + paid | 9 program types, e-vouchers, gamification | Breadth, free entry tier, omnichannel (Shopify/Woo) | Feature maze; merchant app-centric; dated UX; brand diluted across program types |
| **StoreHub** (MY) | RM102+/mo + hardware | **POS with built-in loyalty** (points/cashback, receipt-driven) | Zero-effort capture at checkout; big MY install base — a distribution moat | Requires their POS + hardware; loyalty is a feature, not the product; no white-label customer experience |
| **Chopz / Chop.asia / ChopChop** (MY) | Low/freemium | Consumer marketplace stamp apps | Cheap, local | Customers join *their* app/marketplace — merchant's brand and data are diluted; discovery model, not retention model |

### Direct — global
| Platform | Price | Model | Strengths | Exploitable gaps |
|---|---|---|---|---|
| **Loopy Loyalty** (PassKit) | $15–95/mo | Wallet-native stamp cards | True Apple/Google Wallet passes, multi-reward milestones, up to 30 stamps, Stamper app | Stamps only (no campaigns/CRM to speak of); **data export locked behind $95/mo**; one card design on basic; no WhatsApp; zero SEA localization |
| **Stamp Me** | $49–199/mo | Consumer app + merchant console | Birthday club, scratch-and-win gamification, SMS/push, remote stamping | **Customers must download the Stamp Me app** — the friction we exist to remove; no WhatsApp; not white-label |
| **BonusQR / Stampit / Passtastic / FaveCard** | $10–50/mo | Budget wallet-pass tools | Cheap wallet passes, NFC/QR distribution | Thin merchant dashboards, no campaigns, no SEA channels, no white-label depth |

### Indirect
- **Touch 'n Go / GrabRewards / ShopeePay vouchers** — ecosystem loyalty. Merchant gets traffic but owns neither the relationship nor the data. Useful in pitch: "their loyalty program, not yours."
- **Paper cards** — the real incumbent for most kopitiams. Cheap, but lost cards, no data, easy fraud. Our `/compare` page target.

## 2. Where Kembali wins — the open square

Plotting the field on two axes — *wallet-native passes* × *SEA-local retention channels (WhatsApp, BM/CN, PDPA)*:

- Stampede: local channels ✅, wallet ❌
- Loopy/Eber: wallet ✅, local channels ❌ (or ✅ only at SGD 299 enterprise pricing)
- StoreHub: neither (POS capture instead), distribution ✅
- **Kembali: both, at SME price — the empty quadrant.**

## 3. Differentiation strategy (in priority order)

1. **Web card + wallet pass, one identity.** Nobody in SEA does both at SME price: Stampede is web-only, Loopy is wallet-only-thin, Eber is enterprise. The PWA is the source of truth; the pass is a projection that updates on every stamp (Phase 2). Demo pass on the marketing site sells this by itself.
2. **WhatsApp-first retention at stamp-card simplicity** (Phase 3). Global wallet tools have zero WhatsApp; local tools that have it lack wallet. The combination is the moat — each half is copyable, the pair is a rebuild.
3. **"Your brand, your data — always."** White-label by default (vs Chopz marketplace dilution) **and free data export from day one** (vs Loopy's $95 ransom). Costs us nothing (PDPA obliges export anyway), positions us as the honest option, and de-risks switching *to* us: build paper-card + competitor import (CSV) early.
4. **Radical simplicity as a feature.** Eber/Poket win feature checklists and lose the kopitiam owner. We ship stamps only, plain-English reports, 10-minute setup, staff's own phone. Say no to points/tiers publicly until Phase 5+ — "simple" is only credible if we visibly refuse complexity.
5. **POS-independent, then POS-friendly.** StoreHub's bundling is their moat and their cage (hardware + lock-in). We work with any till today, integrate via API in Phase 5 — including *with* StoreHub if they'll have us.
6. **Certification-ready trust posture.** ASVS L2 / PDPA / append-only ledgers (SECURITY.md) — none of the SME competitors talk security. Sales wedge for chains and franchises, who ask.

## 4. What NOT to compete on
- **Program-type breadth** (points, tiers, cashback, memberships) — Eber/Poket own it; it contradicts wedge #4. Backlog stays backlog.
- **Consumer marketplace/discovery** (Chopz model) — dilutes merchant brand; explicitly rejected. One exception preserved in backlog: the *customer-side* card switcher for people holding several Kembali cards — utility, not marketplace.
- **POS hardware** — never. Staff phone camera is the terminal.
- **Price war at the bottom** (BonusQR tier) — compete on the wallet+WhatsApp pair and local trust, not on being cheapest.

## 5. Threats & watch items
- **Stampede adds wallet passes** — most likely fast-follow; our answer is shipping Phase 2 first and owning "wallet" positioning in MY SEO now. Watch their changelog/blog.
- **StoreHub distribution** — can't outsell a POS bundle; coexist via independence + integration (wedge #5).
- **Eber moves downmarket** with a cheap stamps tier — watch pricing page.
- **WhatsApp template costs/approval delays** — margin and UX risk for wedge #2; meter credits from day one (already planned).

## 6. Sources (checked 2026-07-09)
- stampede.sg/features · stampede.sg blog
- loopyloyalty.com/pricing · favecard.co Loopy review · passkitalternatives.com
- stampme.com/features · loyaltypass.co comparisons
- advocadoapp.com · eber.co · capterra.com.sg (Eber pricing)
- poket.com (+ MY pricing page) · storehub.com/pricing · lp.storehub.com/my/loyalty-pos
- app.chopz.my · chop.asia · ringgitplus.com (ChopChop)
