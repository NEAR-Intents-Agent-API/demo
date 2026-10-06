import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from "./schema";

/** Demo state lives in PostgreSQL so app deployments do not depend on attached volumes. */
export function createDemoDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required for demo persistence");

  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000 });
  const db = drizzle(pool, { schema });
  const checkConnection = async () => {
    await pool.query("select 1");
  };
  return { db, checkConnection, close: () => pool.end() };
}
export type DemoDatabase = ReturnType<typeof createDemoDatabase>;
