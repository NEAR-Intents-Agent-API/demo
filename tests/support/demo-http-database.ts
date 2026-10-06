import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase } from "../../../../packages/database/src/client.js";
import { requireTestEnv } from "./env.js";

/** Creates and drops only this run's database; never migrates the configured source database. */
export async function createDemoHttpDatabase() {
  const source = requireTestEnv("TEST_DATABASE_URL");
  const admin = createDatabase(source);
  const name = `demo_http_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(source);
  url.pathname = `/${name}`;
  let created = false;
  const close = async () => {
    try {
      if (created) await admin.db.execute(sql.raw(`DROP DATABASE "${name}"`));
    } finally {
      await admin.close();
    }
  };
  try {
    await admin.db.execute(sql.raw(`CREATE DATABASE "${name}"`));
    created = true;
    const database = createDatabase(url.toString());
    try {
      await migrate(database.db, {
        migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)),
      });
    } finally {
      await database.close();
    }
    return { url: url.toString(), close };
  } catch (error) {
    await close();
    throw error;
  }
}
