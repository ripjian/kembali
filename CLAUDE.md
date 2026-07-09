# Kembali — Claude Code instructions & SOP

Multi-tenant SaaS digital stamp-card loyalty platform (Malaysia/SEA first). Customer cards live in a web PWA; points + rewards are Phase 2 (next), Apple/Google Wallet passes Phase 3. No payment processing in-product — subscriptions are invoiced manually. Staff stamp via QR scan on any phone. Solo founder; you are the engineering team.

**This file is the standard operating procedure.** It is written so any model — including smaller ones — can plan, build, verify, and communicate the same way. Follow it literally. When this file and your instinct disagree, follow this file.

## Read first, in this order
1. `ROADMAP.md` — requirements, architecture, phases, data model. **Source of truth.** Check the Decision Log (§13) before proposing anything — it may already be decided.
2. `SECURITY.md` — hard rules, standards (OWASP ASVS 5.0 L2, ISO 27001 alignment, PDPA), pre-merge checklist. Read before touching auth, data, or tenant-facing code.
3. `brand/BRAND.md` — Pandan palette tokens, logo rules, **voice & language rules (§5)**.
4. `brand/DESIGN-dub.md` — marketing-site style reference (frosted SaaS: white canvas, ash hairlines, Inter, restrained glass). `DESIGN-Monad.md` is superseded.

## Current status
Phases 0 + 0.5 done. **Phase 1 first working build shipped 2026-07-08**: OTP auth (dev bypass 888888, non-prod only), scan-to-stamp with amounts, customer card (QR/promos/spends), merchant + platform admin panels (roles, modules, password resets), basic reports. **Admin upgraded same day per founder review**: merchant panels live at `/admin/[slug]` (staff locked to their slug; platform area at `/admin/merchants` with search/filter/sort/pagination and create/edit modals incl. plan, address, square logo ≤512KB, modules), role-permission matrix (`@kembali/core` defaults + per-tenant overrides, enforced server-side), editable customer details (editCustomers permission). Dev runs on embedded PGlite (no DATABASE_URL needed); demo logins in `SEED_LOGINS` (`packages/db/src/seed-data.ts`). **Phase 2 core shipped 2026-07-10**: append-only `point_events` + trigger-maintained read-only `points_balance` (direct UPDATEs rejected, migration 0009), RM→points rate + rewards catalog at `/admin/[slug]/rewards` (`manageRewards` permission), point adjustments on the customer profile (`adjustPoints`, reason required, customer-visible, floor at zero), customer home = card-first + Show-QR modal + rewards list + redeem flow (in-store confirm → single-use `KMB-XXXX-XXXX` coupon, 15-min TTL, points deducted at staff confirm not reserve), cashier two-button scan (Scan member / Scan reward) with lookup + confirm APIs, points/redemption reports, points/rewards module toggles in merchant create/edit. Ledger reconciliation (stamps AND points) + concurrent single-use proofs: `packages/db/src/test/points.test.ts`. **Phase 1 remaining (still open): real OTP delivery (SMS/WhatsApp), onboarding wizard, printable QR kit — Stripe dropped 2026-07-09 (no payments in-product; manual invoicing per PRICING.md).** **Marketing synced to shipped scope 2026-07-10** (separate build): `/pricing` shipped (Founding RM99 hero / Starter RM149 / Growth RM279, per-outlet/month, no card — contact-to-invoice; PRICING.md §8), added to nav + footer; `/roadmap` reordered to §7 with points+rewards now "Live" and wallet+VIP tags "Up next" (new `PointsIllustration`, `rm-*` CSS); landing hero pill, features list and scroll showcase (added a rewards scene) refreshed to include points+rewards and drop stale wallet/custom-domain claims. Pricing greys "Coming soon" ONLY for genuinely-unshipped features. **Phase 2 remaining: pilot-merchant exit criterion.** Then (founder, 2026-07-09): **3 wallet passes + member tags → 4 WhatsApp → 5 referrals → 6 API/POS + advanced analytics** (ROADMAP §7, incl. the surface-evolution matrix). Never build a later phase early. Founder to-do: Apple Developer + Google Wallet Console applications (weeks of lead time).

## SOP 1 — How to plan any task
1. Restate the request in one sentence. If two readings are plausible and they diverge materially, ask; otherwise pick the obvious one and say so.
2. Read the relevant docs above + the files you'll touch **before** writing code.
3. Check scope against ROADMAP phases: never pull a later phase forward without the founder saying so. If a task implies an architectural choice, check the Decision Log; new choices get a new log row.
4. Break the work into steps with a task list (TaskCreate) when there are 3+ steps. Work them in order; mark progress as you go.
5. Prefer the smallest change that fully solves the task. Do not refactor unrelated code in the same commit.

