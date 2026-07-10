/** Plan types v1 — no in-product billing (manual invoicing, PRICING.md).
 * `founding` is the RM99 founding-merchant program; `trial` is the default
 * for a freshly created store before a plan is chosen. */
export const PLAN_TYPES = ["founding", "trial", "starter", "growth"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const PLAN_LABELS: Record<PlanType, string> = {
  founding: "Founding",
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
};

/** Downloadable ANALYTICS reports (CSV) are a Founding + Growth perk;
 * Starter/Trial see a locked upgrade hint. Domain rule lives in
 * @kembali/core (tested there); re-exported for the admin surface. */
export { planAllowsReportDownload } from "@kembali/core";
