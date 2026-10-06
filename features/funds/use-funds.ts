"use client";

import type { BalanceEntry } from "@near-intents-agent-api/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { chainOfAsset, useCatalog } from "@/features/assets";
import { type FundsTool, fundsApi } from "./api";

export type BalanceSource = "public" | "confidential";

export type { TokenOption } from "@/features/assets";

import type { TokenOption } from "@/features/assets";
import { queryKeys } from "@/lib/query/keys";

/** One balance row joined to what the token list knows about it. */
export type Holding = {
  assetId: string;
  symbol: string;
  decimals: number | null;
  chain: string;
  raw: bigint;
  token: TokenOption | null;
};

export function useHoldings(agentId: string, source: BalanceSource) {
  const { find, query: tokenQuery } = useCatalog();
  const query = useQuery({
    queryKey: queryKeys.balances(agentId, source),
    queryFn: () => fundsApi.balances(agentId, source),
    refetchInterval: 30_000,
  });
  const holdings = useMemo(
    () => (query.data?.balances ?? []).map((entry) => toHolding(entry, find)),
    [query.data, find],
  );
  return {
    query,
    holdings,
    tokensReady: !tokenQuery.isPending,
    nearAccountId: query.data?.near_account_id,
  };
}

function toHolding(entry: BalanceEntry, find: (asset: string) => TokenOption | undefined): Holding {
  const token = find(entry.asset_id) ?? null;
  return {
    assetId: token?.assetId ?? entry.asset_id,
    symbol: entry.symbol ?? token?.symbol ?? "Unknown",
    decimals: entry.decimals,
    chain: entry.blockchain ?? token?.chain ?? chainOfAsset(entry.asset_id),
    raw: BigInt(entry.balance_raw),
    token,
  };
}

/** Owner-signed grant to move funds from the dashboard: null when none is live. */
export function useAccess(agentId: string) {
  return useQuery({
    queryKey: queryKeys.access(agentId),
    queryFn: async () => (await fundsApi.access(agentId)).access,
    refetchInterval: 60_000,
  });
}

export function useDestinations(agentId: string) {
  return useQuery({
    queryKey: queryKeys.destinations(agentId),
    queryFn: () => fundsApi.destinations(agentId),
    refetchInterval: (query) => {
      const deadline = query.state.data?.availableAt;
      const remaining = deadline ? Date.parse(deadline) - Date.now() : 0;
      return remaining > 0 ? remaining + 500 : false;
    },
  });
}

/** Quotes and executions share one door; `idempotencyKey` is only meaningful for writes. */
export function useFundsAction(agentId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: { tool: FundsTool; args: Record<string, unknown> }) =>
      fundsApi.funds(agentId, input.tool, input.args),
    onSuccess: async (_result, input) => {
      if (input.tool.endsWith("_quote") || input.tool.endsWith("_preview")) return;
      await Promise.all(
        ["balances", "operations", "policy", "controls", "scheduled-executions"].map((key) =>
          cache.invalidateQueries({ queryKey: [key, agentId] }),
        ),
      );
    },
  });
}
