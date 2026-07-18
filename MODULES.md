# Kembali — Module inventory

A map of every capability in the product: what it is, where it lives, who it's
for, how it's gated, and whether it's shipped. Keep this in sync when a module
lands or moves (SOP 6). Permission keys are the `@kembali/core` role-matrix keys
(`packages/core/src/permissions.ts`); plan gating uses `tenants.plan`
(`packages/core/src/plans.ts`). Audience: **customer** (PWA), **cashier**
(counter), **merchant admin** (store back-office), **platform admin** (Kembali
system admin).

> **Plan availability shorthand.** Almost everything is available on every paid
> plan — the loyalty core is not gated (PRICING.md). The only in-product gate
> today is **analytics CSV download** (Founding + Growth). Wallet/tags/WhatsApp/
> referrals/custom-domain are plan-differentiated but not built yet (greyed
> "Coming soon" on `/pricing`). "All" below means Founding, Starter and Growth.

## Live modules

| Module | Surface · route | For | What it does | Permission key(s) | Plans | Phase | Status |
|---|---|---|---|---|---|---|---|
| Auth / OTP | customer · `/app/login`, `/app/join/[slug]`, `/api/auth/otp/*` | customer | Phone OTP. Codes go through an `OtpSender` (NullSender today; `OTP_PROVIDER=none`, no real delivery yet). Non-prod shows a "no provider, use `888888`" notice; a prod build with `OTP_PROVIDER=none` fails at boot. Dev bypass `888888` non-prod only | — | All | 1 | Live |
| Stamp card | customer · `/app` | customer | Branded card, stamp progress, earned rewards, recent visits | — | All | 1 | Live |
| Show QR | customer · `/app` modal, `/api/app/qr-token` | customer | Rotating signed QR (90s TTL) + fallback code to collect stamps | — | All | 1 | Live |
| Scan-to-stamp | cashier · `/admin/[slug]/scan` (Scan member), `/api/admin/stamp` | cashier, merchant admin | Scan a member's QR, key in amount, add a stamp (+ points); attributed to the serving outlet | `scan` | All | 1 | Live |
| Outlets & attribution | cashier · `/admin/[slug]/scan`; system · all event writes | cashier, merchant admin | Cashier picks a serving outlet once/day (skipped for single-outlet); every stamp/point/redemption records `outlet_id`. Per-branch permissions + cross-outlet analytics are Phase 6 | `scan` (to set) | All | 1 (light), 6 (deep) | Live |
| Points accrual | system · `/api/admin/stamp` | (automatic) | Earns points from the keyed-in amount × the tenant rate; append-only `point_events`, read-only `points_balance` | — (module: points) | All | 2 | Live |
| Points settings / rate | merchant admin · `/admin/[slug]/rewards` | merchant admin | Set RM→points rate (0 pauses earning) | `manageRewards` | All | 2 | Live |
| Point adjustments | merchant admin · `/admin/[slug]/customers/[id]` | merchant admin | Add/deduct points with a required reason; ledgered + customer-visible; floored at zero | `adjustPoints` | All | 2 | Live |
| Rewards catalog | merchant admin · `/admin/[slug]/rewards` | merchant admin | Create/edit rewards (title, description, square image ≤512 KB, points cost, active) | `manageRewards` | All | 2 | Live |
| Redemption flow | customer · `/app/rewards/[id]`, `/app/coupons/[id]` | customer | Redeem → "at the store?" confirm → single-use `KMB-XXXX-XXXX` coupon (QR + code), 15-min TTL, cancellable | — (module: rewards) | All | 2 | Live |
| Reward scanning | cashier · `/admin/[slug]/scan` (Scan reward), `/api/admin/redemption`(+`/confirm`) | cashier | Scan/type a coupon, see reward + member, confirm; single-use, points leave balance at confirm | `redeemRewards` | All | 2 | Live |
| Customers CRM | merchant admin · `/admin/[slug]/customers` (+ `/[id]`, `/new`) | merchant admin | List with search/sort/filter + clickable rows; detail with stats & history; create; edit in a modal | `manageCustomers` (view/create), `editCustomers` (edit) | All | 1 | Live |
| Team & roles | merchant admin · `/admin/[slug]/team` | merchant admin | Add/edit/remove staff (one modal), per-tenant role-permission matrix | `manageTeam` | All | 1 | Live |
| Reports overview | merchant admin · `/admin/[slug]/reports` | merchant admin | Headline tiles + previews (latest 25 each) with "See full report" links | `viewReports` | All | 1 (+2 points/rewards) | Live |
| Full reports | merchant admin · `/admin/[slug]/reports/{customers,transactions,rewards}` | merchant admin | Paginated reports with date range; transactions unify stamps + points + amounts with type + outlet filters (outlet hidden for single-outlet) | `viewReports` | All | 2 | Live |
| Report downloads (CSV) | merchant admin · `/admin/[slug]/reports/export` | merchant admin | CSV of the analytics reports above | `viewReports` + plan gate | **Founding + Growth** | 2 | Live |
| Rewards / points module toggles | platform admin · `/admin/merchants` create/edit | platform admin | Enable/disable per-tenant modules (stamps, scan, reports, points, rewards) | platform only | All | 1 | Live |
| Merchant directory | platform admin · `/admin/merchants` | platform admin | Search/filter/sort/paginate; sectioned create (General → Plan & modules → Program → Outlets → Owner) with repeatable outlets incl. postcode; edit plan/modules/logo. Location reads the first outlet | platform only | n/a | 1 | Live |
| Admin appearance & nav | merchant + platform admin · admin sidebar/drawer | merchant + platform admin | Auto/Light/Dark toggle (persisted); Reports submenu; sticky full-height rail; left hamburger drawer below `lg` | — | All | 1 | Live |
| Tenant theming (white-label) | platform admin · `/admin/merchants` edit; customer · `/app/*` | platform admin (set), customer (see) | Platform admin sets `brand_primary`/`brand_accent` per tenant with a live card preview + AA contrast badges. Customer surfaces resolve buttons/links/progress/stamps through `--tenant-*` CSS vars, derived AA-safe by `@kembali/core` (light + dark). Null = Kembali default. Merchants cannot edit colours | platform only (set) | All | 1 (light), 3 (deep) | Live |
| QR kit | merchant admin · `/admin/[slug]/qr-kit` (+ `/download`) | merchant admin, cashier | Print-ready join kit: A4/A5 poster PDFs (vector QR) + high-res PNG, in the shop's theme colours, with shop name, logo, join link and instructions. One kit per outlet when outlets differ | — (any staff of the store) | All | 1 | Live |
| Customer join (tenant-scoped) | customer · `/app/join/[slug]` | customer | A merchant's QR opens their branded join page; the slug decides which tenant a customer joins, independent of any session. OTP request/verify create the customer under the scanned tenant | — | All | 1 | Live |
| Customer registration | customer · `/app/register` | customer | After OTP verify, a nameless customer completes a one-screen profile (full name required, phone verified/read-only, email optional, birthday skippable, marketing opt-in unchecked per PDPA), themed in the tenant's colours. Returning named customers skip it. `completeCustomerProfile` action: zod, `withTenant`, audit-logged | — | All | 1 | Live |
| Audit log | system · written by privileged actions | platform + merchant admin | Append-only record of privileged actions (staff, points, redemptions, tenant changes) | — (write); viewer UI planned | All | 1 | Live (viewer UI planned) |
| Marketing site | public · `/`, `/story`, `/roadmap`, `/pricing`, `/security`, `/privacy`, `/contact`, `/about`, quiet `/your-app` | prospect | Editorial showcase surface (`.sc-root` scoped): landing (reach-out quiz → tailored pitch → card simulator), story, roadmap, pricing incl. build-your-own estimator (PRICING.md §9 proposal), branded-app demo page for chains | — | n/a | 0.5–2 | Live |

