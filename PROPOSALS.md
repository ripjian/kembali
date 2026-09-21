# Kembali — Proposals awaiting the founder (2026-09-21)

> Written at the founder's request after the 2026-09-21 build (onboarding,
> PDPA exports, activity and referral reports, referral program). Each
> section says what the feature would do, how it would work, what it
> touches, and what needs a founder decision. Nothing here is built.
> When a proposal is approved: Decision Log row in ROADMAP §13, then the
> relevant DEVSPEC section, then MODULES.md.

## 1. Merchant-side program and outlet settings — APPROVED and shipped 2026-09-21

> Founder approved with both recommendations: self-serve outlets with the
> invoice note and platform list; no approval step for program edits.
> Built as described below (Decision Log 2026-09-21, MODULES.md).

**What merchants could do.** Owners edit their own stamp card (name, stamps
required, reward title, reward validity days) and manage outlets (add,
rename, edit address, retire) from `/admin/[slug]/settings`, instead of
asking Kembali. Managers see the settings read-only.

**How it works.**
- Program edits apply to future stamps only. Cards in progress keep their
  current count; lowering "stamps required" below a member's count earns
  them the reward at their next stamp (never retroactively, never silently
  wipes progress). Every change is audit-logged and shown as a line on the
  customer card ("Card updated: now 8 stamps to a free coffee").
- Outlet retire = deactivate (events keep their outlet id). A retired
  outlet disappears from the cashier's picker and the report filters but
  stays on historical rows. The last active outlet cannot be retired.
- Adding an outlet is a billing event (pricing is per outlet). The page
  says so and the platform admin gets a notification row ("Corner Coffee
  added Bangsar Village on 3 Oct") so invoicing follows.
- Permission key `manageSettings` (owner-only default). No module toggle;
  every plan.

**Founder decisions.**
1. May merchants add outlets themselves (invoice follows), or request only?
   Recommendation: self-serve add with a clear "this adds RM149/month to
   your next invoice" line; retire self-serve too.
2. Should changing the reward title or stamp count require Kembali
   approval on the Founding cohort (case-study consistency)? Recommendation:
   no, but log it and show it on the platform merchant list.

**Effort.** Small: one page, three actions, one permission key, tests for
the "lower stamps required" edge.

## 2. VIP and staff member tags (ROADMAP Phase 3, DEVSPEC §7)

**What merchants could do.** Create tags (VIP, Staff, Regular) with a
points multiplier, assign one tag per member from the profile, and see the
tag in reports. A tagged member earns "rate × multiplier" on every keyed-in
amount; the multiplier replaces the base rate, it never stacks.

**How it works.**
- Table `member_tags` (tenant, name, multiplier, active, colour) and
  `customers.tag_id`. Multiplier recorded on each `point_events` row so
  history stays explainable after a tag changes.
- Disable ≠ delete: a disabled tag stays on members but stops multiplying.
  Delete only when no member holds it.
- Customer card shows the tag as a small badge ("VIP") with the multiplier
  in words ("You earn double points"). Staff tag shows too (it is their
  status).
- Reports: points report gains a tag filter; customers list gains a tag
  column and filter; the referral program can be limited to tagged
  members later.
- Growth plan feature (PRICING.md); module toggle `tags`.

**Founder decisions.**
1. Show or hide the "Staff" tag from the customer? Recommendation: show.
2. Can cashiers assign tags, or only owners and managers? Recommendation:
   owners and managers (`editCustomers`).
3. Automatic tags (e.g. VIP after 10 visits)? Recommendation: manual in
   v1, automatic rules in Phase 4 with segments.

**Effort.** Medium: migration, two admin surfaces, stamp API change, tests
for multiplier maths and reconciliation.

## 3. POS and public API (ROADMAP Phase 6)

**What it would do.** Let a till (StoreHub, Qashier, FeedMe, Square, or a
custom system) stamp and award points without the cashier scanning, and let
chains pull their own data. Two halves:

- **Inbound (POS → Kembali):** `POST /api/v1/transactions` with an
  idempotency key, the member's phone or QR token, amount, outlet code and
  external receipt id. Same ledger writes as the scan page (stamp event,
  point event, velocity rules, referral qualification).
- **Outbound (Kembali → merchant):** read endpoints for members, balances,
  transactions and redemptions, plus webhooks (`member.joined`,
  `stamp.recorded`, `reward.redeemed`) signed with an HMAC secret.

**How it works.**
- API keys per tenant, created by the owner in Settings, shown once, stored
  hashed, scoped (read, write), revocable, audit-logged. Rate limit per
  key. Keys never bypass RLS: every call runs inside `withTenant`.
- OpenAPI document served at `/api/v1/openapi.json`; a small "Developers"
  page under Settings with the key list and a copy-paste curl example.
- POS partners come one at a time: build the generic API first, then a
  StoreHub connector when a pilot merchant runs StoreHub (their loyalty
  is bundled, so the pitch is "keep your POS, get a real card").
- Growth plan and chains; module toggle `api`. JWT/API keys were deferred
  to this phase in the 2026-07-20 security triage; TOTP MFA (below) should
  land first because keys are minted from the admin panel.

**Founder decisions.**
1. Public API for every Growth merchant, or chains only at first?
   Recommendation: Growth, self-serve keys, generous rate limit.
2. Which POS first? Needs a real merchant on that POS; do not build a
   connector speculatively.

**Effort.** Large: new auth path, versioned routes, docs, webhook delivery
with retries, partner testing.

## 4. TOTP multi-factor authentication (security review stage 3)

**What it would do.** Platform admins must, and merchant owners may, add a
6-digit authenticator code (Google Authenticator, Authy, 1Password) to
their password sign-in. Cashiers and customers are excluded: the customer's
phone is already the factor, and cashiers sign in on shared shop phones.

**How it works.**
- `staff_users.totp_secret` and `platform_admins.totp_secret` (encrypted
  at rest with a server key; this is the first field-level encryption in
  the system and sets the pattern for later PII encryption), plus
  `totp_confirmed_at` and ten single-use recovery codes (hashed).
- Enrol from Team → your profile: QR code, type one code to confirm, save
  recovery codes. Sign-in becomes password → code, with the existing
  throttle policy applied to the code step (five wrong codes locks for
  fifteen minutes on the same keys as the password step).
- Platform admin: enforced. Existing admins are asked to enrol at next
  sign-in and cannot skip. Owners: optional, with a "recommended" badge.
  The platform admin can reset a merchant's MFA after identity checks
  (audit-logged), which is the recovery path when both device and codes
  are lost.
- Pure TOTP maths in `@kembali/core` (RFC 6238, tested against RFC
  vectors); no third-party auth service.

**Founder decisions.**
1. Optional or mandatory for merchant owners? Recommendation: optional now,
   mandatory once the API (proposal 3) ships because keys are minted there.
2. Where does the encryption key live? Recommendation: an environment
   variable now (`FIELD_KEY`), a managed KMS when hosting is chosen.

**Effort.** Medium: core maths + tests, two tables, enrol and verify
screens, sign-in change, recovery path.

## 5. Native build of the branded app (APP.md Stage 3)

**What it would do.** Ship a chain's own iOS and Android app (their icon,
name and colours) that wraps the customer card, with push notifications
and a native splash. The web card stays the product; the app is a
presence add-on for Growth chains with six or more outlets (PRICING.md §9,
pending approval).

