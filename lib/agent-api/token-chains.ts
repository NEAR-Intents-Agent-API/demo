import type { AgentApi } from "@near-intents-agent-api/sdk";

const TTL_MS = 5 * 60_000;
const TIMEOUT_MS = 4_000;

let cache: { at: number; chains: string[] } | undefined;

/**
 * The networks the public token list names, for pages with no session (the sign-in screen).
 *
 * The list needs no API key and changes slowly, so one read serves every visitor for a few
 * minutes. A slow or failed read never blocks the page: it returns the last answer, or `null`
 * when there has never been one.
 */
export async function catalogChains(
  api: Pick<AgentApi, "getTokens">,
  now = Date.now(),
): Promise<string[] | null> {
  if (cache && now - cache.at < TTL_MS) return cache.chains;
  try {
    const tokens = await api.getTokens({ signal: AbortSignal.timeout(TIMEOUT_MS) });
    cache = { at: now, chains: [...new Set(tokens.map((token) => token.blockchain))] };
  } catch {
    // Keep serving the last answer; the page falls back to its static list without one.
  }
  return cache?.chains ?? null;
}

/** Test seam: forget the cached answer. */
export function resetCatalogChains(): void {
  cache = undefined;
}
