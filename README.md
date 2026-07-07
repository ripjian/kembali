# Kembali

Multi-tenant digital stamp-card loyalty platform for Malaysia/SEA. Customer
cards live in a web PWA and Apple Wallet / Google Wallet — no app download.

**Read first:** [ROADMAP.md](./ROADMAP.md) (source of truth) ·
[brand/BRAND.md](./brand/BRAND.md) (design tokens) ·
[CLAUDE.md](./CLAUDE.md) (conventions & guardrails).

## Layout

| Path | What |
|---|---|
| `apps/marketing` | Public site — port 3000 |
| `apps/app` | Customer PWA + cashier scanner — port 3001 |
| `apps/admin` | Merchant dashboard (+ super-admin) — port 3002 |
| `packages/db` | Drizzle schema, migrations, RLS policies, seed |
| `packages/passes` | Apple/Google wallet passes (Phase 1) |
| `packages/core` | Domain logic (stamping, rewards, fraud rules) |
| `packages/ui` | Shared components + Pandan theme from BRAND.md |
| `packages/config` | Shared tsconfig/eslint + zod env validation |

## Getting started

```sh
pnpm install
pnpm dev                # all three apps (3000/3001/3002)

# database (needs Postgres — `docker compose up -d db`, or Neon/Supabase)
cp .env.example .env    # then fill DATABASE_URL
pnpm db:migrate
pnpm db:seed            # demo tenant "Kopi Kembali"

# quality gates (same as CI)
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

DB tests (including the cross-tenant RLS suite) run against in-process
PGlite — no local Postgres required for `pnpm test`.

## Non-negotiables

- Tenant data access only via `withTenant()` from `@kembali/db` — RLS on
  every tenant table, connections run as the `kembali_app` role.
- `stamp_events` is an append-only ledger (DB triggers enforce it);
  `cards.stamps_count` is a projection.
- No secrets in the repo. Wallet certs/keys live in the secrets manager.
- Pandan = actions, coral = earned rewards — never swap (BRAND.md §2).
