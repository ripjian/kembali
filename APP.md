# Kembali — Branded app plan (APPROVED by founder 2026-07-19; stack: Capacitor)

> **Progress:** Stage 1 done 2026-07-19 (the /your-app demo now walks the whole
> §2 journey, UAT'd; OTP uses the 888888 demo bypass until a provider exists).
> Stage 2 scaffold done same day (`apps/mobile`: brand-driven Capacitor config,
> check-brands gate, runbook). Native platforms + device run blocked on Xcode,
> CocoaPods and Android Studio landing on the dev machine (founder, see
> `apps/mobile/README.md`); production blocked on the OTP provider + domain.

> The customer-side mobile app for chains (Growth + 6 outlets, PRICING.md §9.3).
> Staff and owners stay on the web admin. The web PWA card remains the default
> for every other merchant: the app is a brand-presence add-on, not a replacement.
> DEVSPEC §0 (Closure Rule) applies: every flow below has a start, an end, and
> error/empty states. Nothing ships half-open.

## 1. Scope

One codebase, many brands. Each chain's app is the same product pinned to one
tenant at build time, wearing that brand's id, icon, splash and colours (the
tenant theming engine already derives AA-safe palettes). No payments in-app.
No staff mode in v1: cashiers scan with the web tool they already use.

## 2. The complete journey (start → end)

### A. First open (the start)
1. Splash (brand mark) →
2. Welcome, one screen, skippable ("Your stamps live here now") →
3. Phone number (+60 default) →
4. Six-digit OTP: resend with cooldown, wrong-code error, changed-number back path →
5. One-screen registration for new customers (name required, phone verified
   read-only, email optional, birthday optional, marketing opt-in unchecked — PDPA) →
6. Push permission primer, contextual and skippable ("Know the moment a stamp
   lands?") → system prompt →
7. Card home. Returning customers: splash → card home. Re-OTP only on session
   expiry (see §4.3: mobile sessions are long-lived).

### B. The daily loop
- **Card home**: greeting, stamp card, points balance, Show QR (signed short-TTL
  token, auto screen-brightness, auto-refresh), recent activity.
- **Rewards**: catalog with affordability states → redeem → confirm sheet →
  single-use coupon (KMB code + QR, 15-minute countdown). Points come off at
  staff confirm, so an expired coupon costs nothing — the expiry state says so.
- **History**: every stamp, point, adjustment and redemption, with outlet.
- **Outlets**: branch list with address and hours.
- **Inbox**: transactional messages in v1 (stamp landed, reward earned, coupon
  confirmed). Birthday/win-back/campaign pushes arrive with the WhatsApp phase.

### C. Profile (the "customer can edit profile" part)
- Edit name, email, birthday. Phone is identity: read-only in v1 with "ask at
  the counter to change" (self-serve re-verify is v1.1).
- Marketing opt-in toggle; per-type push preferences.
- PDPA: export my data, free.
- Sign out.
- **Delete account** — required by Apple (guideline 5.1.1(v)) and PDPA. Confirm
  flow → server anonymises the customer while ledgers stay append-only.

### D. System states (the ends nobody plans for)
- Offline: cached card and history; QR needs network (signed short-TTL), so the
  offline screen says exactly that instead of failing quietly.
- Empty states: no rewards configured, no history yet, inbox empty.
- Force-update screen behind a minimum-version check.
- Merchant sunset: if the chain leaves Kembali, the app shows a farewell screen
  and the data-export pointer instead of dying with errors.
- Review prompt only after a redeemed reward, rate-limited.

## 3. Stack (founder decision, §9.4)

**Recommended: Capacitor**, wrapping the existing `/app` PWA pinned to the
tenant, plus native plugins (push, splash, brightness, secure storage).
- For: weeks not months; one TypeScript codebase we already test; every card
  improvement ships to web and app together; white-label = a config per brand.
- Against: Apple guideline 4.2 dislikes bare webview wrappers — mitigated by
  real native capability (push, offline cache, deep links), which loyalty apps
  routinely pass review with.
- Fallback: Expo/React Native if a chain demands native polish or review
  friction bites (~2–3 months, rebuild every screen, still TypeScript).
- Ruled out: Flutter (Dart, zero code share), double-native (double cost).

## 4. Stages (each with its own end)

- **Stage 0 — Decisions and accounts (founder).** Stack pick; OTP provider
  (HARD BLOCKER: `OTP_PROVIDER=none` fails production boot, so no real customer
  can ever onboard); Kembali's own Apple Developer account for development and
  TestFlight (client accounts come at sale time, Apple 4.2.6). *End: Decision
  Log rows in ROADMAP §13.*
- **Stage 1 — Complete design, clickable.** Extend the /your-app phone to every
  screen in §2: splash → onboarding → OTP → registration → push primer → home,
  plus edit profile, delete account, offline, force update, sunset. "Skip to
  the card" keeps the sales demo quick. Design only, no app code. *End: founder
  walks the whole journey and signs off.*
- **Stage 2 — Shell.** `apps/mobile` Capacitor project wrapping `/app` for one
  tenant; icon/splash pipeline; runs on the founder's phone. *End: join, stamp,
  redeem all work inside the shell on a real device.*
- **Stage 3 — Native layer.** Device-token registration API (tenant-scoped,
  RLS), APNs/FCM sender for transactional pushes, deep links, offline cache,
  QR brightness, long-lived mobile sessions (refresh tokens — this also cuts
  the OTP line in PRICING §4 from ~300 logins/outlet/month to near install-time
  only). *End: "stamp landed" push arrives on a real device.*
- **Stage 4 — White-label pipeline.** Per-brand config (bundle id, tenant slug,
  assets), one command builds both platforms, runbook for onboarding a chain.
  *End: two demo brands built from one command.*
- **Stage 5 — Store readiness.** Privacy labels, in-app account deletion live,
  4.2-mitigation checklist, submission runbook under the client's accounts.
  *End: TestFlight approval of the template on our account.*

## 5. Backend additions the app needs
1. Device registration + push sender (new, small, tenant-scoped).
2. Refresh-token sessions for mobile (auth change, SECURITY.md review).
3. Delete-account endpoint (anonymise customer, ledgers stay append-only).
4. Per-tenant app-config endpoint (colours exist; add icon/splash, flags,
   minimum version).
5. Universal links (needs the real domain).

## 6. Costs
Apple Developer USD99/yr (ours; each client pays their own), Google Play USD25
once, APNs/FCM free, local Xcode builds free (no EAS on the Capacitor path).
No new per-outlet cost; long-lived sessions *reduce* OTP cost.

## 7. Open (founder)
- [x] Approve this plan and the stack (§3) — approved 2026-07-19, Capacitor; ROADMAP §13
- [ ] OTP provider (blocks all real onboarding, app or web)
- [ ] Apple Developer application for Kembali (weeks of lead time)
- [ ] Install Xcode + CocoaPods + Android Studio on the dev machine (unblocks `cap add ios/android`)
- [ ] Confirm v1 scope: customer-only, no staff mode (assumed in Stages 1–2)
