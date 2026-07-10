import "server-only";

import { showsDevOtpNotice } from "@kembali/core";

import { IS_PRODUCTION, OTP_PROVIDER } from "./config";

/* OTP delivery abstraction. No real provider is connected yet (founder
 * decision): NullSender sends nothing, and non-production builds rely on the
 * printed code + the 888888 bypass. Adding a real WhatsApp/SMS sender later
 * means writing one class and adding a case to getOtpSender - nothing else in
 * the OTP flow changes. */

export interface OtpSender {
  readonly provider: string;
  /** Deliver `code` to `phone`. Implementations must not throw for expected
   * delivery failures; log and swallow so the request still rate-limits. */
  send(phone: string, code: string): Promise<void>;
}

class NullSender implements OtpSender {
  readonly provider = "none";
  async send(): Promise<void> {
    // Intentionally sends nothing. A real provider replaces this class.
  }
}

export function getOtpSender(): OtpSender {
  switch (OTP_PROVIDER) {
    // case "whatsapp": return new WhatsAppSender();
    // case "sms": return new SmsSender();
    case "none":
    default:
      return new NullSender();
  }
}

/** True only when there is no real provider AND the build is non-production:
 * the moment the on-screen "use 888888" notice and the bypass are allowed. */
export const OTP_DEV_NOTICE = showsDevOtpNotice(OTP_PROVIDER, IS_PRODUCTION);
