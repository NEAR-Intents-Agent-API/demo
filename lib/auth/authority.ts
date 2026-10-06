import type { DemoEnv } from "@/lib/config/env";

/**
 * The auth authority every plugin must agree on: `host[:port]` for SIWE domain comparison,
 * SIWN NEP-413 recipient. Using the bare hostname here would
 * reject every message issued on a non-default port.
 */
export function authAuthority(config: DemoEnv): string {
  const url = new URL(config.BETTER_AUTH_URL);
  return url.host;
}

/** Exact browser origin used for WebAuthn verification and CORS trusted origins. */
export function authOrigin(config: DemoEnv): string {
  return config.PASSKEY_ORIGIN ?? config.BETTER_AUTH_URL.replace(/\/$/, "");
}

export function passkeyRpId(config: DemoEnv): string {
  return config.PASSKEY_RP_ID ?? new URL(config.BETTER_AUTH_URL).hostname;
}
