/* CLI entry: pnpm db:seed — requires DATABASE_URL (see .env.example). */
import { createEnv } from "@kembali/config/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import * as schema from "../src/schema";
import { seed } from "../src/seed-data";

const env = createEnv({
  DATABASE_URL: z.url({ message: "DATABASE_URL must be a valid Postgres URL" }),
});

const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client, { schema });

try {
  const summary = await seed(db);
  console.log("✅ Seed complete:", summary);
} finally {
  await client.end();
}
