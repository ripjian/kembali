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

> **Deep dive: `COMPETITORS.md`** (2026-07-09) — full SEA + global landscape (Advocado, Eber, Poket, StoreHub, Chopz, Loopy, Stamp Me), differentiation wedges, non-goals, threat watch. The table below is the original 2026-07-07 snapshot.

| Platform | Model | Wallet passes | Notable | Weakness/gap |
|---|---|---|---|---|
| **Stampede (stampede.sg)** | Web-app card, ~$50/mo/outlet | ❌ (browser/PWA only) | WhatsApp/email/SMS campaigns, AI weekly reports, food AI photos, Meta ads, fraud detection, referrals, custom domain, multi-outlet, phone+4-digit-code login, 3-sec cashier scan | No Apple/Google Wallet |
| **Loopy Loyalty** (by PassKit) | $25/mo | ✅ native | Wallet-first stamp cards, location-based lock-screen notifications | Stamps only — no points/tiers/memberships; limited campaigns |
| **Stamp Me** | $49–199/mo | Own app | Analytics, segmentation, SMS, multi-reward cards | Requires customer app download |
| **PassKit** | Enterprise API | ✅ | Full wallet infra (loyalty, coupons, membership) | Developer-heavy, enterprise pricing |
| **BonusQR / Stampit / Passtastic / FaveCard** | $10–50/mo | ✅ | Budget wallet-pass stamp cards, QR/NFC distribution, push to lock screen | Thin merchant dashboards, weak SEA localization |

**Our differentiation = Stampede's CX + merchant tooling AND wallet-native passes (which Stampede lacks), localized for MY/SEA (WhatsApp-first, BM/EN/CN, PDPA).**

> **2026-07-08:** wallet-native passes are **Phase 2** — the MVP ships on the web PWA card first, wallet follows immediately after (§7). Still the differentiator vs Stampede.

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
│   └── web/              # ONE Next.js server, three surfaces by route:
│       └── src/app/
│           ├── (marketing)/   #   /  and  /roadmap  (public site)
│           ├── app/           #   /app — customer PWA + cashier scanner
│           └── admin/         #   /admin — merchant CMS (+ super-admin)
├── packages/
│   ├── db/               # Drizzle schema, migrations, RLS policies
│   ├── passes/           # Apple/Google pass generation + update service
│   ├── core/             # domain logic: stamping, rewards, fraud rules
│   ├── ui/               # shared components, theming/white-label engine
│   └── config/           # eslint, tsconfig, env validation (zod)
└── ROADMAP.md
```

### Routing (decided 2026-07-07, simplified same day): one server, path-based

A single Next.js app (`apps/web`) serves everything on the base domain: the `(marketing)` route group owns `/` and `/roadmap`, the customer PWA lives under **`/app`**, admin under **`/admin`**. Each surface has its own nested layout (fonts, theme, chrome) — marketing is light-locked via scoped tokens, app/admin keep dark mode. One process, one deploy, no zones/rewrites. Merchant custom domains (Phase 3) will map onto the `/app` surface; revisit splitting into separate deployments only if scale demands it.

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
point_events (append-only)      customer_id, delta, source (transaction|adjustment|redemption), reason, staff_id
customers.points_balance        read-only projection = Σ point_events (never UPDATEd directly)
reward_items                    tenant_id, title, description, image_url, points_cost, active
redemptions                     reward_item_id, customer_id, code (unique, single-use), state (reserved|redeemed|expired|cancelled), redeemed_by_staff_id, outlet_id
member_tags                     tenant_id, name, points_multiplier (REPLACES base rate), enabled
customers.tag_id                nullable FK → member_tags; changes audit-logged
referrals                       referrer_customer_id, referee_customer_id, state
wallet_passes                   card_id, platform (apple|google), serial, auth_token, last_pushed_at
device_registrations            (Apple PassKit web service: device ↔ pass)
messages                        channel, template, status, cost_credits
audit_log                       actor, action, entity, tenant_id
```

**Rules:** every stamp AND every point movement is an immutable ledger event (fraud analysis + audit). `stamps_count` and `points_balance` are denormalized projections. Point adjustments always carry a reason and are customer-visible. All tenant tables carry `tenant_id` with Postgres RLS.