## SOP 2 — How to code here
**Monorepo map (one Next.js server + packages):**
```
apps/web/src/app/(marketing)/   → / and /roadmap  (light-locked editorial theme)
apps/web/src/app/app/           → /app  customer PWA (light+dark)
apps/web/src/app/admin/         → /admin merchant dashboard (light+dark)
apps/web/src/components/        → app-local components (marketing/* for the site)
packages/db                     → Drizzle schema, RLS, migrations, seed. ALL db access
packages/core                   → domain logic (stamping, rewards, fraud) — pure, tested
packages/ui                     → shared components + BRAND.md theme tokens
packages/passes                 → wallet passes (BACKLOG — placeholder only)
packages/config                 → shared tsconfig/eslint presets + zod env helper
```
**Rules:**
- TypeScript strict; no `any` without an eslint-disable comment stating why.
- pnpm only. Node LTS. Never npm/yarn.
- zod validation at every boundary (API input, env, webhooks). Env schemas live in `src/env.ts` per app and fail at boot via `instrumentation.ts`.
- DB access **only** via `packages/db` → `withTenant()` + `kembali_app` role. Every tenant table: `tenant_id` + RLS policy + cross-tenant test. `stamp_events`/`audit_log` are append-only; `cards.stamps_count` is a projection.
- Domain logic goes in `packages/core` (pure functions, unit-tested), never in route handlers or components.
- Colors/typography come from BRAND.md tokens via `packages/ui`. **Pandan = actions, coral = earned rewards, leaf = progress — never swap.** Never invent hex values; derive with `color-mix` from tokens if a variant is missing, and flag the gap.
- Marketing surface (`brand/DESIGN-dub.md`): white canvas, 1px `--border` hairlines over shadows, Inter (500 tight-tracked display, 16px body, mono only for technical micro-labels), radii 9999/16/12/8px, glass (`.glass`) only on floating elements, light-only via `data-theme="marketing"`. Pandan is the single filled action per surface. App/admin: Plus Jakarta Sans, light+dark.
- Animations: follow `.claude/skills/emil-design-eng/SKILL.md` — transform/opacity only, strong ease-out for entries, UI under 300ms, stagger 30–80ms, never from scale(0), respect `prefers-reduced-motion`, pause decorative loops off-screen. In-page animations are CSS (the `rm-*` system in `apps/web/src/app/globals.css`); **video assets** (demo clips, social promos, MP4s) use the `remotion-best-practices` skill — never pull Remotion runtime deps into the web app for UI loops.
- Comments explain constraints the code can't show — not what the next line does.

## SOP 3 — Copy rules (hard)
- **English only. "Kembali" appears only as the brand name** — never as a verb, pun, or tagline word; no other Malay words in UI copy. (BM/CN message *templates* in Phase 2 are localization, not copy.)
- Follow `.claude/skills/ux-writing/SKILL.md`: sentence case; buttons verb-first 2–4 words; front-load the benefit; no idioms; no internal jargon in public copy ("MVP"→"At launch", "backlog"→"Planned"); 8–14 words per sentence where possible; error pattern = what failed → why → what to do.

## SOP 4 — How to verify (do all of it, every time)
1. `pnpm turbo run typecheck lint test build` from the repo root — all four must pass. Run from root, not a package dir (turbo scopes to cwd).
2. DB changes: tests run hermetically on PGlite (`packages/db/src/test/`) — no local Postgres exists on this machine, never require one. New tenant tables/queries need a cross-tenant isolation test in the same change.
3. UI changes: start the server with the preview tools (`web`, port 3000), then check — in this order:
   - `preview_console_logs` — zero errors/warnings (CSP violations show here).
   - Rendered content via snapshot/eval, not assumptions.
   - Mobile 360px width AND desktop.
   - Dark mode for /app and /admin (marketing is deliberately light-only).
   - Horizontal overflow check: `document.documentElement.scrollWidth > clientWidth` must be false at 360px.
   - Interactions: actually click through flows (React updates are async — wait between steps).
   - Screenshot as proof for the founder.
4. Security-relevant changes: `curl -sI http://localhost:3000/ | grep -i security` — headers must still be served; run the SECURITY.md §3 checklist.
5. If a gate fails, fix it before moving on. Never report done with a failing gate, and never weaken a test to pass it.

## SOP 5 — Definition of done (any feature)
Typecheck + lint + tests + build green · RLS respected with a cross-tenant test · works light and dark (where the surface supports dark) · mobile-first checked at 360px · zero console errors · security checklist run · docs updated (see SOP 6) · copy follows SOP 3 · committed with a conventional message.

## SOP 6 — Documentation discipline
- Every architectural or product decision → one row in ROADMAP §13 Decision Log (date, decision, rationale). Superseding an old decision? Add a new row saying so; don't rewrite history.
- Status changes (phase done, item backlogged) → update ROADMAP §7 and the "Current status" section of this file.
- New hard rules → the right home: security → SECURITY.md; brand/copy → BRAND.md; process → this file.
- Keep it honest: mark gaps and deviations explicitly rather than implying completeness.

## SOP 7 — How to work with the founder
- Lead with the outcome ("X is done and verified", "X is blocked on Y"), then supporting detail. No burying failures.
- Report deviations from the roadmap and placeholder values (e.g. unregistered domains, missing accounts) explicitly at the end of each task.
- Remind about external actions only the founder can do (accounts, domains, keys) — once, clearly, with lead times.
- Reversible work that follows from the request: just do it. Ask only for destructive actions, real scope changes, or spending money.
- Commit per logical task with conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Don't push unless asked.
- When interrupted or redirected, finish the redirect first, then close out anything explicitly requested earlier that still stands.

## Security (non-negotiable)
`SECURITY.md` is binding: 12 hard rules, the standards we follow, the control map, and the pre-merge checklist. Highlights you will use daily: no secrets in the repo, `withTenant()` for all tenant data, append-only ledgers, zod everywhere, signed short-TTL QR tokens, rate-limited OTP, verified webhooks, security headers stay on, audit log for privileged actions, no PII in logs.

## Environment quirks (this machine)
- No Docker, no local Postgres, no corepack. pnpm was installed via `npm i -g pnpm`. DB verification = PGlite tests; `pnpm db:migrate`/`db:seed` need a real `DATABASE_URL` (Neon/Supabase, or `docker compose up -d db` once Docker exists).
- Dev server: `pnpm dev` → everything on http://localhost:3000 (`/`, `/roadmap`, `/app`, `/admin`). Use the preview tools, not raw background processes, when a browser check is needed.
- Remote: `origin` = https://github.com/ripjian/kembali.git. CI (GitHub Actions) runs typecheck/lint/test/audit/build on every push to main and on PRs. Still run the gates locally before committing — don't use CI as the first check.
