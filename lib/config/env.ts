import { z } from "zod";

export const demoEnvSchema = z.object({
  NEAR_INTENTS_AGENT_API_URL: z.url(),
  NEAR_INTENTS_AGENT_API_KEY: z.string().min(8),
  BETTER_AUTH_SECRET: z.string().min(32).max(64),
  SECRET_ENCRYPTION_KEY: z.string().min(32).max(64),
});

export function parseDemoEnv(environment: Record<string, string | undefined> = process.env) {
  const result = demoEnvSchema.safeParse(environment);
  if (!result.success)
    throw new Error(
      `Invalid demo configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  const url = new URL(result.data.NEAR_INTENTS_AGENT_API_URL);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
  )
    throw new Error("HTTPS API URL required");
  return result.data;
}

/** Application origin is request-derived; owner credentials stay separate from API credentials. */
export function demoConfig(settings: ReturnType<typeof parseDemoEnv>, origin: string) {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  )
    throw new Error("HTTPS demo origin required");
  return {
    ...settings,
    AGENT_NETWORK: "mainnet" as const,
    BETTER_AUTH_URL: url.origin,
    BETTER_AUTH_SECRET: settings.BETTER_AUTH_SECRET,
    MCP_ORIGIN: url.origin,
    PASSKEY_RP_ID: url.hostname,
    PASSKEY_RP_NAME: "NEAR Agent Connect",
    PASSKEY_ORIGIN: url.origin,
    NEAR_RPC_URLS: ["https://near.drpc.org", "https://free.rpc.fastnear.com"],
  };
}
export type DemoEnv = ReturnType<typeof demoConfig>;
