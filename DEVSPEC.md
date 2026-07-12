# Kembali — Development Specification (DEVSPEC)

> **Written 2026-07-11 for all future models working on this codebase.** ROADMAP.md says WHAT and WHEN; this file says HOW COMPLETE. Read it before building any module. When this file says **ASK FOUNDER**, present the founder the listed options via a question, never silently pick. When it says **VERIFY IN CODE**, the current implementation is the truth; read it before changing behavior. Update this file per SOP 6 whenever a decision lands.

---

## 0. The Closure Rule (apply to EVERY feature, big or small)

Nothing ships half-open. Before calling any feature done, walk this checklist. If a row doesn't apply, say so in the report; never skip silently.

| Loop | Meaning | Example |
|---|---|---|
| Create ↔ Edit ↔ Retire | Anything creatable must be editable and retire-able. Retirement = deactivate/archive when history references it; hard delete only when nothing references it | Rewards: deactivate once redeemed against; delete only if zero redemptions |
| Action ↔ Undo/Compensate | Every action a human can fumble needs an undo path. On append-only ledgers, undo = compensating event, never mutation | Stamp undo (5-min window); wrong amount after window = point adjustment with reason |
| Balance ↔ Ledger | Every displayed total must be a projection of an append-only ledger and reconcile in tests (total = Σ events) | stamps_count, points_balance |
| Config ↔ Effect ↔ Report | Every setting must visibly do something, and every flow that moves value needs a report | Points rate → accrual → points report; rewards → redemptions → rewards report |
| Grant ↔ Audit ↔ Visibility | Every privileged action is audit-logged; anything touching a customer's balance is visible to that customer | Point adjustments appear in customer-visible history |
| Feature ↔ Permission ↔ Module toggle ↔ Plan | New capability = role-permission key + per-tenant module toggle (platform admin) + plan availability decided (PRICING.md) + MODULES.md row | Rewards: manageRewards permission, points/rewards module toggle, all plans |
| Data in ↔ Data out | Anything stored about customers must be exportable (PDPA) and survive account deletion policy (§14) | Customer CSV export stays free on every plan |
| UI ↔ Both themes ↔ 360px ↔ Copy rules | Every screen: light+dark (app/admin), 360px, SOP 3 copy, WCAG AA via @kembali/core contrast utils | — |
| Empty ↔ Error ↔ Loading | Every list/screen needs empty state (invitation, not apology), error state (what failed → why → what to do), and loading state | — |
| Tenant ↔ RLS ↔ Test | Every new table: tenant_id, RLS policy, cross-tenant isolation test in the same change | — |

## 1. Auth & OTP (customer) — Phase 1, shipped; provider pending
- Flow: phone → OTP (OtpSender chain) → session. Dev: NullSender + 888888, non-prod only; prod boots only with a real provider (assertOtpDeliverable).
- Provider plan: OTP-PLAN.md is binding — single platform WABA (Model B), WhatsApp-first, SMS fallback, per-tenant attribution at request time into `messages` ledger, never log the code, OTP cost absorbed in plans.
- Closures: rate limits per phone AND per IP AND per tenant; resend with cooldown + attempt cap; lockout after N failures (VERIFY IN CODE for N); session lifetime long (target 90 days rolling) to keep OTP volume/cost down.
- Edge: phone number changes → **ASK FOUNDER** when built: options (a) staff re-keys customer under new number + admin merge tool, (b) customer self-service change with OTP on both numbers. Recommend (b) later, (a) manual workaround now.
- Edge: shared family phone → one customer per phone per tenant, by design. Do not "fix".

## 2. Registration & profile — Phase 1, shipped 2026-07-11
- Fields locked (Decision Log): full name required, phone verified read-only, email optional validated, birthday skippable (date only), marketing opt-in unchecked default.
- Closures: profile edit in /app/profile must allow updating email/birthday/opt-ins later; name edit allowed (typos); phone NOT editable by customer (see §1 edge). Merchant-side edit gated by editCustomers permission. Both writes audit-logged with different actor types.
- Birthday powers Phase 4 automation; no promise of timing in UI copy.
- PDPA: opt-in is per-channel eventually (WhatsApp/email split lands in Phase 4); store consent timestamp.

