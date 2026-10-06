"use client";

import type { TokenView } from "@near-intents-agent-api/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "@/lib/query/keys";
import { catalogApi } from "./api";
import { canonicalChainId, chainOfAsset, compareChains } from "./chains";
import type { TokenOption } from "./types";

/** A catalogue entry as the pickers use it; each asset lives on exactly one chain. */
export type CatalogOption = TokenOption & { priceUsd: number | null };

/**
 * The Agent API decides whether a price is usable and says until when (`priceExpiresAt`). Past
 * that instant the price is dropped, not shown, even if a refetch failed and the list is old.
 */
function usablePrice(token: TokenView, now: number): number | null {
  if (token.price === null || token.price_expires_at === null) return null;
  return Date.parse(token.price_expires_at) > now ? token.price : null;
}

function toOption(token: TokenView, now: number): CatalogOption {
  const chain = canonicalChainId(token.blockchain);
  return {
    assetId: token.asset_id,
    defuseAssetId: token.asset_id,
    symbol: token.symbol,
    decimals: token.decimals,
    chain,
    chains: [chain],
    priceUsd: usablePrice(token, now),
  };
}

/** Best effort for an asset the catalogue does not list: its id, its chain, no decimals. */
export function unknownOption(assetId: string): CatalogOption {
  const chain = chainOfAsset(assetId);
  const tail = assetId.replace(/^nep\d+:/, "").split(/[.:-]/)[0] ?? assetId;
  return {
    assetId,
    defuseAssetId: assetId,
    symbol: tail.length > 10 ? `${tail.slice(0, 6)}…` : tail.toUpperCase(),
    decimals: 0,
    chain,
    chains: [chain],
    priceUsd: null,
  };
}

/** The Agent API refreshes 1Click prices every minute; the demo keeps no copy older than that. */
const priceRefreshMs = 60_000;

/** Wall-clock time, advanced every `intervalMs`, so expiring values re-render on time. */
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export type Catalog = {
  query: ReturnType<typeof useQuery<{ data: TokenView[] }>>;
  tokens: CatalogOption[];
  byAsset: ReadonlyMap<string, CatalogOption>;
  find: (asset: string) => CatalogOption | undefined;
  lookup: (assetId: string) => CatalogOption;
  chains: string[];
};

/**
 * Every asset the agent account can use (the Agent API's public token list: OutLayer's catalog
 * with 1Click chains and prices). The same list backs policy chips, spending limits, deposits,
 * swaps and dollar values, so a token looks the same everywhere.
 *
 * Mounted once in `CatalogProvider`: every consumer shares one query and one expiry clock, so
 * five screens no longer run five price timers over five copies of the list.
 */
export function useCatalogData(): Catalog {
  const query = useQuery({
    queryKey: queryKeys.catalog(),
    queryFn: catalogApi.catalog,
    staleTime: priceRefreshMs,
    refetchInterval: priceRefreshMs,
  });
  const now = useNow(15_000);
  const tokens = useMemo(
    () =>
      (query.data?.data ?? [])
        .map((token) => toOption(token, now))
        .sort((a, b) => compareChains(a.chain, b.chain) || a.symbol.localeCompare(b.symbol)),
    [query.data, now],
  );
  const byAsset = useMemo(() => new Map(tokens.map((token) => [token.assetId, token])), [tokens]);
  /** Balances and the token list name an asset by the same exact id. */
  const find = useMemo(() => (asset: string) => byAsset.get(asset), [byAsset]);
  const lookup = useMemo(
    () => (assetId: string) => find(assetId) ?? unknownOption(assetId),
    [find],
  );
  const chains = useMemo(
    () => [...new Set(tokens.map((token) => token.chain))].sort(compareChains),
    [tokens],
  );
  return { query, tokens, byAsset, find, lookup, chains };
}

/** `raw` of `token` in dollars, or null without a price or decimals. */
export function usdValue(raw: bigint, token: { decimals: number; priceUsd: number | null }) {
  if (token.priceUsd === null || raw === 0n) return null;
  const scale = 10n ** BigInt(Math.max(0, token.decimals - 6));
  const micros = Number(raw / scale) / 10 ** Math.min(6, token.decimals);
  return micros * token.priceUsd;
}

export function formatUsd(value: number | null): string | null {
  if (value === null) return null;
  if (value > 0 && value < 0.01) return "<$0.01";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
}