## Planned modules (not built — do not build ahead of phase)

| Module | For | What it will do | Plans | Phase | Status |
|---|---|---|---|---|---|
| PDPA data export | merchant admin (settings) | Export all customer data to CSV — **free on every plan, forever** (separate from the gated analytics downloads above) | All | 1 (remaining) | Planned |
| Real OTP delivery | customer | Send OTP by SMS/WhatsApp (today the code is dev-only) | All | 1 (remaining) | Planned |
| Onboarding wizard + printable QR kit | merchant admin | Guided setup and a printable counter QR | All | 1 (remaining) | Planned |
| Apple / Google Wallet passes | customer | Add-to-wallet, live pass updates | Starter + Growth | 3 | Planned |
| VIP / staff member tags | merchant admin | Point multipliers per tag (replaces base rate) | Growth | 3 | Planned |
| WhatsApp automations + campaigns | merchant admin | Welcome/birthday/win-back, campaign builder, credits | Growth | 4 | Planned |
| Referral rewards | customer + merchant admin | Personal referral links, both-sides rewards | Growth | 5 | Planned |
| API / POS + advanced analytics | platform / merchant admin | Public API, POS integrations, deeper multi-outlet reporting | Growth | 6 | Planned |
| Custom domain white-label | merchant admin | Serve the customer card on the merchant's own domain | Growth | 6 | Planned |

## Notes

- **Nav vs. enforcement:** the sidebar hides links a role/module can't use, but
  every gated action re-checks the permission (and plan, for downloads)
  server-side — nav hiding is cosmetic (SECURITY.md checklist).
- **Analytics downloads vs. PDPA export:** the CSV download on the report pages
  is an analytics perk gated to Founding + Growth. The PDPA "export my customer
  data" feature (Planned, in settings) is a legal obligation and stays free on
  every plan — never gate it.
- **Demo plans:** the seed ships Corner Coffee on **Founding** (downloads on)
  and Bloom Bakery on **Starter** (downloads locked) so both states are visible.
