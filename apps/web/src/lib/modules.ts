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
