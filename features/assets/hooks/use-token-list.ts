"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { compareChains } from "../chains";
import type { BalanceLookup } from "../components/picker-types";
import type { TokenOption } from "../types";

export function useTokenList(tokens: readonly TokenOption[], balances?: BalanceLookup) {
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const chains = useMemo(
    () => [...new Set(tokens.map((token) => token.chain))].sort(compareChains),
    [tokens],
  );
  const filtered = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    return tokens
      .filter((token) => (chain ? token.chains.includes(chain) : true))
      .filter(
        (token) =>
          !needle ||
          token.symbol.toLowerCase().includes(needle) ||
          token.assetId.toLowerCase().includes(needle),
      )
      .sort((a, b) => {
        const held =
          Number((balances?.get(b.assetId)?.raw ?? 0n) > 0n) -
          Number((balances?.get(a.assetId)?.raw ?? 0n) > 0n);
        return held || a.symbol.localeCompare(b.symbol);
      });
  }, [tokens, deferred, chain, balances]);
  return { query, setQuery, chain, setChain, chains, filtered };
}
