/* When a verified phone reaches the app, decide whether it still needs the
 * one-screen registration. A brand-new customer (or an existing phone-only
 * record with no name) does; a returning customer who already gave a name
 * goes straight to their card. Pure so the verify route and the tests agree. */

export function needsRegistration(
  customer: { name?: string | null } | null | undefined,
): boolean {
  return !customer?.name || customer.name.trim() === "";
}
