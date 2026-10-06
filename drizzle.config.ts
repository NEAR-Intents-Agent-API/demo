import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
});