## 3. Stamping & transactions — Phase 1, shipped; evolves every phase
- Cashier scans member QR (rotating 90s token) → keys amount (RM, record-keeping ONLY, no payments ever until founder reverses 2026-07-09 decision) → one action writes: stamp_events row + point_events row (if points module on) + outlet_id + staff_id.
- Closures: undo last stamp (5-min, compensating events for BOTH stamps and points, audit-logged); velocity rules (per card, per cashier — VERIFY IN CODE for current thresholds); "reward ready" surfaced on scan; manual lookup by phone when QR fails.
- Edge: amount = 0 or blank → **VERIFY IN CODE**; recommended: stamp allowed with zero amount (visit-based stamping is valid), points accrue 0.
- Edge: offline at counter → Phase 6 offline queue. Until then: fail visibly with retry; NEVER optimistically fake success; NEVER fabricate timestamps. When the queue ships: client_captured_at + server received_at, ledger ordered by server time, velocity evaluated on receipt, duplicates deduped by client-generated idempotency key. Design APIs with an idempotency key NOW (cheap insurance).
- Edge: refund/void of a sale after undo window → no negative transactions; use point adjustment with reason + (if needed) stamp compensating event via support. **ASK FOUNDER** if merchants request a first-class "void transaction" tool.

## 4. Points — Phase 2, shipped core
- Per-tenant RM→points rate (settings). Rate changes apply to FUTURE transactions only, never retroactive. Store rate used on each point_event (or derivable) so history stays explainable.
- points_balance = read-only projection of append-only point_events. Enforced: no UPDATE path exists; migration 0009 rejects direct UPDATEs. Reconciliation test stays mandatory on any change.
- Adjustments: add/deduct, reason required, customer-visible, floor at zero (deduct below zero → reject with clear error).
- **Bulk/event grants ("shop anniversary, double points weekend"):** NOT BUILT. When requested: model as a point campaign — select audience (all/segment/tag), amount or multiplier, date window, reason; every grant is still one point_event per customer with campaign id; preview count before applying; platform-visible. **ASK FOUNDER** for scope/phase when it comes up (natural fit: Phase 4 campaigns; a simple "grant to all members now" tool could come earlier).
- **Points expiry:** NOT DECIDED. **ASK FOUNDER** before building anything that assumes forever-points or expiring points. Options: (a) never expire (simplest, generous, current de-facto), (b) expire after N months of inactivity with WhatsApp warning (drives return visits, needs Phase 4 messaging first). Ledger design supports (b) later via expiry events; do not preclude it.
- Tag multipliers (Phase 3): REPLACE base rate, never stack (tooltip must say so). Multiplier recorded on the event.

## 5. Rewards catalog — Phase 2, shipped core
- Fields: title, description, image (optional; ≤512KB data URL now, object storage later per Decision Log; card shows branded placeholder tile when absent), points cost (integer > 0), active toggle.
- Closures: edit allowed anytime (redemptions store a snapshot of title + cost at redemption time so history never lies — VERIFY IN CODE, add if missing); deactivate hides from customers immediately but does NOT touch existing reserved coupons; hard delete ONLY if zero redemptions reference it, otherwise offer deactivate.
- Cost change while coupons are reserved → reserved coupons keep the cost they reserved at.
- Report: redemptions by reward / outlet / staff / date range; CSV per report-download gating (Founding+Growth yes, Starter locked; PDPA export separate and always free).
- Edge: reward stock/quantity limits ("first 50 only") → NOT BUILT. **ASK FOUNDER** if requested: add max_redemptions + atomic decrement alongside the single-use guarantee.

## 6. Redemption flow — Phase 2, shipped core
- States: reserved (customer confirmed in-store prompt; unique single-use code KMB-XXXX-XXXX + QR shown) → redeemed (staff scan + confirm) | expired (TTL 15 min) | cancelled.
- Points deduction timing: **deducted at staff confirm, not at reserve** (shipped 2026-07-10 per CLAUDE.md). Consequence: a customer could reserve twice concurrently; balance check must re-run at confirm and reject if insufficient. VERIFY the concurrent test covers this exact case.
- Closures: customer can dismiss/cancel a reserved coupon; expired reservations release cleanly; staff confirm re-validates code single-use under concurrency (proof test exists, keep it green); redemption records outlet + staff.
- Edge: staff confirms wrong reward → cancel path within short window (**ASK FOUNDER**: allow staff-side cancel of a just-redeemed coupon? Recommend yes, 5-min window, compensating point-refund event, audit-logged, mirrors stamp undo).

