import { createDemoAuth, type DemoAuth } from "@/lib/auth/server";
import { demoEnv } from "@/lib/config/runtime";
import { createDemoDatabase, type DemoDatabase } from "@/lib/db/client";

const state = globalThis as unknown as {
  demoDatabase?: DemoDatabase;
  demoAuth?: { origin: string; auth: DemoAuth };
};

export function getDemoDatabase(): DemoDatabase {
  state.demoDatabase ??= createDemoDatabase();
  return state.demoDatabase;
}

export async function getDemoAuth(): Promise<DemoAuth> {
  const database = getDemoDatabase();
  const config = await demoEnv();
  if (state.demoAuth?.origin === config.BETTER_AUTH_URL) return state.demoAuth.auth;
  const auth = createDemoAuth(database, config);
  state.demoAuth = { origin: config.BETTER_AUTH_URL, auth };
  return auth;
}
