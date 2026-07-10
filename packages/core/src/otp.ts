/* OTP delivery-provider rules. There is no real provider yet (founder
 * decision): codes are not sent anywhere, and non-production builds fall back
 * to the printed code + the 888888 dev bypass. These pure predicates let the
 * app, the env validation and the UI agree on one source of truth; wiring a
 * real WhatsApp/SMS sender later only adds an implementation. */

/** Providers we know how to select. "none" delivers nothing. Extend this as
 * real senders are added (e.g. "whatsapp", "sms"). */
export const OTP_PROVIDERS = ["none"] as const;

/** Does this provider actually deliver a code to the customer's phone? */
export function isDeliverableOtpProvider(provider: string): boolean {
  return provider !== "none" && provider.trim() !== "";
}

/** Guard for boot: production must have a real delivery provider, so we can
 * never ship silent no-delivery auth. Throws with a clear message otherwise. */
export function assertOtpDeliverable(provider: string, isProduction: boolean): void {
  if (isProduction && !isDeliverableOtpProvider(provider)) {
    throw new Error(
      `OTP_PROVIDER=${provider || "(unset)"} delivers no codes. ` +
        "A real SMS/WhatsApp provider is required in production.",
    );
  }
}

/** Show the on-screen dev notice ("no provider, use 888888") ONLY when there
 * is no real provider AND the build is non-production. In production this is
 * always false, so neither the notice nor the bypass can appear. */
export function showsDevOtpNotice(provider: string, isProduction: boolean): boolean {
  return !isProduction && !isDeliverableOtpProvider(provider);
}