## 7. Member tags (VIP/Staff) — Phase 3
- Inline rows under points settings: name, points multiplier, enable/disable. Disable ≠ delete: tag stays on customers, multiplier stops applying. Delete only when no customer holds it (or bulk-unassign first with confirm).
- Customer profile dropdown (single tag per customer v1); assignment audit-logged; customer sees their tag read-only in profile (**ASK FOUNDER**: show or hide "Staff" tag from the customer? Recommend show, it's their status).
- Multiplier replaces base rate (see §4). Reports: points report gains a tag filter.

## 8. Outlets — Phase 1/round-2, shipped light
- First-class: address (line/postcode/city/state/country); first outlet mandatory at merchant creation; tenant address deprecated (migrated to first outlet).
- Cashier picks serving outlet once/day (cookie; skipped for single-outlet); banner + dropdown above scan buttons; every stamp/point/redemption records outlet_id.
- Closures: outlet edit; outlet retire = deactivate only once events reference it (events keep the FK); adding outlet mid-life is a platform-admin action now (**ASK FOUNDER** when merchants ask to self-serve: plan gate? price per outlet applies).
- Per-branch staff permissions + cross-outlet analytics stay Phase 6; do not pull forward.

## 9. Customers CRM — Phase 1+2, shipped
- List: clickable rows + 3-dot menu, server-side sort/filter via URL params. Detail: profile, transaction history (stamps + points + RM + adjustments + redemptions, outlet column), edit modal, adjust-points modal.
- Closures: tags + private notes (➕ proposed, unbuilt — merchant-facing notes must be excluded from customer-visible views and INCLUDED in PDPA export since it's data about the person; flag this when building); CSV export free always; deletion → §14 policy.
- Segments (active/slipping/lapsed) land Phase 4; define thresholds with founder then.

## 10. Team & roles — Phase 1, shipped
- Add/edit/remove staff in one modal (name, email = sign-in id, username, password set-new-only, role). Delete blocked: self, last owner, anyone with ledger history (deactivate instead — VERIFY IN CODE that deactivation exists; if not, build it before any staff-offboarding request).
- Role matrix: 6 permission keys × 3 roles, tenant-overridable, defaults in @kembali/core, enforced server-side on nav, pages, actions, APIs. Any new feature adds its permission key to the matrix + MODULES.md.

## 11. Reports — Phase 1+2, shipped; deepens each phase
- Overview previews capped at latest 25 + tooltip + "See full report"; full pages (customers, unified transactions with type+outlet filters, rewards) with date range + pagination + CSV.
- CSV gating: analytics downloads = Founding + Growth only (planAllowsReportDownload in @kembali/core); Starter sees lock + upgrade hint; PDPA export never gated.
- Every new value-moving module adds: a preview card + a full page + CSV + (platform side) usage visibility. Phase 4 adds messages report; Phase 6 adds advanced analytics (do not build early).

## 12. QR kit — shipped 2026-07-11
- Menu item; A4/A5 poster PDFs (vector QR via pdf-lib) + PNG, tenant theme colors AA-checked, one per outlet when outlets differ; QR encodes tenant-scoped join URL (/app/join/[slug]); routing test exists (A's QR → A's join, always).
- Closure: regenerate after theme color change (kit reads live theme, no stale cache); logo changes likewise.

## 13. Tenant theming — shipped 2026-07-11
- Platform admin only sets brand_primary/brand_accent (nullable → Pandan default). All customer surfaces resolve through --tenant-* CSS vars derived AA-safe via @kembali/core (relativeLuminance/contrastRatio/onColor/ensureReadable/deriveTenantTheme). Never consume raw tenant hex anywhere. Picker shows live AA badges.
- Wallet passes (Phase 3) must derive pass colors from the same utilities.

## 14. Data lifecycle & PDPA (cross-cutting, partially built)
- Export: per-customer data export free on every plan (Settings). Includes profile, transactions, adjustments, redemptions, consents, merchant notes about them (§9).
- Deletion: **policy decided in principle, VERIFY IN CODE**: ledgers are append-only and must reconcile, so customer deletion = anonymization (null the PII: name/phone/email/birthday; keep events under an anonymized id). If a true-delete request arrives legally, escalate to founder. Retention policy duration: **ASK FOUNDER** (recommend: anonymize on request immediately; auto-anonymize after N years inactivity, N undecided).
- Merchant offboarding (churn): **ASK FOUNDER** when first merchant cancels. Options: export-and-freeze (tenant disabled, data kept M months, then purged) vs immediate purge on request. Invoice/PRICING promise "your data is yours" implies generous export before any purge.

## 15. Wallet passes — Phase 3 (next major)
- Design in ROADMAP §6. Non-negotiables: web card stays source of truth; pass = projection; stamp→pass-update <5s; cert health panel in platform admin (expiry countdown; a lapsed Apple cert bricks every pass); pass colors via §13 utilities; wallet metrics (adds/removals/active) in merchant admin; /demo page issues a real pass.
- Founder prerequisite: Apple Developer + Google Wallet Console accounts (weeks lead time; nag ONCE per session if still missing).
- Edge: pass revocation on customer anonymization (§14) and on tenant offboarding — passes must stop updating and ideally void; include in design.

## 16. Messaging & WhatsApp — OTP now (OTP-PLAN.md), retention Phase 4
- Infrastructure decisions locked: single Kembali WABA, `messages` ledger (tenant_id, customer_id, channel, type, status chain, provider_message_id, cost, created_at), platform-admin Messages report with merchant filter + spike alerts, OTP absorbed in plans, credits only for Phase 4 marketing sends.
- Phase 4 additions: templates (EN/BM/CN), automations (welcome/birthday/milestone/win-back) with quiet hours + per-customer frequency cap, test-send to self, audience preview count, credits balance + top-ups (RM0.50 marketing msg), opt-in enforcement absolute (no opt-in, no send, no exceptions), message history on customer detail.
- Edge: credit balance hits zero mid-automation → pause sends + notify merchant, never silently drop or overdraft. Template rejected by Meta → surface status in admin, fall back gracefully.

## 17. Referrals — Phase 5
- Both-sides reward on referee's FIRST STAMP (not signup — kills fake-signup fraud). Anti-abuse: self-referral block (same phone/device heuristics), velocity caps, audit flags. Personal link/QR + share sheet; status tracker ("reward arrives on their first visit"). Referral events are point_events with source=referral. Config: reward amounts per side, merchant-set, defaults suggested.
- **ASK FOUNDER** at build: reward as points or as a coupon? (Recommend points; simpler.)

## 18. Platform admin (system) — evolves continuously
- Exists: merchant directory + creation (sectioned: General → Plan/modules → Program → Outlets → Owner), module toggles, password resets, audit log, theming, plan field.
- Owed (➕ approved-in-matrix, unbuilt): read-only "view as merchant" with audit trail; system health page (DB, OTP provider, error rate). Phase 3 adds cert health; Phase 4 adds messages report + template tracker; Phase 6 adds usage metering, feature flags, rate-limit monitor.
- Any new module = toggle here + plan mapping per PRICING.md §8 table.

## 19. Billing & plans — manual by decision
- No payments in-product (Decision Log 2026-07-09). Manual invoice (bank transfer/DuitNow). Plan field on tenant gates features (report downloads today; Growth features as they ship). Founding = everything as it ships, −20% for life, first 20 shops.
- Trials: 30-day founding pilot / 14-day at public launch — enforcement is manual for now (**ASK FOUNDER** before building trial-expiry lockouts; a soft banner is likely enough at this scale).
- SST on invoices: founder's accountant question, still open (PRICING.md §7).

## 20. Marketing site — synced 2026-07-10; concepts branch exploring
- Bindings: DESIGN-dub.md style, SOP 3 + BRAND §5 copy bans (greps required), pricing page greys ONLY genuinely-unshipped features (re-check every ship), /roadmap mirrors ROADMAP §7 in public-friendly wording, no phase numbers or jargon public-facing.
- design-explorations branch holds concepts 1–10 + COMPARISON.md; nothing merges to main without founder picking; productionizing a concept = new Decision Log row + DESIGN-*.md update.

## 21. Session protocol for lower models (read every session)
1. Read CLAUDE.md → ROADMAP §7 + §13 → this file → MODULES.md → files you'll touch. In that order.
2. Restate the task; check it against the current phase (never build later phases early) and against §0 Closure Rule.
3. Unknowns: search Decision Log, then this file's ASK FOUNDER markers, then the code. Still unsure → ask the founder with 2–3 concrete options and a recommendation. Never invent policy.
4. Verify per SOP 4, all gates, every time. Never weaken a test.
5. Close the loop on docs: MODULES.md row, ROADMAP status, Decision Log for decisions, and UPDATE THIS FILE when an ASK FOUNDER gets answered (change the marker to a decision + date).
6. Git: repo-local identity (ripjian), commit per logical task, never push, never touch git config. Locks/divergence → report, don't force.
