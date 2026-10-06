"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDisplay, parseUnits } from "@/lib/format/amount";
import { balanceLookup, heldTokens } from "../funds-context";
import type { Holding, TokenOption } from "../use-funds";

/**
 * State every "spend from a balance" flow shares: which token, how much, and whether the wallet
 * holds it. The token defaults to the first one the wallet actually has, so the form never opens
 * on something the agent cannot spend.
 */
export function useSourceAmount(holdings: readonly Holding[]) {
  const balances = useMemo(() => balanceLookup(holdings), [holdings]);
  const sources = useMemo(() => heldTokens(holdings), [holdings]);
  const [picked, setPicked] = useState<TokenOption | null>(null);
  const [amount, setAmount] = useState("");

  const token =
    picked && sources.some((source) => source.assetId === picked.assetId)
      ? picked
      : (sources[0] ?? null);
  const atomic = token ? parseUnits(amount, token.decimals) : null;
  const held = token ? (balances.get(token.assetId)?.raw ?? 0n) : 0n;
  const over = atomic !== null && atomic > held;

  return {
    hasDraft: picked !== null || amount !== "",
    balances,
    sources,
    token,
    setPicked,
    amount,
    setAmount,
    atomic,
    held,
    over,
    overMessage: over && token ? overMessage(token, held) : null,
  };
}

export function overMessage(token: TokenOption, held: bigint): string {
  return `You only hold ${formatDisplay(held.toString(), token.decimals)} ${token.symbol}.`;
}

/** Why the primary button is disabled, in the words it should show; null means go. */
export function amountReason(input: {
  token: TokenOption | null;
  atomic: bigint | null;
  over: boolean;
  empty: string;
}): string | null {
  if (!input.token) return input.empty;
  if (!input.atomic || input.atomic === 0n) return "Enter an amount";
  if (input.over) return `Not enough ${input.token.symbol}`;
  return null;
}

/** Track an operation with its submitted title, independent of later balance refreshes. */
export function useTracking() {
  const [tracking, setTracking] = useState<{ id: string; status: string; title?: string } | null>(
    null,
  );
  const track = useCallback(
    (result: { operationId: string | null; status: string; title?: string }) => {
      if (result.operationId)
        setTracking({ id: result.operationId, status: result.status, title: result.title });
    },
    [],
  );
  const clear = useCallback(() => setTracking(null), []);
  return { tracking, track, clear };
}

/** Wall-clock debounce for values that drive network quotes. */
export function useDebouncedValue<T>(value: T, ms = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}
