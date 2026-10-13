import type { AgentApi } from "@near-intents-agent-api/sdk";

const TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 30_000;
const TIMEOUT_MS = 4_000;

let cache: { at: number; chains: string[] } | undefined;
let failedAt: number | undefined;
let inflight: Promise<void> | undefined;

/**
 * The networks the public token list names, for pages with no session (the sign-in screen).
 *
 * The list needs no API key and changes slowly, so one read serves every visitor for a few
 * minutes. Concurrent renders share one read, and a failed read is not retried for 30 seconds, so
 * an API outage costs one request per window rather than one per page view. A slow or failed read
 * never blocks the page: it returns the last answer, or `null` when there has never been one.
 */
export async function catalogChains(
  api: Pick<AgentApi, "getTokens">,
  now = Date.now(),
): Promise<string[] | null> {
  if (cache && now - cache.at < TTL_MS) return cache.chains;
  if (failedAt !== undefined && now - failedAt < FAILURE_TTL_MS) return cache?.chains ?? null;
  inflight ??= readChains(api, now).finally(() => {
    inflight = undefined;
  });
  await inflight;
  return cache?.chains ?? null;
}

async function readChains(api: Pick<AgentApi, "getTokens">, now: number): Promise<void> {
  try {
    const tokens = await api.getTokens({ signal: AbortSignal.timeout(TIMEOUT_MS) });
    cache = { at: now, chains: [...new Set(tokens.map((token) => token.blockchain))] };
    failedAt = undefined;
  } catch {
    // Keep serving the last answer; the page falls back to its static list without one.
    failedAt = now;
  }
}

/** Test seam: forget the cached answer, the failure and any read in flight. */
export function resetCatalogChains(): void {
  cache = undefined;
  failedAt = undefined;
  inflight = undefined;
}
