import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for demo migrations");

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });
try {
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)),
  });
} finally {
  await pool.end();
}
