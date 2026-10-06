import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { DemoDatabase } from "./client";
import { schema } from "./schema";

/**
 * Deterministic demo auth database for tests. Runs the demo's own migration against an
 * in-process PGlite instance, so challenge and session behavior is exercised without
 * PostgreSQL or Docker.
 */
export async function createDemoTestDatabase(
  directory?: string,
  options: { migrationsFolder?: string } = {},
): Promise<DemoDatabase & { close: () => Promise<void>; migrateLatest: () => Promise<void> }> {
  const client = directory ? new PGlite(resolve(directory, "postgres")) : new PGlite();
  const db = drizzle(client, { schema });
  const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));
  await migrate(db, { migrationsFolder: options.migrationsFolder ?? migrationsFolder });
  return {
    checkConnection: async () => {},
    db: db as unknown as DemoDatabase["db"],
    close: () => client.close(),
    migrateLatest: () => migrate(db, { migrationsFolder }),
  };
}
