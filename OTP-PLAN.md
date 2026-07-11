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

## 5. Risks

- Verification rejection → resubmit with exact SSM name match; start early.
- Template rejection → keep the auth template to Meta's standard OTP format (code + expiry line, no marketing).
- WA outage → SMS fallback covers; both down → login fails gracefully with "try again shortly" (SOP 3 error pattern).
