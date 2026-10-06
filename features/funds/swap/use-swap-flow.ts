"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fractionOf } from "@/lib/format/amount";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";
import type { BalanceLane } from "../flows/flow-parts";
import { useFunds } from "../funds-context";
import { extractQuote, isAtomic, pick } from "../model/quote";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useDebouncedValue, useSourceAmount, useTracking } from "../model/use-move";
import { type TokenOption, useFundsAction } from "../use-funds";

/** Slippage the swap tolerates before the provider refuses to fill. */
export const SLIPPAGE_BP = 100;

export type SwapRequest = {
  token_in: string;
  token_out: string;
  amount_in: string;
  confidential: boolean;
};

/** Live quote for the current inputs; nothing is asked until the form is a valid swap. */
function useSwapQuote(agentId: string, request: SwapRequest | null, enabled: boolean) {
  const debounced = useDebouncedValue(request);
  return useQuery({
    queryKey: queryKeys.swapQuote(agentId, debounced),
    queryFn: async () =>
      extractQuote(
        (
          await fundsApi.funds(
            agentId,
            "swap_quote",
            debounced as unknown as Record<string, unknown>,
          )
        ).result,
      ),
    enabled: enabled && debounced !== null,
    retry: false,
    staleTime: 20_000,
  });
}

/** A swap is only quotable once both tokens differ and the amount is spendable. */
function buildSwapRequest(input: {
  token: TokenOption | null;
  to: TokenOption | null;
  atomic: bigint | null;
  over: boolean;
  confidential: boolean;
}): SwapRequest | null {
  const { token, to, atomic, over, confidential } = input;
  if (!token || !to || !atomic || atomic === 0n || over) return null;
  if (token.assetId === to.assetId) return null;
  return {
    token_in: token.assetId,
    token_out: to.assetId,
    amount_in: atomic.toString(),
    confidential,
  };
}

function swapReason(
  source: ReturnType<typeof useSourceAmount>,
  to: TokenOption | null,
): string | null {
  const amount = amountReason({ ...source, empty: "Add funds to swap" });
  if (amount) return amount;
  if (!to) return "Choose what to receive";
  return source.token?.assetId === to.assetId ? "Pick two different tokens" : null;
}

/**
 * The swap draft and its quote. The amount a swap would receive is derived here so the field and
 * the review card read the same number, and the minimum-received guard is computed with it.
 */
export function useSwapFlow(initialLane: BalanceLane = "public") {
  const funds = useFunds();
  const [lane, setLane] = useState<BalanceLane>(initialLane);
  const confidential = lane === "private";
  const source = useSourceAmount(confidential ? funds.privateHoldings : funds.holdings);
  const [to, setTo] = useState<TokenOption | null>(null);
  const { tracking, track, clear } = useTracking();

  const { token, atomic } = source;
  const request = buildSwapRequest({ token, to, atomic, over: source.over, confidential });
  const quote = useSwapQuote(funds.agent.id, request, Boolean(funds.access));
  const amountOut = pick(quote.data ?? null, ["amount_out", "amount_out_formatted"]);
  const key = useIdempotencyKey(JSON.stringify(request));
  const reason = swapReason(source, to);

  const action = useFundsAction(funds.agent.id);
  const title = `Swap ${token?.symbol ?? ""} → ${to?.symbol ?? ""}`;
  const outAtomic = isAtomic(amountOut) ? BigInt(amountOut) : null;
  const waitingOnQuote = request !== null && !outAtomic && !quote.error;

  const execute = () => {
    if (!request) return;
    const minOut = outAtomic ? fractionOf(outAtomic, 10_000 - SLIPPAGE_BP).toString() : undefined;
    action.mutate(
      { tool: "swap", args: { ...request, min_amount_out: minOut, idempotencyKey: key } },
      { onSuccess: (result) => track({ ...result, title }) },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");
    setTo(null);
    action.reset();
  };
  return {
    resetDraft,
    waitingOnQuote,
    action,
    execute,
    title,
    funds,
    source,
    lane,
    setLane,
    confidential,
    to,
    setTo,
    request,
    quote,
    amountOut,
    key,
    reason,
    tracking,
    track,
    clear,
  };
}
