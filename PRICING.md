# Kembali — Pricing Strategy (approved by founder 2026-07-09)

> **Billing operations:** no payment processing in-product (Decision Log 2026-07-09). Subscriptions are collected by **manual invoice — bank transfer/DuitNow**. Stripe deferred until self-serve public launch at the earliest. Trials need no card because we take no cards.

> Companion to `COMPETITORS.md`. FX 9 Jul 2026: USD/MYR ≈ 4.08, SGD/MYR ≈ 3.16. Re-verify before publishing a pricing page.

## 1. Market anchors (per outlet/month, MYR)

| Player | MYR | Note |
|---|---|---|
| Loopy Loyalty | 61–387 | Wallet stamps only; data export locked at RM387 tier |
| StoreHub | 102 (+hardware RM1.7–2.2k) | Entire POS — the local price ceiling for "software for my shop" |
| Stampede | ≈204 ($50) | Closest analogue: web card + WhatsApp, no wallet |
| Stamp Me | 200–811 | Requires consumer app download |
| Advocado | ≈499 (SGD158) | CRM-heavy |
| Eber | ≈944 (SGD299) | Enterprise; has wallet passes |

Two anchors matter: **StoreHub RM102** sets what a kopitiam thinks software costs; **Stampede RM204** sets the price of our closest feature set. Kembali should live between them at launch and never cross ~RM399 for standard plans.

## 2. The ladder

### Months 0–6 — Founding merchant program (pitching now)
- **RM99/outlet/month**, first ~20 merchants, 30-day free pilot first, rate locked 12 months.
- They get every feature as it ships (wallet, WhatsApp, referrals) at no plan change.
- In exchange (written into the deal): logo + numbers usable as case study, monthly feedback call, Google review at month 2.
- Why RM99: under StoreHub's POS price (an easy "yes"), 50% under Stampede (we lack their campaigns until Phase 3), high enough to filter non-serious merchants and signal quality. Free pilots convert; free plans attract tenants who cost OTP money and never engage.

### Public launch (Phase 2 shipped) — two plans, deliberately only two
| | **Starter** | **Growth** | Ships |
|---|---|---|---|
| Price | **RM149**/outlet/mo | **RM279**/outlet/mo | |
| Stamp card, PWA, cashier scan, reports | ✅ | ✅ | now |
| Team roles + permissions | ✅ | ✅ | now |
| Points (RM→points) + rewards redemption | ✅ | ✅ | Phase 2 (next) |
| Data export (CSV) | ✅ always free | ✅ always free | Phase 1 |
| **Apple/Google Wallet passes** | ✅ | ✅ | Phase 3 |
| VIP/staff member tags (point multipliers) | — | ✅ | Phase 3 |
| WhatsApp automations (welcome/birthday/win-back) | — | ✅ | Phase 4 |
| Campaigns + segments | — | ✅ | Phase 4 |
| Referral program | — | ✅ | Phase 5 |
| Custom domain white-label | — | ✅ | Phase 6 |
| Message credits included | — | RM30/mo | Phase 4 |
- Annual billing: pay 10 months, get 12.
- Chains: −20% at 5+ outlets; 10+ outlets custom (Phase 5: API, POS, SLA) — target RM199/outlet effective at volume.
- 14-day trial, no card required, no setup fee.

### Months 12–24 ceiling (wallet + WhatsApp proven, case studies live)
- Starter → **RM179**, Growth → **RM329–349**. Grandfather founding merchants at −20% forever.
- Rationale: still ~35% of Advocado and ~65–85% cheaper than Eber while matching their headline features for stamps-first shops.

## 3. Metered messaging (Phase 3) — credits, not unlimited

Meta's per-message costs (MY, 2026): marketing ≈ RM0.35, utility/auth ≈ RM0.056, service replies free. Therefore:
- Sell credits: **RM0.50 per marketing message** (~30% margin), **RM0.10 per utility message**. Top-ups RM30/RM100/RM300.
- Never "unlimited WhatsApp" — one aggressive merchant would erase a month of margin.
- OTP logins ride the auth rate (≈RM0.06/login) — absorbed in plan COGS, budgeted below.

## 4. Unit economics sanity check (per outlet, monthly, rough)

| | RM |
|---|---|
| Revenue (Starter) | 149 |
| Infra (DB/hosting/Sentry, amortized) | ~10–15 |
| OTP/auth messages (~300 logins) | ~18 |
| Payment processing (manual invoice/DuitNow) | ~0 |
| **Gross margin** | **~70–75%** |

Growth plan margin is higher (credits carry their own margin). Founding RM99 still clears ~60% — acceptable to buy case studies.

## 5. Hard rules (pricing promises we never break)
1. **Data export is free on every plan, forever** — direct hit on Loopy's $95 ransom; PDPA obliges us anyway. Say it on the pricing page.
2. No setup fees, no contracts, cancel anytime (market norm; Stampede sells this hard).
3. Wallet passes are in **Starter**, not gated — it's the differentiator; gating it kills the demo-pass funnel.
4. Price changes never hit existing merchants mid-term; founding cohort keeps −20% for life.
5. Two public plans maximum. A third plan is a smell that wedge #4 (simplicity) is eroding.

## 6. Pitch math for founder sales calls
"RM99 a month. One extra returning customer a day at RM12 average spend is RM360 a month — the program pays for itself at a third of a customer a day." (Stampede's own benchmark: repeat customers ≈ ⅓ of revenue, 59% coupon redemption.)

## 7. Open items
- [x] Founder approval (2026-07-09) → Decision Log row in ROADMAP §13
- [ ] SST/service-tax treatment for SaaS in MY (threshold + rate) — ask accountant before invoicing
- [ ] Re-verify all competitor prices the week the pricing page ships
- [ ] (deferred with Stripe) Verify Stripe Malaysia fees + FPX support when self-serve billing returns

## 8. Pricing page spec — `/pricing` (build next, with Phase 2)

Style: `brand/DESIGN-dub.md`. Copy: SOP 3 / ux-writing — sentence case, no jargon ("Coming soon", never "Phase 2"/"backlog"). Three cards:

**Founding merchant — RM99 /outlet/month** *(hero card, accent border, "Available now" badge)*
- Everything Kembali ships, as it ships — no plan change ever
- 30-day free pilot; rate locked 12 months; limited to the first 20 shops
- Includes today: digital stamp card, QR scan to stamp, customer profiles, team roles, reports, free data export
- CTA: "Become a founding merchant" → WhatsApp/email contact (no self-serve payment)

**Starter — RM149 /outlet/month** *("At launch" badge, muted)*
- Listed now: digital stamp card · QR scan to stamp · **points and rewards** · customer profiles · team roles · reports · free data export
- Greyed with ✨ "Coming soon": Apple/Google Wallet cards
- CTA (secondary): "Join as a founding merchant instead"
- *(2026-07-10: points+rewards shipped, so it moved from greyed to included — grey only what is genuinely unshipped.)*

**Growth — RM279 /outlet/month** *("At launch" badge, muted)*
- Everything in Starter, plus — all greyed ✨ "Coming soon": Apple/Google Wallet cards · WhatsApp reminders and campaigns · VIP member tags · referral rewards · your own domain · RM30 monthly message credits
- CTA (secondary): "Join as a founding merchant instead"

Below cards: annual note ("Pay for 10 months, get 12"), chains note ("5+ outlets: 20% off — talk to us"), FAQ (Do customers download an app? Do I need new hardware? What happens to my data if I leave? — free export, always). Prices in RM, per outlet, per month. No card required anywhere; payment is by invoice after the pilot.
