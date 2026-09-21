/* Plan-gating domain rules. No in-product billing (manual invoicing per
 * PRICING.md); a tenant's `plan` string drives feature availability. */

/** Plans whose merchants may download ANALYTICS reports (CSV). This gates
 * analytics exports ONLY - the PDPA customer-data export stays free on
 * every plan (PRICING.md hard rule #1). */
export const REPORT_DOWNLOAD_PLANS = ["founding", "growth"] as const;

export function planAllowsReportDownload(plan: string): boolean {
  return (REPORT_DOWNLOAD_PLANS as readonly string[]).includes(plan);
}

/** Plans that include the referral program (PRICING.md: Growth feature;
 * Founding merchants get everything as it ships). Starter and trial see the
 * settings locked with an upgrade hint; nothing is granted. */
export const REFERRAL_PLANS = ["founding", "growth"] as const;

export function planAllowsReferrals(plan: string): boolean {
  return (REFERRAL_PLANS as readonly string[]).includes(plan);
}

/** Monthly price per outlet (MYR) for the invoice note when a merchant
 * adds an outlet themselves. Mirrors PRICING.md §2; null = not priced
 * (trial). Keep in sync when pricing changes. */
export function planOutletPriceRm(plan: string): number | null {
  switch (plan) {
    case "founding":
      return 99;
    case "starter":
      return 149;
    case "growth":
      return 279;
    default:
      return null;
  }
}
