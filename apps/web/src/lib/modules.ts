import { z } from "zod";

/** Per-tenant feature modules, managed by the platform admin. */
export const modulesSchema = z
  .object({
    stamps: z.boolean().default(true),
    scan: z.boolean().default(true),
    reports: z.boolean().default(true),
    points: z.boolean().default(true),
    rewards: z.boolean().default(true),
  })
  .catch({ stamps: true, scan: true, reports: true, points: true, rewards: true });

export type TenantModules = z.infer<typeof modulesSchema>;

export function parseModules(raw: unknown): TenantModules {
  return modulesSchema.parse(raw ?? {});
}

/** The module set a plan starts with (PRICING.md). Every current plan
 * includes all shipped modules — wallet/tags/WhatsApp aren't toggles yet —
 * so this is all-on today; it's the hook that differentiates plans as those
 * features arrive. The platform admin can still adjust each box afterwards. */
export function modulesForPlan(_plan: string): TenantModules {
  return { stamps: true, scan: true, reports: true, points: true, rewards: true };
}
