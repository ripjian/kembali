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
  /** Postgres. Optional in dev (embedded PGlite fallback), required in prod. */
  DATABASE_URL: z.union([z.url(), z.literal("")]).optional(),
  /** HMAC secret for customer QR tokens — required in prod (lib/config.ts). */
  QR_TOKEN_SECRET: z.string().min(16).optional(),
});

if (process.env.NODE_ENV === "production") {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required in production");
  if (!env.QR_TOKEN_SECRET) throw new Error("QR_TOKEN_SECRET is required in production");
}
