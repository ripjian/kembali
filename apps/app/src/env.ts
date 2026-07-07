import { createEnv } from "@kembali/config/env";
import { z } from "zod";

/** Server-side env, validated at boot (zod at every boundary — CLAUDE.md).
 * Import only from server code; client code sees NEXT_PUBLIC_* inlined. */
export const env = createEnv({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SENTRY_DSN: z.union([z.url(), z.literal("")]).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.union([z.url(), z.literal("")]).optional(),
});