**How it works.**
- Capacitor shell already scaffolded in `apps/mobile` with per-brand
  configs in `brands/*.json` and a `check-brands` build gate. Stage 3 adds:
  native projects generated per brand (`npx cap add ios/android`), icons
  and splash from the brand config, deep links (`/app/join/[slug]` opens
  the app), push registration (APNs and FCM) stored on
  `device_registrations`, and an update banner when the shell is outdated.
- The card loads from the server (`server.url`), so every web release
  reaches the app immediately; native releases are needed only for shell
  changes.
- Store accounts belong to the client (Apple guideline 4.2.6). Kembali is
  added as a developer on their account, builds, and submits; the client
  approves. First submission is where most time goes (screenshots,
  privacy labels, review notes).
- Push is the first native-only feature: a "Your reward is ready" and
  "You have 2 stamps to go" nudge, opt-in, quiet hours, capped. It reuses
  the Phase 4 messaging ledger with channel `push`.

**Blocked on.** Xcode, CocoaPods and Android Studio on the build machine
(not installed), an Apple Developer account for at least the demo brand,
a real OTP provider and a production domain (the shell needs a public
server), and the founder's sign-off on §9.3 commercials.

**Founder decisions.**
1. Build the Kembali-branded demo app first (proves the pipeline, App
   Store listing doubles as marketing) or wait for the first paying chain?
   Recommendation: demo app first, on the founder's own developer account.
2. Push notifications in the first native release, or ship the wrapper
   only? Recommendation: include push; it is the main reason to have an app.

**Effort.** Medium for the pipeline, then per-brand setup of about a day
plus store review time (one to two weeks per store, per release).

## Suggested order

1. TOTP MFA (small, closes the security review's stage 3, prerequisite for
   API keys).
2. ~~Merchant-side program and outlet settings~~ shipped 2026-09-21.
3. VIP tags (Phase 3 as planned, alongside wallet passes once the Apple and
   Google accounts exist).
4. Native branded app (once tooling and an Apple account exist).
5. POS/API (Phase 6, driven by the first chain or POS-bound pilot).
