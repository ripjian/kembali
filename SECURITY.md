# Kembali — Security Standard

> **Who this is for:** every engineer and every AI model working on this repo.
> These are not suggestions. If a change violates a HARD RULE, the change is
> wrong — stop and fix the approach, not the rule. When a rule and a feature
> conflict, the rule wins and the conflict gets raised to the founder.

## 1. Standards we follow

| Standard | What it is | How we use it | Status |
|---|---|---|---|
| **OWASP ASVS 5.0** (May 2025) | ~350 verifiable application-security requirements | The code-level bar. Every feature is reviewed against **Level 2** (standard for apps handling personal data). When unsure how to build something securely, look up the ASVS section first | Active — applies to every PR |
| **ISO/IEC 27001:2022** | International information-security management standard (organizational) | Certification target once the company has customers/staff to justify the audit. We build controls now so certification later is paperwork, not re-engineering | Aligning — see control map §4 |
| **Malaysia PDPA 2010 + Amendment Act 2024** | Data-protection law where we operate. 2024 amendments: **mandatory breach notification (72h)**, DPO appointment, biometric data = sensitive, fines to RM1,000,000 | Legal requirement, not optional. Drives consent, export/delete, retention, and breach-response design | Mandatory — enforced in schema (`marketing_opt_ins`) and feature checklists |
| **SOC 2 Type II** | Audit report on security/availability controls over time | Future need for enterprise/chain merchants. ISO 27001 alignment covers ~80% of the prep | Later — do not optimize for it yet |
| **PCI DSS** | Card-payment security standard | **Kept out of scope by design**: Stripe hosts all card data (SAQ-A posture). Never store, log, or proxy card numbers | Out of scope — keep it that way |

## 2. HARD RULES (non-negotiable)

Violating any of these fails review, no exceptions:

1. **No secrets in the repo.** No API keys, certs, tokens, connection strings, or `.env` files — ever, including in tests, comments, and commit history. Secrets live in env vars / the deployment platform's secret store. `.env.example` documents *names only*.
2. **Tenant data is reached only through `withTenant()`** (`packages/db/src/client.ts`) **as the `kembali_app` role.** Every tenant table has `tenant_id` + an RLS policy. Never connect the app as the table owner. Never query across tenants. Any new tenant table ships with its RLS policy **and a cross-tenant test in the same PR**.
3. **`stamp_events` and `audit_log` are append-only.** No UPDATE or DELETE — the DB blocks it (missing grants + triggers); never work around it. `cards.stamps_count` is a projection, recomputed from events, never hand-edited.
4. **Validate every boundary with zod**: API input, env vars, webhooks, query params, form data. Parse, don't trust. Unvalidated `req.body`/`searchParams` use is a review failure.
5. **Customer QR tokens are signed and short-lived** (HMAC/JWT, TTL 60–120s), validated server-side with velocity rules (min interval per card, max stamps/day, per-cashier caps). Never accept a bare card ID as stamp authorization.
6. **Sessions**: httpOnly, secure, sameSite cookies; short-lived with rotation. OTP endpoints rate-limited per phone AND per IP. No passwords for customers; merchant staff get email+password with optional TOTP.
7. **Webhooks (Stripe, WhatsApp) must verify signatures** before any processing. Unverified payloads are dropped and logged.
8. **Security headers stay on** (`apps/web/next.config.ts`): CSP, HSTS, nosniff, frame-ancestors 'none', Referrer-Policy, Permissions-Policy. If a feature breaks the CSP, tighten the feature, don't loosen the policy without a decision-log entry.
9. **Privileged actions write to `audit_log`** (actor, action, entity, tenant) — refunds, staff changes, exports, deletions, plan changes.
10. **No PII in logs or error messages.** Phone numbers, emails, and names never go to console/Sentry. Log IDs, not identities.
11. **PDPA is product behavior**: marketing messages only to explicitly opted-in channels (`customers.marketing_opt_ins`); data export and delete must always work; breach response within 72 hours (see §6).
12. **Dependencies**: `pnpm audit` runs in CI; Dependabot PRs get reviewed, not rubber-stamped. New dependencies need a stated reason in the PR — prefer the platform/stdlib.
13. **Dev conveniences never reach production.** The OTP bypass code (888888) is gated on `NODE_ENV !== "production"` (`apps/web/src/lib/config.ts`) — never widen that gate. Seeded demo credentials (`SEED_LOGINS` in `packages/db/src/seed-data.ts`) exist for local/pilot testing only: rotate or remove them before any deployment holding real customer data. The embedded PGlite dev database is refused in production (`lib/db.ts` throws without DATABASE_URL).

