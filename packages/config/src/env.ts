import { z } from "zod";

/**
 * Validate environment variables against a zod shape (CLAUDE.md: zod at
 * every boundary). Throws at boot with a readable list of problems instead
 * of failing later with `undefined` somewhere deep in the app.
 */
export function createEnv<TShape extends z.ZodRawShape>(
  shape: TShape,
  runtimeEnv: Record<string, string | undefined> = process.env,
): z.infer<z.ZodObject<TShape>> {
  const result = z.object(shape).safeParse(runtimeEnv);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${details}`);
  }
  return result.data;
}
