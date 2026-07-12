# Kembali — OTP Delivery Plan (2026-07-11)

> Companion to ROADMAP §5 and the `OtpSender` interface (`OTP_PROVIDER` env). Status: **approved direction, founder actions pending.** Prices checked 2026-07-11; re-verify at build time.

## 1. Decision

**WhatsApp-first, SMS fallback, email last.** Sender chain through the existing `OtpSender` interface:

1. **WhatsAppSender** — Meta WhatsApp Cloud API, **direct** (no BSP): authentication template, ≈ RM0.056/message in MY. No platform fee; BSPs (Twilio +$0.005/msg, Wati +20%, 360dialog €49/mo) add nothing we need.
2. **SmsSender** — local MCMC-licensed gateway (iSMS / Mocean class), RM0.10–0.13/message. Triggered by WA delivery-failure webhook or numbers without WhatsApp. Note MCMC rules: no URLs in any A2P SMS (fine for a bare code), sender ID/shortcode registration required through the provider (days to ~2 weeks).
3. Email OTP — existing fallback idea for tourists; lowest priority.

`OTP_PROVIDER=whatsapp|sms|none`; production boot still fails on `none` (assertOtpDeliverable).

## 2. Cost model (pilot scale)

- Assumption: ~3,000 auth sends/month at 20 shops (joins + new devices + expired sessions; 90-day sessions keep this low).
- WhatsApp primary ≈ RM170/mo; ~10% SMS fallback adds ~RM40. Within the PRICING.md COGS line (was budgeted RM18/outlet; actual lands ≈ RM10/outlet).
- Same WABA + verified business later powers Phase 4 WhatsApp retention (marketing templates ≈ RM0.35/msg, credit-metered per PRICING §3).

## 3. Founder actions (start now — verification is the long pole)

- [ ] Meta Business Manager → business verification with SSM docs (2 hours–2 weeks; rejections restart the clock)
- [ ] Dedicated phone number for the WhatsApp Business account (must NOT be on personal WhatsApp; prepaid SIM is fine)
- [ ] Display name request: "Kembali"
- [ ] Later, with fallback batch: pick MCMC-licensed SMS gateway + register sender ID

## 4. Build plan (Claude Code, does not wait on verification)

Meta issues a **free test number** immediately; production sending is what verification gates.

Batch A (half day): WhatsAppSender against the Cloud API test number — auth template send, webhook for delivery status, env config (`WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, template name), retries, unit tests with mocked API, OTP screen drops the dev notice when a real provider is active. Non-prod keeps NullSender + 888888.
Batch B: SmsSender + fallback chain (WA failure webhook → SMS), provider TBD by founder.
Swap to production: env change only.

## 5. Architecture (decided 2026-07-11, founder)

- **Platform-level, single Kembali WABA** sends all OTPs for all merchants (Model B). No per-merchant WhatsApp settings anywhere; credentials are platform env secrets, same treatment as future Apple certs. Bring-your-own-number for chains = Phase 6 enterprise feature.
- **Attribution at request time, not after:** every OTP request originates from a tenant-scoped page, so sends are written to the `messages` table with `tenant_id` as a proper FK. No string identifiers needed.
- **`messages` ledger columns:** tenant_id, customer_id, channel (whatsapp|sms), type (otp; marketing joins in Phase 4), delivery status (sent → delivered | failed → fallback_sms), provider_message_id, cost, created_at. **Never log the OTP code itself.**
- **Platform-admin Messages report:** merchant filter (shop-name dropdown via tenant_id), recipient (masked), type, status, time, cost; per-merchant monthly totals for COGS; per-tenant volume-spike alert (abuse signal).
- **Merchants see no OTP log** — auth plumbing is platform infrastructure, not loyalty data.
- **Billing:** OTP cost absorbed into subscriptions (≈ RM6–10/outlet/mo COGS; PRICING hard rule #2 "no hidden fees" holds — say "logins included" on the pricing page). Usage-based credits remain reserved for Phase 4 marketing messages only.

## 6. Risks

- Verification rejection → resubmit with exact SSM name match; start early.
- Template rejection → keep the auth template to Meta's standard OTP format (code + expiry line, no marketing).
- WA outage → SMS fallback covers; both down → login fails gracefully with "try again shortly" (SOP 3 error pattern).
