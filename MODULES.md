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
| Auth / OTP | customer · `/app/login`, `/api/auth/otp/*` | customer | Phone OTP login/register; dev bypass `888888` (non-prod only) | — | All | 1 | Live |
| Stamp card | customer · `/app` | customer | Branded card, stamp progress, earned rewards, recent visits | — | All | 1 | Live |
| Show QR | customer · `/app` modal, `/api/app/qr-token` | customer | Rotating signed QR (90s TTL) + fallback code to collect stamps | — | All | 1 | Live |
| Scan-to-stamp | cashier · `/admin/[slug]/scan` (Scan member), `/api/admin/stamp` | cashier, merchant admin | Scan a member's QR, key in amount, add a stamp (+ points) | `scan` | All | 1 | Live |
| Points accrual | system · `/api/admin/stamp` | (automatic) | Earns points from the keyed-in amount × the tenant rate; append-only `point_events`, read-only `points_balance` | — (module: points) | All | 2 | Live |
| Points settings / rate | merchant admin · `/admin/[slug]/rewards` | merchant admin | Set RM→points rate (0 pauses earning) | `manageRewards` | All | 2 | Live |
| Point adjustments | merchant admin · `/admin/[slug]/customers/[id]` | merchant admin | Add/deduct points with a required reason; ledgered + customer-visible; floored at zero | `adjustPoints` | All | 2 | Live |
| Rewards catalog | merchant admin · `/admin/[slug]/rewards` | merchant admin | Create/edit rewards (title, description, square image ≤512 KB, points cost, active) | `manageRewards` | All | 2 | Live |
| Redemption flow | customer · `/app/rewards/[id]`, `/app/coupons/[id]` | customer | Redeem → "at the store?" confirm → single-use `KMB-XXXX-XXXX` coupon (QR + code), 15-min TTL, cancellable | — (module: rewards) | All | 2 | Live |
| Reward scanning | cashier · `/admin/[slug]/scan` (Scan reward), `/api/admin/redemption`(+`/confirm`) | cashier | Scan/type a coupon, see reward + member, confirm; single-use, points leave balance at confirm | `redeemRewards` | All | 2 | Live |
| Customers CRM | merchant admin · `/admin/[slug]/customers` (+ `/[id]`, `/new`) | merchant admin | List with search/sort/filter + clickable rows; detail with stats & history; create; edit in a modal | `manageCustomers` (view/create), `editCustomers` (edit) | All | 1 | Live |
| Team & roles | merchant admin · `/admin/[slug]/team` | merchant admin | Add/edit/remove staff (one modal), per-tenant role-permission matrix | `manageTeam` | All | 1 | Live |
| Reports overview | merchant admin · `/admin/[slug]/reports` | merchant admin | Headline tiles + previews (latest 25 each) with "See full report" links | `viewReports` | All | 1 (+2 points/rewards) | Live |
| Full reports | merchant admin · `/admin/[slug]/reports/{customers,transactions,rewards}` | merchant admin | Paginated reports with date range; transactions unify stamps + points + amounts with a type filter | `viewReports` | All | 2 | Live |
| Report downloads (CSV) | merchant admin · `/admin/[slug]/reports/export` | merchant admin | CSV of the analytics reports above | `viewReports` + plan gate | **Founding + Growth** | 2 | Live |
| Rewards / points module toggles | platform admin · `/admin/merchants` create/edit | platform admin | Enable/disable per-tenant modules (stamps, scan, reports, points, rewards) | platform only | All | 1 | Live |
| Merchant directory | platform admin · `/admin/merchants` | platform admin | Search/filter/sort/paginate; create & edit merchants (plan, address, logo, modules) | platform only | n/a | 1 | Live |
| Audit log | system · written by privileged actions | platform + merchant admin | Append-only record of privileged actions (staff, points, redemptions, tenant changes) | — (write); viewer UI planned | All | 1 | Live (viewer UI planned) |
| Marketing site | public · `/`, `/roadmap`, `/pricing` | prospect | Landing (with reach-out qualifier), public roadmap, pricing | — | n/a | 0.5–2 | Live |

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
