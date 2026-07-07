# Kembali — Digital Loyalty Platform Roadmap

> **Audience:** Founder (Firemind) + Claude Code. This document is the source of truth for requirements, architecture, phases, and structure. Update the Decision Log as choices are made.

---

## 1. Vision

**Kembali** (Malay: "return / come back") — a **multi-tenant SaaS** digital stamp-card loyalty platform for Malaysia/SEA F&B and local businesses (cafes, bubble tea, salons, gyms).

**Brand:** see `brand/BRAND.md`. Primary mark = return-loop icon (`brand/logo-a-return-loop.svg`), wordmark with coral final "i" (`brand/logo-d-wordmark.svg`), **Pandan palette** (deep pandan `#0F3D32` for actions, coral `#E0684B` for stamps/rewards, leaf `#7FB069` for progress, sand `#F6F1E3` canvas). All UI in `packages/ui` consumes BRAND.md tokens; tenants can white-label over them.

**Customer-experience-first principles (non-negotiable):**

1. **No app download, ever.** Customer card lives on a web app (PWA) and optionally in **Apple Wallet / Google Wallet**.
2. **Onboarding in under 30 seconds.** Scan QR → phone/email OTP → card issued.
3. **Stamping in under 3 seconds.** Staff scan customer QR with any phone camera; card updates in real time.
4. **Merchant's brand, not ours.** White-label: merchant logo, colors, custom domain.
5. **Payment-agnostic.** Works regardless of cash / Touch 'n Go / GrabPay / card.

**Business model:** per-outlet monthly subscription (reference: Stampede $50/mo per outlet, Loopy Loyalty $25/mo, Stamp Me $49–199/mo). Free trial, no contracts.

---

## 2. Market Research Summary

| Platform | Model | Wallet passes | Notable | Weakness/gap |
|---|---|---|---|---|
| **Stampede (stampede.sg)** | Web-app card, ~$50/mo/outlet | ❌ (browser/PWA only) | WhatsApp/email/SMS campaigns, AI weekly reports, food AI photos, Meta ads, fraud detection, referrals, custom domain, multi-outlet, phone+4-digit-code login, 3-sec cashier scan | No Apple/Google Wallet |
| **Loopy Loyalty** (by PassKit) | $25/mo | ✅ native | Wallet-first stamp cards, location-based lock-screen notifications | Stamps only — no points/tiers/memberships; limited campaigns |
| **Stamp Me** | $49–199/mo | Own app | Analytics, segmentation, SMS, multi-reward cards | Requires customer app download |
| **PassKit** | Enterprise API | ✅ | Full wallet infra (loyalty, coupons, membership) | Developer-heavy, enterprise pricing |
| **BonusQR / Stampit / Passtastic / FaveCard** | $10–50/mo | ✅ | Budget wallet-pass stamp cards, QR/NFC distribution, push to lock screen | Thin merchant dashboards, weak SEA localization |

**Our differentiation = Stampede's CX + merchant tooling AND wallet-native passes (which Stampede lacks), localized for MY/SEA (WhatsApp-first, BM/EN/CN, PDPA).**

### Feature/module inventory observed across the market

- **Customer:** web stamp card, wallet passes, QR identity, milestone rewards, welcome/birthday/referral rewards, coupon wallet with expiry reminders, OTP login, opt-in notification preferences, multi-language.
- **Cashier:** camera scan-to-stamp, on-the-spot coupon redemption, works on any phone, per-branch staff accounts, activity attribution.
- **Merchant admin:** real-time dashboard (stamps, signups, redemptions, referrals), customer CRM with visit history, reward/milestone configuration, multi-outlet management, branch reporting, fraud flags, campaign builder (WhatsApp/email/SMS/push), customer import, white-label/custom domain.
- **Platform ops:** tenant billing, plan limits, usage metering (message credits), analytics, super-admin.

---

## 3. Recommended Stack

