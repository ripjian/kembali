# Kembali — Claude Code instructions

Multi-tenant SaaS digital stamp-card loyalty platform (Malaysia/SEA first). Customer cards live in a web PWA **and** Apple Wallet / Google Wallet — no app download. Staff stamp via QR scan on any phone.

## Read first
1. `ROADMAP.md` — requirements, architecture, phases, data model, security (source of truth)
2. `brand/BRAND.md` — name, logo, Pandan palette, CSS design tokens (use these, don't invent colors)

## Current status
**Phase 0 done (2026-07-07). Current: Phase 0.5 (marketing landing + /roadmap), then Phase 1 MVP — core loyalty, wallet passes BACKLOGGED** (see ROADMAP §7).

Phase 0 checklist:
- [x] Scaffold Turborepo + pnpm monorepo per ROADMAP §3 layout (`apps/marketing`, `apps/app`, `apps/admin`; `packages/db|passes|core|ui|config`)
- [x] Next.js (App Router) + TypeScript strict in all apps
- [x] `packages/db`: Drizzle + Postgres schema v1 (ROADMAP §4) + RLS policies + seed script
- [x] `packages/ui`: Tailwind theme from BRAND.md tokens (light + dark)
- [x] Env validation (zod), Sentry, GitHub Actions CI (typecheck, lint, test, build)
- [x] ~~Apple Developer + Google Wallet Console accounts~~ — wallet passes moved to Backlog; start the applications when that item is pulled

Routing: one domain — marketing at `/`, customer PWA at `/app` (basePath), admin at `/admin` (basePath). Marketing style: `brand/DESIGN-Monad.md` (serif+mono editorial) on Pandan colors, light-only.

## Conventions
- TypeScript strict everywhere; no `any` without a comment justifying it
- pnpm only (no npm/yarn); Node LTS
- Validation with zod at every boundary (API input, env, webhooks)
- DB access only through `packages/db`; every tenant table has `tenant_id` + RLS — never query across tenants
- `stamp_events` is append-only; never UPDATE/DELETE stamp history; `cards.stamps_count` is a projection
- Domain logic lives in `packages/core`, not in route handlers
- UI colors/typography come from BRAND.md tokens via `packages/ui`; pandan = actions, coral = earned rewards (never swap)
- Conventional commits (`feat:`, `fix:`, `chore:`)

## Security guardrails (non-negotiable, ROADMAP §5)
- No secrets in the repo — env vars only; Apple pass certs / Google service-account keys never committed
- Customer QR tokens: signed + short TTL (60–120s), validated server-side with velocity rules
- OTP endpoints rate-limited; sessions httpOnly/secure/sameSite
- Stripe/WhatsApp webhooks must verify signatures
- PDPA: marketing opt-in per channel; data export/delete must keep working

## Definition of done (any feature)
Typecheck + lint + tests pass in CI; RLS respected (add a cross-tenant test); works in light and dark mode; mobile-first checked at 360px width; no console errors.