## 3. Feature security checklist (run before every merge)

- [ ] Does it touch tenant data? → goes through `withTenant()`, cross-tenant test added/updated
- [ ] New input path (API/form/webhook/env)? → zod schema at the boundary
- [ ] New privileged action? → authz check server-side + `audit_log` entry
- [ ] Anything secret involved? → env var name in `.env.example`, value nowhere
- [ ] New external calls or embeds? → CSP `connect-src`/`img-src` reviewed, not wildcarded
- [ ] Personal data touched? → covered by export/delete; not logged; opt-in respected
- [ ] Errors? → user sees a safe message, logs get the ID, Sentry gets no PII
- [ ] File uploads? → allow-list mime types, cap size, validate dimensions client AND server side (see merchant logo: PNG/JPG/WebP, square, ≤512 KB, data-URL prefix + length re-checked in the action)
- [ ] Role-gated feature? → check the permission in the server action/API, not only the UI (nav hiding is cosmetic)
- [ ] `pnpm turbo run typecheck lint test build` green

## 4. Control map (ISO 27001 Annex A / ASVS → this codebase)

| Control | Implementation | Verified by |
|---|---|---|
| Access control / tenant isolation (A.5.15, ASVS V4) | Postgres RLS on all 13 tables, `kembali_app` role, `withTenant()` GUC | `packages/db/src/test/rls.test.ts` (runs in CI) |
| Logging integrity (A.8.15) | `stamp_events` + `audit_log` append-only via revoked grants + DB triggers | same test file, owner-level checks |
| Input validation (ASVS V5) | zod at every boundary; `createEnv()` fails boot on bad env | typecheck + boot behavior |
| Secure headers (ASVS V14/V50) | CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy in `apps/web/next.config.ts` | `curl -I` in verification workflow |
| Secrets management (A.8.24) | Env vars only; `.gitignore` blocks `.env*`, certs, keys; secrets manager in prod | repo scan; review |
| Cryptography (ASVS V6) | QR tokens HMAC-SHA256 (90s TTL), scrypt passwords, sha256-hashed session tokens — `packages/core/src/auth.ts` | `packages/core/src/auth.test.ts` |
| Authentication (ASVS V2/V3) | Customer OTP (hashed, 5-min TTL, 5 attempts, 3-live-codes rate limit); staff/platform passwords; httpOnly/secure/lax cookies; sessions expire + delete on logout | core tests + manual flows |
| Session lifetime + rotation (ASVS V3.3/V3.7) | Three clocks, all enforced server-side: **absolute** (customer 30d, admin 12h, never extended), **idle** (14d / 4h, refreshed coarsely every 5 min), **rotation** (the cookie token is replaced every 24h / 1h, session id unchanged). The superseded token is accepted for a 120s grace so requests already in flight survive the swap. Rotation is a compare-and-set on the token hash, so two concurrent rotations cannot both win; if the cookie write fails afterwards the row is rolled back rather than sign anyone out. Renders cannot write cookies, so the signed-in layouts ping `POST /api/session/keep` (throttled to 1/min per tab) and a browse-only session rotates on the same clock as everyone else. Cookie `Max-Age` tracks the absolute window, deliberately not the idle one, so the browser copy never dies before the session does | `packages/core/src/session.test.ts` (35 cases), `packages/db/src/test/sessions.test.ts` (15 cases), end-to-end runs for rotation, grace, idle, absolute, render-safety and keep-alive |
| Replayed-token detection | A superseded token presented after its grace period is theft **only if its replacement has been seen in use** (`token_confirmed_at`). If nobody ever used the replacement, the rotation reply was lost in transit and the browser is the same browser: it is handed a fresh token instead of being signed out. When it is theft, the session is revoked outright, so the thief and the real holder both stop, and the real person learns of it by being asked to sign in again. Tenant-scoped revocations write `audit_log` (`session.replayed_token_revoked`, ids only, no personal data) for the §6 72-hour clock; a platform session has no tenant to file under and gets a log line | end-to-end run: the identical replay reads as recovery when the replacement is unused and as theft the moment it is used |
| Auth throttling (ASVS V2.2.1, V11.1) | `auth_attempts` (global, HMAC'd keys) + pure policy in `@kembali/core/throttle`, judged on **five** keys, every one of which can only *add* locking: (account, device), device alone, (account, address), account alone, address alone. Login: 5 per pair/15min, 5 per account+device, 10 per device, 50 per account/hour, 20 per address/15min. OTP sends: 5 per phone/hour, 8 per device/hour, 60 per address/hour. OTP verifies: 10 per pair/hour, 12 per device/hour, 60 per address/hour. Attempts are **recorded before the verdict**, so caps hold against parallel bursts. Success clears that account's failures for the address and device that succeeded. Decoy scrypt on unknown emails defeats enumeration; every locked email gets an identical message | `packages/core/src/throttle.test.ts` (28 cases), `packages/db/src/test/auth-attempts.test.ts` (10 cases), end-to-end runs for lockout, concurrency, owner-not-locked-out, and device-follows-network-change |
| Device key (`kb_dev`) | Opaque random id in an httpOnly, secure, lax cookie, 180 days, hashed with a domain-separated pepper before storage. Strictly a security control: not readable by scripts, never used for analytics or cross-site anything. Two honest properties: it survives an address change (mobile data reassigns addresses constantly), and it is the only key an attacker cannot forge onto a stranger, which is why device limits are safe to keep tight. It is also the weakest key, since clearing cookies resets it, so it never replaces the address axis. Absent devices are deliberately **not** bucketed together: one shared "unknown device" key would let one attacker lock out every first-time visitor | device-axis end-to-end run (locked browser stays locked across a network hop; cleared cookies fall back to address limits) |
| Anti-fraud velocity (ASVS V11) | 60s min interval + 10/day per card enforced server-side on every stamp | `packages/core` tests |
| Platform-admin separation | `app.platform_admin` GUC bypass limited to tenants/staff_users, set only by `withPlatform()` after a verified platform session; all uses audit-logged | code review + RLS suite |
| Vulnerable components (A.8.8) | `pnpm audit` in CI + Dependabot weekly | CI |
| Monitoring (A.8.16) | Sentry (DSN via env, no PII) | config review |
| Backup/DR (A.8.13) | Postgres PITR (Neon/Supabase) + restore runbook | Phase 1 setup task |
| Privacy & PDPA (A.5.34) | Per-channel opt-in field; export/delete endpoints (Phase 1); retention policy | schema now; endpoint tests Phase 1 |

Gaps are listed honestly: real OTP delivery (SMS/WhatsApp), nonce-based CSP, PDPA export/delete endpoints, TOTP 2FA for staff, and the DR runbook are **Phase 1 exit criteria**, not done. IP-level rate limiting on auth endpoints landed 2026-07-20, session rotation with replay detection on 2026-07-31 (rows above). Field-level encryption of PII at rest is an open founder decision (key management), tracked in the security review of 2026-07-20; JWT/API-key auth arrives with the Phase 6 public API, and SSO (OIDC) waits on the first chain that asks for it.

**Address-trust caveat:** source-address limits read `x-real-ip` then the first `x-forwarded-for` entry. Behind Vercel (or any proxy that rewrites the header) that is the real client. Behind a proxy that passes it through unmodified it is attacker-controlled, so address limits degrade to advisory. Identity limits do not depend on the address and always hold — never rely on the address axis alone. Global auth tables (`sessions`, `auth_attempts`, `otp_codes` via tenant policy, `platform_admins`) are keyed by unguessable hashes and are deliberately outside tenant RLS. `auth_attempts` holds no plaintext: identifiers and addresses are HMAC'd with a domain-separated pepper, and the pepper refuses its dev fallback whenever `DATABASE_URL` is set, because a published constant would make Malaysian phone hashes reversible. Rows are pruned opportunistically by the writing paths; a dedicated retention job and clearing a customer's rows on PDPA delete are open items.

## 5. Secrets & keys

- Local: `.env` (gitignored), copied from `.env.example`.
- Production: platform secret store (Vercel encrypted env / Doppler). Wallet signing certs and service-account keys (backlog item) go **only** there, with per-pass `authenticationToken` stored in the DB per ROADMAP §5.
- Rotate any secret that ever touches a chat log, screenshot, or commit — immediately, then clean history.

## 6. Incident response (PDPA 72-hour clock)

1. Contain: revoke affected credentials/sessions; take the affected surface offline if needed.
2. Assess scope: which tenants, which personal data, `audit_log` + provider logs.
3. Notify: Personal Data Protection Commissioner within **72 hours** if personal data is involved; affected merchants without undue delay (they may have their own duties to customers).
4. Record: timeline, root cause, and fix in an incident file; add a decision-log entry for structural changes.

## 7. When you're unsure

Look it up in ASVS 5.0 first. If the answer changes architecture or costs money (WAF, secrets manager tier, audit), stop and put the question to the founder with a recommendation. Never ship "temporarily insecure".