**TypeScript end-to-end, monorepo.**

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15+ (App Router) + TypeScript** | One framework for marketing site, customer PWA, and merchant dashboard; RSC for fast mobile loads; huge ecosystem |
| Monorepo | **Turborepo + pnpm** | Shared packages (db, passes, ui) across 3 apps |
| Database | **PostgreSQL** (Neon or Supabase) | Relational fits loyalty ledger; **Row-Level Security for tenant isolation** |
| ORM | **Drizzle** (or Prisma) | Type-safe, migration-friendly |
| Cache/queues | **Redis (Upstash)** + BullMQ or QStash | OTP throttling, QR token cache, async pass updates & webhooks |
| Auth | **Custom OTP (phone via SMS/WhatsApp, email fallback)** with Lucia-style sessions for customers; email+password+2FA for merchants (or Auth.js) | Matches "30-second login" CX; SEA users are phone-first |
| Apple Wallet | **`passkit-generator` (npm)** + Apple Developer account (Pass Type ID cert, WWDR cert) + **APNs** for pass updates + PassKit Web Service (`webServiceUrl`) | Standard, proven path; storeCard pass type |
| Google Wallet | **Google Wallet REST API** — `loyaltyClass` (template per merchant) + `loyaltyObject` (per customer), signed **JWT "Save to Google Wallet"** links | Official API, free |
| Messaging | **WhatsApp Business Cloud API (Meta)**, SMS fallback (e.g. MessageBird/Twilio), email (Resend/SES) | WhatsApp is the SEA channel |
| Payments/billing | **Stripe Billing** (+ local methods later: FPX, Touch 'n Go via Stripe/Xendit) | Subscription per outlet |
| Hosting | **Vercel** (apps) + Neon/Supabase (DB) + Upstash (Redis) | Zero-ops for a solo founder; revisit at scale |
| Observability | Sentry + Axiom/Logtail | Errors + audit trail |
| Realtime | Supabase Realtime or Pusher/Ably | Live card update after stamp |

### Monorepo layout

```
mobileLoyalty/
├── apps/
│   ├── marketing/        # public site (stampcard.example)
│   ├── app/              # customer PWA + cashier scanner (card.<merchant-domain>)
│   └── admin/            # merchant CMS/dashboard (+ super-admin)
├── packages/
│   ├── db/               # Drizzle schema, migrations, RLS policies
│   ├── passes/           # Apple/Google pass generation + update service
│   ├── core/             # domain logic: stamping, rewards, fraud rules
│   ├── ui/               # shared components, theming/white-label engine
│   └── config/           # eslint, tsconfig, env validation (zod)
└── ROADMAP.md
```

---

## 4. Core Data Model (initial)

```
tenants (merchant orgs)         plans, billing_status, branding (logo, colors, domain)
outlets                         tenant_id, name, geo, timezone
staff_users                     tenant_id, outlet_ids[], role (owner|manager|cashier)
customers                       phone/email (unique per tenant), language, birthday, marketing_opt_ins
cards                           customer_id, program_id, stamps_count, status
programs                        tenant_id, stamps_required, reward_definitions[], expiry_rules
stamp_events (append-only)      card_id, outlet_id, staff_id, source (qr|manual), created_at
rewards / coupons               card_id, type, state (earned|redeemed|expired), expires_at
referrals                       referrer_customer_id, referee_customer_id, state
wallet_passes                   card_id, platform (apple|google), serial, auth_token, last_pushed_at
device_registrations            (Apple PassKit web service: device ↔ pass)
messages                        channel, template, status, cost_credits
audit_log                       actor, action, entity, tenant_id
```

**Rules:** every stamp is an immutable ledger event (fraud analysis + audit). `stamps_count` is a denormalized projection. All tenant tables carry `tenant_id` with Postgres RLS.

---

## 5. Security Implementation

### Identity & auth
- **Customers:** OTP (WhatsApp/SMS/email) → httpOnly session cookie. No passwords. Rate-limit OTP per phone/IP (Redis).
- **Merchant staff:** email+password + optional TOTP 2FA; role-based access (owner/manager/cashier); cashiers scoped to assigned outlets.
- **Sessions:** short-lived + rotating refresh; secure/sameSite cookies.

### QR anti-fraud (critical design)
- Customer QR = **signed, rotating token** (JWT/HMAC, TTL 60–120s, regenerated client-side via server-issued key or refetch). Prevents screenshot-sharing and replay.
- Stamp API validates: token signature + TTL, staff session, outlet match, **velocity rules** (min interval per card, max stamps/day/card, per-cashier hourly caps).
- Anomaly flags surfaced in merchant activity log (Stampede-style: "10 stamps in 5 min from same cashier → flag").

### Tenant isolation
- Postgres **RLS on every tenant table**, tenant resolved from subdomain/custom domain + session. No cross-tenant queries possible even on app bugs.

### Wallet credentials
- Apple pass-signing certs + APNs keys and Google service-account keys in a **secrets manager** (Vercel encrypted env / Doppler), never in repo. Per-pass `authenticationToken` for the Apple web service endpoints.

### Platform hygiene
- Input validation with zod at every boundary; parameterized queries via ORM.
- Rate limiting on all public endpoints; CAPTCHA on signup if abused.
- Webhooks (Stripe, WhatsApp) signature-verified.
- Append-only audit log for all privileged actions.
- **PDPA (Malaysia) / PDPA (SG) compliance:** explicit marketing opt-in per channel, data export + delete endpoints, retention policy, privacy policy page.
- HTTPS everywhere; HSTS; CSP headers; dependency scanning (Renovate + `pnpm audit`).
- Backups: PITR on Postgres; disaster-recovery runbook.

---

## 6. Wallet Integration Design

### Apple Wallet (storeCard pass)
1. Apple Developer account → **Pass Type ID** + certificate; download WWDR intermediate cert.
2. Generate `.pkpass` per card with `passkit-generator`: merchant branding, stamp progress (e.g. strip image regenerated per stamp count), barcode = customer QR token URL.
3. Implement **PassKit Web Service** (`webServiceUrl`): device registration, get-updated-pass, unregister, log endpoints, authenticated by per-pass `authenticationToken`.
4. On stamp/reward: update pass record → **APNs push** (empty payload to pass topic) → device pulls new `.pkpass`.
5. Lock-screen relevance: `locations[]` (outlet geo) so the pass surfaces near the store.

### Google Wallet (Loyalty)
1. Google Pay & Wallet Console → issuer account + service account.
2. One **`loyaltyClass`** per merchant program (template: logo, colors, program name); one **`loyaltyObject`** per customer card (points/stamps balance, QR barcode).
3. Distribution: **"Add to Google Wallet"** signed JWT link/button in the web card.
4. Updates: PATCH `loyaltyObject` on each stamp; class-level messages for promos.

### Web card (source of truth UX)
- The PWA card always works even without wallet; wallet passes are projections. "Add to Apple Wallet" / "Add to Google Wallet" buttons shown by device detection.

---

## 7. Phases

### Phase 0 — Foundations (Week 1–2)
- Monorepo scaffold (Turborepo, Next.js apps, Drizzle, CI with GitHub Actions).
- DB schema v1 + RLS; env validation; Sentry; seed scripts.
- Apple Developer + Google Wallet Console accounts (start early — approval takes time).
- **Exit criteria:** deploy pipeline green; schema migrated; hello-world on all 3 apps.

### Phase 1 — MVP: Core loyalty + Wallet (Week 3–8) ← *current target*
- **Customer PWA:** OTP login, branded stamp card, live stamp animation, reward list, Add to Apple/Google Wallet.
- **Cashier flow:** staff login → camera QR scan → stamp/redeem in ≤3s, offline-tolerant retry.
- **Merchant admin:** onboarding wizard (branding, program setup: X stamps → reward), outlet + staff management, customer list, basic dashboard (stamps/signups/redemptions today).
- **Wallet:** Apple pass issue + APNs update; Google loyaltyObject issue + PATCH update.
- **Security:** rotating QR tokens, velocity rules v1, RLS, audit log.
- **Billing:** Stripe subscription, 14-day trial, plan gate (1 outlet).
- **Exit criteria:** 1 pilot merchant live; stamp→wallet-update round trip <5s; zero cross-tenant leakage (tested).

### Phase 2 — Retention engine (Week 9–14)
- Welcome / birthday / milestone rewards; coupon expiry reminders.
- **WhatsApp Cloud API** notifications (opt-in), email fallback; message-credit metering.
- Referral links (both-sides reward), win-back automation ("we miss you").
- Customer CRM: visit history, segments (active / slipping / lapsed).
- Multi-language: EN + BM (+ CN templates).
- **Exit criteria:** ≥1 automated campaign live per pilot merchant; opt-in/out fully honored.

### Phase 3 — Multi-outlet & analytics (Week 15–20)
- Cross-outlet stamping/redemption, per-branch reporting, staff-per-branch permissions.
- Fraud dashboard (flags, per-cashier stats).
- Analytics: repeat-visit rate, member share of transactions, redemption rate, time-between-visits.
- Custom domains per merchant (white-label), theming polish.
- Customer import (CSV) for merchants migrating from paper/other platforms.
- **Exit criteria:** a 2+ outlet chain running; weekly merchant report email.

### Phase 4 — Growth & platform (Week 21+)
- Public **API + webhooks** (POS integrations later: Square/StoreHub/Feedme are SEA-relevant).
- Points/tiers mode (beyond stamps) — competitive gap vs Loopy Loyalty.
- AI weekly plain-English reports; campaign send-time optimization.
- Meta ads integration, Google Wallet smart-tap/NFC exploration, lock-screen geo notifications.
- Reseller/agency (white-label) tier; SG/PH/ID expansion; local billing (FPX, TNG).

---

## 8. Merchant CMS (admin app) structure

```
/login, /signup, /onboarding (wizard: brand → program → outlet → staff → QR kit)
/dashboard                    # today: stamps, signups, redemptions, referrals (realtime)
/customers                    # list, segments, search
/customers/[id]               # visit history, stamps, coupons, messages
/programs                     # stamp card config: milestones, rewards, expiry, welcome/birthday
/outlets                      # branches, geo, QR posters (printable PDF)
/staff                        # invites, roles, branch assignment
/campaigns                    # WhatsApp/email/SMS builder, templates, credits balance
/automations                  # birthday, win-back, milestone nudges (toggle + edit)
/analytics                    # retention, per-branch, redemption, cohort charts
/activity                     # audit log + fraud flags
/settings                     # branding, custom domain, languages, billing, API keys, data (PDPA export/delete)
Super-admin (internal): /tenants, /usage, /billing-health, /feature-flags
```

## 9. Customer frontend (PWA) structure

```
/                             # merchant-branded landing → "Join & get your card"
/join                         # phone → OTP → (name, birthday optional) → card issued
/card                         # THE screen: stamp grid, animated progress, personal QR,
                              #   Add-to-Apple-Wallet / Add-to-Google-Wallet buttons
/rewards                      # earned coupons, expiry countdown, redemption state
/refer                        # personal referral link/QR, reward explainer
/profile                      # language, notification opt-ins (WhatsApp/email), delete account
/scan (staff-only route)      # cashier camera scanner + claim-coupon panel
```
- Installable PWA (manifest + service worker); works fully in browser per CX principle #1.
- Loads <2s on mid-range Android over 4G (performance budget).

## 10. Marketing site structure

```
/                 # Hero: "Loyalty cards your customers never lose." Live demo card in
                  #   Apple/Google Wallet mock; scan-to-join demo QR; primary CTA: Start free
/how-it-works     # 3 steps for customers (scan → stamp → reward) + 3 for staff — CX-first
/features         # sections mirroring modules: customer card, wallet passes, cashier scan,
                  #   dashboard, campaigns, referrals, multi-outlet, fraud, white-label
/integrations     # Apple Wallet, Google Wallet, WhatsApp Business, Stripe, (POS: roadmap)
/pricing          # per-outlet/month, trial, FAQ (no app? no hardware? PDPA?)
/roadmap          # public high-level roadmap (builds trust; mirrors Phases above)
/blog             # SEO: "digital stamp card for <vertical> in <city>" (Stampede's playbook)
/case-studies     # pilot merchant results (member count, redemption rate)
/signup, /demo    # self-serve trial + demo card anyone can add to their own wallet
/privacy, /terms
```
**Positioning line:** *"Kembali — the stamp card that lives in Apple Wallet & Google Wallet. No app for your customers, no hardware for your staff, set up in 10 minutes."* (Name doubles as tagline: *"Make them kembali."*)

**Marketing visual language:** Pandan palette on sand canvas; the archived stamp-grid mark (`brand/logo-c-last-stamp.svg` — 8 stamps + return arrow) is the hero illustration motif; serif display (Fraunces/Lora) for headlines, Plus Jakarta Sans for UI.

**Best growth asset:** the `/demo` page issues a real demo pass to the visitor's wallet — the product sells itself.

---

## 11. KPIs

- **Merchant-side:** trial→paid conversion, churn, outlets per tenant.
- **Product:** join-flow completion rate (>80%), wallet-add rate, stamp→wallet-update latency (<5s), scan success rate.
- **End-customer (the numbers merchants buy for):** repeat-visit rate, member share of transactions (target >33%), coupon redemption rate (Stampede benchmark: 59%).

## 12. Risks

- **Apple pass update infra is the hardest MVP piece** (certs, APNs, web service protocol) — prototype in Phase 0, not Phase 1's end.
- **WhatsApp API costs/approval** — template approval lead time; meter credits from day one.
- **QR fraud** — mitigated by rotating signed tokens + velocity rules (see §5).
- **Incumbent moat (Stampede)** — compete on wallet-native passes + pricing + niche verticals first.
- **Solo-founder scope** — phases are strictly sequential; resist pulling Phase 4 items forward.

## 13. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-07 | Multi-tenant SaaS from day one | Founder choice; avoids re-architecture |
| 2026-07-07 | Malaysia/SEA first | WhatsApp-first market, blog context, incumbent gap |
| 2026-07-07 | Next.js + TS monorepo, Postgres RLS | Best fit for 3 web surfaces + wallet services |
| 2026-07-07 | Wallet passes in MVP | Core differentiator vs Stampede |
| 2026-07-07 | Brand name **Kembali** | "Come back" in Malay = the product promise; clear of Chop*/Stamp* crowd (trademark search pending) |
| 2026-07-07 | Logo = return-loop mark + wordmark; **Pandan palette** | Founder choice; specs in `brand/BRAND.md` |

## 14. References

- Stampede features & blog: https://stampede.sg/features , https://stampede.sg/blog/stamp-card-for-cafe-in-kuala-lumpur
- Apple Wallet updates: https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html
- Google Wallet loyalty: https://developers.google.com/wallet/retail/loyalty-cards
- Competitors: https://loopyloyalty.com , https://www.stampme.com , https://passkit.com/loyalty-card/ , https://bonusqr.com , https://stampit.app/en
