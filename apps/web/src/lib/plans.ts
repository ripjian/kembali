/** Plan types v1 — billing enforcement arrives with Stripe (Phase 1). */
export const PLAN_TYPES = ["trial", "starter", "growth"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const PLAN_LABELS: Record<PlanType, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
};
