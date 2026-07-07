import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Only needed for `drizzle-kit migrate` — generate works offline.
    url: process.env["DATABASE_URL"] ?? "postgres://localhost:5432/kembali",
  },
  entities: {
    roles: true,
  },
});