---

## 5. Security Implementation

> **`SECURITY.md` is the enforceable version of this section** — hard rules, the standards we follow (OWASP ASVS 5.0 L2, ISO/IEC 27001:2022 alignment, Malaysia PDPA incl. the 2024 Amendment, SOC 2 later), a control map, and the pre-merge checklist. Read it before touching auth, data, or anything tenant-facing.

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

## 6. Wallet Integration Design — **Phase 3**

> **Status (2026-07-09):** moved to Phase 3 — points & rewards became Phase 2. Nothing in Phases 1–2 may depend on it. The Apple Developer + Google Wallet Console applications have long lead times — **start them during Phase 1**.

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

### What each phase achieves (one line each)

| Phase | Outcome |
|---|---|
| 0 + 0.5 ✅ | Rails and a public face: monorepo, schema + RLS, CI, marketing site live |
| 1 ← *now* | A shop runs stamps end-to-end (sellable MVP; subscriptions invoiced manually) |
| 2 | Spending becomes points, points become rewards — redeemed in-store with unique codes |
| 3 | The card lives in Apple & Google Wallet, plus VIP member tags — the differentiator |
| 4 | Retention on autopilot: WhatsApp brings lapsed customers back without merchant effort |
| 5 | Growth loop: happy customers recruit new customers |
| 6 | Platform: POS/API integrations, multi-outlet chains, deep analytics |

### Phase 0 — Foundations (Week 1–2) ✅ *done 2026-07-07*
- Monorepo scaffold (Turborepo, Next.js apps, Drizzle, CI with GitHub Actions).
- DB schema v1 + RLS; env validation; Sentry; seed scripts.
- Apple Developer + Google Wallet Console accounts → **now a Phase 1 to-do** (wallet is Phase 2; approvals take weeks — founder action).
- **Exit criteria:** deploy pipeline green; schema migrated; hello-world on all 3 apps. ✅

### Phase 0.5 — Public face (interleaved) ✅ *done 2026-07-08*
- Marketing landing page at the base domain: what the system is, how it works, and an interactive reach-out section (3 multiple-choice questions narrowing business type + needs → tailored pitch + contact CTA).
- `/roadmap` page: high-level public roadmap with per-phase animations.
- One-server routing: `/` marketing, `/app` customer PWA, `/admin` merchant admin.

> **Phase order re-set by founder 2026-07-08:** loyalty + basic reports → wallet passes → WhatsApp → referrals → API/POS. Complex analytics deferred to the platform phase. Supersedes the 2026-07-07 sequencing below the decision log.
> **Re-set again by founder 2026-07-09:** points + rewards inserted as **Phase 2**; wallet passes → Phase 3 (with member tags), WhatsApp → 4, referrals → 5, API/POS → 6. No payment processing in-product — subscriptions invoiced manually; Stripe deferred.

### Phase 1 — MVP: Core loyalty + basic reports ← *current, first working build 2026-07-08*
- ✅ **Customer PWA:** OTP login/register (dev bypass code, non-production only), branded stamp card, rotating QR, rewards + promo section, recent spends.
- ✅ **Cashier flow:** staff login → camera QR scan (BarcodeDetector; paste fallback) → amount → stamp; velocity rules; daily view at the counter.
- ✅ **Merchant admin:** customer list/detail/create (PDPA opt-ins), team roles, reward redemption. Platform admin: add merchants (tenant+outlet+program+owner login), module toggles, password resets — all audit-logged.
- ✅ **Basic reports (shipped):** stamps/sales/new customers/repeat-rate/redemption-rate over 7/30 days, stamps-per-day, top regulars. Complex analytics stays Phase 6.
- ✅ **Security:** rotating signed QR tokens (90s TTL), velocity rules v1, scrypt passwords, hashed session tokens, RLS, audit log.
- **Billing (re-decided 2026-07-09):** **no payment processing in-product.** Subscriptions collected by manual invoice (bank transfer/DuitNow). Stripe deferred until self-serve public launch at the earliest. Transaction key-in during stamping is record-keeping only (POS/payments = maybe, much later).
- ⬜ **Remaining:** real OTP delivery (SMS/WhatsApp provider), merchant onboarding wizard polish, printable QR kit.
- **Exit criteria:** 1 pilot merchant live; stamp→card-update round trip <5s in the web PWA; zero cross-tenant leakage (tested).

