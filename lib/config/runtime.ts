import { headers } from "next/headers";
import { cache } from "react";
import { type DemoEnv, demoConfig, parseDemoEnv } from "@/lib/config/env";

let configured: DemoEnv | undefined;
/** Dependency injection for isolated integration tests. */
export function configureDemoRuntime(value?: DemoEnv) {
  configured = value;
}

export const demoEnv = cache(async () => {
  if (configured) return configured;
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  if (!host || /[,\s/\\]/.test(host)) throw new Error("demo_host_invalid");
  const hostname = new URL(`http://${host}`).hostname;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  // TLS terminates at the deployment proxy. Never trust a caller's Origin as our identity.
  return demoConfig(parseDemoEnv(), `${local ? "http" : "https"}://${host}`);
});
