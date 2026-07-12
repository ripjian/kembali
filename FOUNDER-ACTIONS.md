# Kembali — Founder Action Plan (2026-07-11)

> Things only the founder can do, mapped to phases. Models: nag ONCE per session for overdue critical-path items. Check off + date when done.

## NOW (this week) — everything here gates something

**Critical path (external approvals with lead times):**
- [ ] **Meta Business verification** (Business Manager + SSM docs). Gates real OTP → gates pilot going live. 2h–2wks. (OTP-PLAN §3)
- [ ] **Dedicated SIM/number for WhatsApp Business** (not on personal WhatsApp) + display name request "Kembali".
- [ ] **Apple Developer Program enrollment** (individual is fastest; organization needs DUNS number, add weeks). Gates Phase 3 wallet. Start NOW even though Phase 3 is next-next.
- [ ] **Google Wallet API issuer access** (Google Pay & Wallet Console + service account). Same reason.

**Business setup:**
- [ ] Domains: kembali.my / kembali.app / kembali.com (whichever available) + social handles. Blocks production deploy + QR kit URLs being final.
- [ ] MyIPO trademark search + filing, "Kembali", classes 9/35/42 (BRAND §6).
- [ ] Accountant: SST treatment for SaaS subscriptions before first invoice (PRICING §7); prepare invoice template + bank/DuitNow details.
- [ ] Production accounts: Neon/Supabase (real DATABASE_URL), Vercel (hosting + domain DNS), Sentry org. Dev runs on PGlite; production cannot.

**Sales (the actual goal):**
- [ ] Add your WhatsApp number to the pitch deck contact slide (pitch/kembali-founding-merchant-pitch.pptx).
- [ ] Shortlist 10 target shops; pitch first 3–5 founding merchants (RM99, 30-day pilot). One yes = pilot exit criterion for Phase 2.
- [ ] Push pending commits (`git push origin main`) — currently ahead of origin.

## During pilot (Phase 2 wrap)
- [ ] Collect real numbers weekly (members, repeat rate, redemptions) → replace industry stats on slide 2 of the deck + marketing site.
- [ ] Photos at the pilot shop (feeds case study + design concept 6 if chosen).
- [ ] Month 2: ask pilot merchant for Google review + case-study consent (it's in the founding deal).
- [ ] Answer ASK FOUNDER items as they surface (DEVSPEC): points expiry, phone-change flow, etc.

## Phase 3 — Wallet passes
- [ ] Apple + Google approvals DONE before dev starts (else phase slips; applications were the NOW items above).
- [ ] Pay Apple's annual developer fee when enrolling (~USD 99/yr).
- [ ] Pick the winning design concept from /concepts (1–10) so marketing can productionize alongside wallet launch ("card in your customer's wallet" is the launch story).

## Phase 4 — WhatsApp retention
- [ ] WABA already verified (from OTP work). Approve message template wording; BM/CN templates need a native-speaker review (you or someone you trust — models draft, humans approve).
- [ ] Confirm credit pricing still matches Meta rates (re-check RM0.35 marketing rate at build time).
- [ ] Decide segment thresholds (what counts as "slipping" vs "lapsed" for YOUR shops' visit rhythms).

## Phase 5 — Referrals
- [ ] Decide: referral reward as points or coupon (DEVSPEC §17 recommends points).

## Phase 6 — Platform
- [ ] BD conversations: StoreHub / Feedme / Square POS partnership or API access.
- [ ] Revisit: self-serve outlet addition pricing, Stripe/FPX for self-serve billing, reseller tier.

## Standing (every week)
- [ ] Review + push Claude Code's commits; keep GitHub the backup of record.
- [ ] Re-verify competitor pricing before touching the pricing page (PRICING §7).
- [ ] When a decision lands, make sure the session recorded it (Decision Log + DEVSPEC marker flipped).