### Phase 2 — Points & rewards *(inserted 2026-07-09, founder)* ← *core shipped 2026-07-10*
**Points**
- ✅ Per-merchant **RM→points conversion rate** on the admin Rewards page (0 pauses earning); points accrue from the transaction amount keyed in at scan-to-stamp (key-in stays record-keeping only — no payments).
- ✅ Ledger pattern identical to stamps: append-only `point_events`; `points_balance` is a **read-only projection** — a DB trigger maintains it and rejects direct UPDATEs, so balance = Σ events by construction.
- ✅ **Point adjustments:** add/deduct on the customer profile (reason required, `adjustPoints` permission, can't push below zero). Every adjustment is a ledger event, audit-logged, and **visible to the customer** in their own history.
- ✅ Customer profile/transactions show a points column per transaction + uneditable total points field (admin and customer views).
- ✅ Reports: points earned/spent tiles, points by customer, adjustments log.
**Rewards**
- ✅ Merchant config: rewards catalog — title, description, square image ≤512 KB, points cost, active toggle (`manageRewards` permission).
- ✅ Customer home after login: **stamp card first** with a "Show QR" CTA (modal: QR + fallback code + dismiss); **rewards section below** with affordability hints.
- ✅ Reward detail page → redeem CTA at the bottom → "Are you at the store right now?" confirmation → only then a **unique, single-use coupon code + QR** (KMB-XXXX-XXXX, 15-min TTL; customer can cancel; screen flips live when staff confirm).
- ✅ Cashier flow is **two big buttons**: **Scan member** (→ key in amount → stamp + points) and **Scan reward** (→ shows which reward + which member → confirm redemption). Points leave the balance at confirm, not reserve — abandoned coupons cost nothing.
- ✅ Redemption states: reserved (QR shown) → redeemed (staff confirm) → expired/cancelled. Rewards reports: redemptions by reward + latest redemptions with staff. (Per-outlet split arrives with multi-outlet in Phase 6 — single-outlet merchants today.)
- ✅ Platform admin: points/rewards module toggles in merchant create/edit.
- **Exit criteria:** ⬜ full earn→redeem loop live at a pilot merchant; ✅ ledger reconciles in tests (balance = Σ events, stamps and points); ✅ redemption codes provably single-use under concurrent scans (`packages/db/src/test/points.test.ts`).

### Phase 3 — Apple & Google Wallet passes + member tags
- Full wallet design in §6: Apple storeCard + PassKit web service + APNs updates; Google `loyaltyClass`/`loyaltyObject` + signed JWT links.
- "Add to Apple Wallet / Google Wallet" buttons on the web card; web card stays the source of truth.
- `/demo` marketing page issuing a real demo pass to the visitor's wallet — best growth asset.
- **Member tags (VIP/Staff):** created under points settings as inline rows — tag name, points multiplier, enable/disable. Multiplier **replaces** the base rate, not stacks (info "i" tooltip must say exactly that). Customer profile gets a tag dropdown. Tag assignments and changes are audit-logged.
- **Prerequisite with lead time:** Apple Developer + Google Wallet Console accounts — **start applications now, during Phase 1** (approval takes weeks).
- **Exit criteria:** stamp→wallet-update round trip <5s; passes survive cert rotation; tagged member earns multiplied points correctly.

### Phase 4 — WhatsApp retention engine
- Welcome / birthday / milestone rewards; reward-expiry reminders; win-back automation ("we miss you").
- **WhatsApp Cloud API** notifications (opt-in), email fallback; message-credit metering; template approval lead time.
- Customer CRM: visit history, segments (active / slipping / lapsed).
- Multi-language templates: EN + BM (+ CN).
- **Exit criteria:** ≥1 automated campaign live per pilot merchant; opt-in/out fully honored.

### Phase 5 — Referrals
- Personal referral links/QRs, both-sides rewards, anti-abuse rules (self-referral, velocity).
- Referral performance in the merchant dashboard.
- **Exit criteria:** measurable referred-signup rate at a pilot merchant.

### Phase 6 — Platform: API, POS & deeper analytics
- Public **API + webhooks**; POS integrations (Square/StoreHub/Feedme are SEA-relevant).
- **Advanced analytics** (deferred from early phases): repeat-visit rate, member share of transactions, redemption rate, time-between-visits, per-branch reporting, weekly report email.
- Multi-outlet: cross-outlet stamping/redemption, staff-per-branch permissions; fraud dashboard; custom domains; CSV customer import.
- Maybe: POS-tied transactions or payments (founder 2026-07-09: "who knows — for now, no").
- **Exit criteria:** one external integration live; a 2+ outlet chain running on advanced reports.

### Backlog (no committed order)
- Google Wallet smart-tap/NFC exploration; lock-screen geo relevance (`locations[]`).
- Points/tiers mode (beyond stamps); AI weekly plain-English reports; campaign send-time optimization.
- Meta ads integration; reseller/agency tier; SG/PH/ID expansion; local billing (FPX, TNG).

### Surface evolution by phase

What is new on each surface, per phase. **➕ = proposed addition (2026-07-09), pending founder approval** — everything unmarked is already shipped or already planned. Approved ➕ items move into the phase bullets above; rejected ones get a Decision Log row.

#### Phase 1 (current)
**Customer PWA (`/app`)**
- Shipped: OTP login (dev bypass non-prod), branded stamp card, rotating QR (90s), promos, recent spends.
- ➕ Stamp-earned + reward-unlocked celebration moments (animation, then clear next goal: "2 more for a free coffee").
- ➕ Add-to-home-screen prompt after second visit (not first — don't nag strangers).
- ➕ Offline view of last-known card state (connectivity drops at the counter).
- ➕ Email OTP fallback for tourists/no-SMS users.
**Cashier (`/admin/[slug]/scan`)**
- Shipped: camera scan (BarcodeDetector + paste fallback), amount input, velocity rules, daily counter view.
- ➕ Undo last stamp (5-min window; compensating ledger event, audit-logged — mistakes happen at rush hour).
- ➕ Customer lookup by phone when the QR won't scan (screen glare, cracked phone).
- ➕ "Reward ready" banner on scan result so the cashier can offer redemption unprompted.
**Merchant admin (`/admin/[slug]`)**
- Shipped: dashboard, customer list/detail/create (PDPA opt-ins), team + role matrix, reward redemption, basic reports (7/30d).
- Planned: onboarding wizard, printable QR kit. (Stripe billing screen dropped 2026-07-09 — manual invoicing.)
- ➕ Live card preview while editing the program (see what customers see).
- ➕ Customer tags + private notes ("regular, oat milk").
- ➕ Customer CSV export (PDPA access requests need it anyway).
**Platform admin (`/admin/merchants`)**
- Shipped: merchant directory (search/filter/sort/pagination), create/edit (plan, address, logo, modules), password resets, audit-logged.
- ➕ Read-only "view as merchant" with audit trail (support without password sharing).
- ➕ System health page (DB, OTP provider, error rate).
**Marketing (`/`)**
- Shipped: landing + reach-out quiz, /roadmap.
- Planned: /pricing (Founding/Starter/Growth per `PRICING.md` §8 — current features listed, unshipped ones greyed "Coming soon"), /signup (self-serve trial).

#### Phase 2 — Points & rewards
- **Customer:** home after login = stamp card first + "Show QR" CTA (modal: QR, fallback code, dismiss); rewards section below. Reward detail → redeem CTA → "Are you at the store right now?" confirm → unique single-use coupon QR + code. Points column per transaction; read-only total points on profile; adjustments visible in history.
- **Cashier:** two big buttons — **Scan member** (amount → stamp + points) and **Scan reward** (shows reward + member → confirm). Redeemed coupons marked instantly.
- **Merchant admin:** points settings (RM→points rate); rewards catalog CRUD (title, desc, image, points cost, active); point adjustment button on customer profile (reason required, always ledgered); reports: points earned/spent, redemptions by reward/outlet/staff.
- **Platform admin:** points/rewards module toggles per tenant (existing module system).
- **Marketing:** /pricing page ships alongside this phase.

#### Phase 3 — Wallet passes + member tags
- **Customer:** Add to Apple Wallet / Google Wallet buttons on `/card`; pass auto-updates on stamp/reward. ➕ Back-of-pass links (rewards, refer). ➕ Wallet hint shown from second visit onward.
- **Cashier:** no new screens — wallet pass barcode carries the same token; scanner just works. ➕ Test that explicitly.
- **Merchant admin:** ➕ Pass designer preview (merchant branding on a mock iPhone/Android pass). ➕ Wallet metrics tile: adds, removals, active passes.
- **Platform admin:** ➕ Certificate health panel — Apple cert + APNs key expiry countdowns with alerts (a lapsed cert bricks every pass), Google service-account status.
- **Marketing:** /demo issues a real pass to the visitor's own wallet; /integrations page (Apple, Google, WhatsApp-soon).
- **Member tags:** merchant admin — inline tag rows under points settings (name, multiplier, enable/disable; "i" tooltip: replaces base rate); customer profile tag dropdown; audit-logged.

#### Phase 4 — WhatsApp retention
- **Customer:** notification preference center in profile (per-channel opt-in/out); reward-expiry reminders. ➕ Language choice (EN/BM/CN) drives template language.
- **Cashier:** no change.
- **Merchant admin:** automations (welcome/birthday/milestone/win-back toggles), campaign builder, segments (active/slipping/lapsed), template library, credits balance. ➕ Quiet hours + per-customer frequency cap (no 3am pings, no spam). ➕ Test-send to own phone before enabling. ➕ Audience preview count ("this will reach 143 customers"). ➕ Message history on the customer detail page.
- **Platform admin:** ➕ Template approval tracker (Meta review status), deliverability monitor, credit ledger across tenants.
- **Marketing:** blog engine + first SEO posts ("digital stamp card for <vertical> in <city>").

#### Phase 5 — Referrals
- **Customer:** `/refer` — personal link/QR, native share sheet. ➕ Referral status tracker ("Aisyah joined — your reward arrives on her first stamp").
- **Cashier:** referral-reward redemption appears in the existing claim flow.
- **Merchant admin:** referral program config (both-sides rewards), performance stats. ➕ Top-referrer list. ➕ Anti-abuse settings surfaced (self-referral, velocity, same-device).
- **Platform admin:** referral fraud flags in the existing audit/flag stream.
- **Marketing:** case study with pilot referral numbers.

#### Phase 6 — Platform
- **Customer:** ➕ Nearest-outlet finder for chains. ➕ Card switcher when one phone number holds cards from several Kembali merchants.
- **Cashier:** ➕ Offline stamp queue (sync when signal returns). ➕ Quick cashier-switch PIN on a shared counter device.
- **Merchant admin:** advanced analytics (repeat-visit, member share, time-between-visits, per-branch), fraud dashboard, custom domain settings, CSV import, API keys + webhooks UI, weekly report email, cross-outlet staff permissions.
- **Platform admin:** usage metering + billing health, feature flags, API rate-limit monitor.
- **Marketing:** developer docs portal; POS integration pages (StoreHub/Feedme/Square).

---

## 8. Merchant CMS (admin app) structure

```
/login, /signup, /onboarding (wizard: brand → program → outlet → staff → QR kit)
/dashboard                    # today: stamps, signups, redemptions, referrals (realtime)
/customers                    # list, segments, search
/customers/[id]               # visit history, stamps, coupons, messages
/programs                     # stamp card config: milestones, expiry, welcome/birthday
/rewards                      # rewards catalog: title, desc, image, points cost, active; redemption reports
/outlets                      # branches, geo, QR posters (printable PDF)
/staff                        # invites, roles, branch assignment
/settings/points              # RM→points rate; member tags (name, multiplier — replaces base, enable/disable)
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
/card (home after login)      # 1) stamp card + "Show QR" CTA → modal (QR, fallback code, dismiss)
                              # 2) rewards section below: all redeemable rewards
                              #   (Add to Apple/Google Wallet buttons ship in Phase 3)
/rewards/[id]                 # reward detail → redeem CTA → "at the store?" confirm → unique coupon QR + code
/rewards                      # earned/reserved coupons, expiry countdown, redemption state
/refer                        # personal referral link/QR, reward explainer (Phase 5)
/profile                      # language, tag (read-only), points total (read-only), notification opt-ins, delete account
(cashier scanner lives at /admin/scan — moved per Decision Log 2026-07-08)
```
- Installable PWA (manifest + service worker); works fully in browser per CX principle #1.
- Loads <2s on mid-range Android over 4G (performance budget).

## 10. Marketing site structure

**Style (re-set 2026-07-08, supersedes the Monad direction):** frosted-SaaS per `brand/DESIGN-dub.md` — near-white canvas, 1px ash hairline borders instead of elevation, Inter type (weight-500 tight-tracked display, 16px body), compact density, radius vocabulary 9999/16/12/8px, restrained glassmorphism on floating elements only (sticky nav, hero activity cards, scene toast). Kembali chroma unchanged: pandan = the single committed action color, coral = earned, leaf = progress. Scroll-pull architecture: hero ends in a fold-clipped dashboard mockup with glass activity cards; sticky-phone showcase continues the momentum. Marketing stays light-only.

```
/                 # Hero: "Loyalty cards your customers never lose." Interactive web demo
                  #   card; how-it-works + features sections; INTERACTIVE reach-out section:
                  #   3 multiple-choice questions (business type → outlets → main goal)
                  #   narrowing to a tailored pitch + contact CTA (v1: WhatsApp/email)
/roadmap          # public high-level roadmap, one animated illustration per phase
                  #   (order re-synced 2026-07-10: points+rewards now Live, wallet+VIP tags Up next)
/pricing          # Founding/Starter/Growth per PRICING.md §8; current features
                  #   listed, unshipped greyed "Coming soon"                    [shipped 2026-07-10]
/blog             # SEO: "digital stamp card for <vertical> in <city>"          [later]
/case-studies     # pilot merchant results (member count, redemption rate)      [later]
/signup           # self-serve trial                                            [Phase 1]
/demo             # demo pass into the visitor's own wallet                     [Phase 2]
/privacy, /terms
```
**Positioning line:** *"Kembali — the stamp card that lives on your customers' phones. No app for your customers, no hardware for your staff, set up in 10 minutes."* Tagline: *"Loyalty your customers will love."* (replaced "Make them come back" 2026-07-08 — founder found it too direct/commanding; wallet-first positioning returns with Phase 2)

**Copy hard rules (2026-07-07, non-negotiable):**
1. All product and marketing copy is **English only**. "Kembali" appears **only as the brand name** — never as a verb, pun, or tagline word, and no other Malay words in UI copy ("kopi", "Selamat datang", etc.). Feature *support* for BM/CN templates (Phase 2) is unaffected — that's localization, not brand voice.
2. Copy follows the `ux-writing` skill (`.claude/skills/ux-writing/`): purposeful, concise, conversational, clear; sentence case; verb-first buttons (2–4 words); no idioms; no internal jargon in public copy (no "MVP", "backlog", "Phase 0" — say "At launch", "Planned", "Preview").

**Best growth asset:** the `/demo` page issues a real demo pass to the visitor's wallet — the product sells itself.

---

## 11. KPIs

- **Merchant-side:** trial→paid conversion, churn, outlets per tenant.
- **Product:** join-flow completion rate (>80%), stamp→card-update latency (<5s), scan success rate. *(Phase 2 adds: points-redemption rate, reward-redemption completion. Wallet-add rate + wallet-update latency join in Phase 3.)*
- **End-customer (the numbers merchants buy for):** repeat-visit rate, member share of transactions (target >33%), coupon redemption rate (Stampede benchmark: 59%).

## 12. Risks

- **Apple pass update infra is the hardest Phase 3 piece** (certs, APNs, web service protocol). Its critical-path item is the **account approvals** — Apple Developer + Google Wallet Console applications must start during Phase 1 or Phase 3 slips.
- **Points liability drift** — if adjustments were editable in place, balances would become untrustworthy; mitigated by the append-only ledger + customer-visible adjustments (§4).
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
| 2026-07-07 | **Wallet passes moved MVP → Backlog** | Founder call: validate core loyalty CX first; defers Apple cert/APNs complexity and account lead times (supersedes "Wallet passes in MVP" above) |
| 2026-07-07 | One domain, path-based routing: `/` marketing, `/app` PWA, `/admin` | Simpler mental model + single cert/domain; Next.js multi-zones with basePath |
| 2026-07-07 | **One server**: 3 apps merged into `apps/web` (route groups) | Solo founder: one process/build/deploy beats zone plumbing; per-surface layouts keep separation (supersedes multi-zone row above) |
| 2026-07-07 | Marketing style = editorial serif+mono (DESIGN-Monad.md ref) on Kembali palette | Founder-supplied reference; brand colors stay Pandan |
| 2026-07-07 | **English-only copy; "Kembali" only as brand name** | Founder call: don't force Malay/English mixing; ux-writing skill governs style (see §10 copy hard rules, BRAND.md §5) |
| 2026-07-07 | **Security baseline codified in SECURITY.md** — ASVS 5.0 L2 as code standard, ISO 27001:2022 alignment, PDPA 2024 amendments; headers + CI audit + Dependabot added | Founder wants certification-ready posture; lower-grade models need explicit rules |
| 2026-07-08 | **Phase order re-set:** loyalty + basic reports → wallet passes → WhatsApp → referrals → API/POS; complex analytics deferred to Phase 5 | Founder call: wallet differentiator right after MVP; small businesses need simple reports first, deep analytics later (supersedes 2026-07-07 wallet-backlog row) |
| 2026-07-08 | **Marketing restyled to DESIGN-dub.md** (frosted SaaS, Inter, hairlines, restrained glass); **tagline → "Loyalty your customers will love"**; copy re-toned warm/inviting | Founder disliked the Monad look and the commanding tagline; scroll-pull hero added per founder's exploration goal (supersedes Monad style row) |
| 2026-07-08 | **PGlite as zero-setup dev database** — no DATABASE_URL → embedded Postgres, auto-migrate+seed, `SET ROLE kembali_app` so RLS applies; prod requires DATABASE_URL | No Docker/Postgres on the dev machine; identical RLS behavior to prod |
| 2026-07-08 | **Transaction amount lives on `stamp_events.amount_cents`** (v1) | One counter action = one ledger event; a dedicated payments table can come when POS integration does |
| 2026-07-08 | **Cashier scanner lives at `/admin/scan`** (staff surface), not `/app/scan` | One auth story for staff; supersedes §9's original placement |
| 2026-07-08 | **OTP dev bypass 888888, hard-disabled in production builds** | Founder-requested test convenience; SECURITY.md §2 rule 13 governs it |
| 2026-07-08 | **Platform-admin RLS bypass via `app.platform_admin` GUC** on tenants/staff_users only, set solely by `withPlatform()` after a verified platform session | System admin needs cross-tenant tenant/staff management without connecting as table owner |
| 2026-07-08 | **Path-based tenancy: merchant panels at `/admin/[slug]`**, platform area at `/admin/merchants`; staff locked to their own slug | Founder review: merchant paths must never share the system admin's path; slug is stable (never regenerated on rename) |
| 2026-07-08 | **Role-permission matrix v1** (6 permission keys × 3 roles, tenant-overridable, defaults in `@kembali/core`); enforced in nav, pages, actions and the stamp API | Founder review: cashier/manager/owner capabilities must be manageable per store |
| 2026-07-08 | **Merchant profile v1**: plan type, address (line/city/state/country), square logo ≤512KB stored as data URL in `tenants.logo_url` | Founder review; object storage (S3/R2) replaces data URLs when a provider is chosen |
| 2026-07-09 | **§7 "Surface evolution by phase" added**; ➕-marked UX proposals per surface/phase await founder approval | Founder asked for per-surface deltas + per-phase outcomes; proposals kept separate from committed scope |
| 2026-07-09 | **No payment processing in-product.** Subscriptions by manual invoice (bank transfer/DuitNow); Stripe deferred to self-serve launch at earliest. Transaction key-in = record-keeping only | Founder call: payments complicate everything; POS/payment integration is a distant maybe (Phase 6+) |
| 2026-07-09 | **Points system in Phase 2**: per-merchant RM→points rate, append-only `point_events`, read-only `points_balance` projection, admin adjustments (reason required) customer-visible in history | Founder spec; same ledger discipline as stamps |
| 2026-07-09 | **Rewards in Phase 2**: catalog (title/desc/image/points cost), customer home = card + Show-QR modal + rewards list, redeem flow with in-store confirm → unique single-use coupon QR/code; cashier = two buttons (Scan member / Scan reward); rewards reports | Founder spec; earn→redeem loop completes the loyalty story before wallet |
| 2026-07-09 | **Phase order re-set:** 2 points+rewards → 3 wallet passes + member tags → 4 WhatsApp → 5 referrals → 6 API/POS (supersedes 2026-07-08 row) | Founder call |
| 2026-07-09 | **Member tags (VIP/Staff) in Phase 3**: tag rows under points settings (name, multiplier, enable/disable); multiplier REPLACES base rate (tooltip explains); tag dropdown on customer profile | Founder spec; benefits tiers without a full tier system |
| 2026-07-09 | **Pricing approved** (PRICING.md): Founding RM99 → Starter RM149/Growth RM279 at launch → RM179/RM349 ceiling; `/pricing` page ships next build showing current features, unshipped greyed "Coming soon" | Founder approved 2026-07-09; page copy must follow SOP 3 |
| 2026-07-10 | **`points_balance` maintained by a DB trigger** on `point_events` insert; direct UPDATEs to the column rejected (pg_trigger_depth guard, migration 0009) | Stronger than app-side projection (used for `stamps_count`): read-only is enforced in the database and balance = Σ events by construction |
| 2026-07-10 | **Points leave the balance at redemption CONFIRM, not reserve.** Coupon = KMB-XXXX-XXXX (no 0/O/1/I/L), 15-min TTL; confirm = atomic state-guarded UPDATE + row-locked balance re-check in one transaction | Abandoned/expired coupons need no refund ledger events; single-use proven under concurrent confirms in tests |
| 2026-07-10 | **New permissions `adjustPoints` (owner-only default) + `manageRewards` (owner+manager default)**; `points`/`rewards` module toggles default ON for all tenants | Adjustments move balances → most sensitive; catalog editing is routine store management; matrix stays per-tenant editable |
| 2026-07-10 | **Marketing site synced to shipped scope**: `/pricing` shipped (PRICING.md §8); `/roadmap` reordered — points+rewards now "Live", wallet+VIP tags "Up next"; landing hero pill/features/showcase updated. Pricing greys "Coming soon" ONLY for genuinely unshipped features — points+rewards is now an included Starter/Growth feature, not greyed | Docs must match reality; §8 spec predated Phase 2 shipping, so its "grey out points+rewards" line was corrected |
| 2026-07-10 | **Reports capped + full-report pages + gated downloads**: overview previews show the latest 25 (info tooltip) with "See full report" → paginated pages (customers, unified transactions with type filter, rewards) with date range; **analytics CSV download gated to Founding + Growth** (`planAllowsReportDownload`), Starter/Trial locked with a hint. PDPA customer-data export stays free on every plan (hard rule #1). New demo Starter merchant (Bloom Bakery) alongside Founding (Corner Coffee) | Founder review — keep the overview scannable, put depth behind full pages, and make downloads a paid perk without touching the free PDPA export. Full inventory in `MODULES.md` |
| 2026-07-10 | **`plan` gains `founding`; team members managed in-app** (add/edit/remove, one modal). Staff sign in by email (no username column — deferred; would need a schema + auth change). Deleting staff is blocked for self, the last owner, or anyone referenced by append-only ledgers | Founder review; `founding` = the RM99 program (PRICING.md). Ledger integrity beats hard-deleting history — change role to limit access instead |

## 14. References

- Stampede features & blog: https://stampede.sg/features , https://stampede.sg/blog/stamp-card-for-cafe-in-kuala-lumpur
- Apple Wallet updates: https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html
- Google Wallet loyalty: https://developers.google.com/wallet/retail/loyalty-cards
- Competitors: https://loopyloyalty.com , https://www.stampme.com , https://passkit.com/loyalty-card/ , https://bonusqr.com , https://stampit.app/en
