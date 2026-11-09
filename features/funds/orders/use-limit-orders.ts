"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";
import { type CancelRound, readCancelRound } from "./order-display";

/** Rounds of 50 a cancel-all may take before it stops asking; a wallet is never near this. */
const MAX_CANCEL_ROUNDS = 20;

/** Open orders refresh while the tab is open: fills and cancels happen at the provider. */
export function useLimitOrders(agentId: string, open: boolean) {
  return useQuery({
    queryKey: queryKeys.limitOrders(agentId, open),
    queryFn: () => fundsApi.limitOrders(agentId, open),
    refetchInterval: 20_000,
  });
}

/** One order read live: the list does not refresh an order's status, the single read does. */
export function useLimitOrder(agentId: string, orderId: string) {
  return useQuery({
    queryKey: queryKeys.limitOrder(agentId, orderId),
    queryFn: () => fundsApi.limitOrder(agentId, orderId),
  });
}

/** Repeats cancel-all until the API says it is complete: one call cancels at most 50 orders. */
export function useCancelAllOrders(agentId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CancelRound> => {
      let total: CancelRound = { known: 0, cancelled: 0, failed: 0, remaining: 0, complete: false };
      for (let round = 0; round < MAX_CANCEL_ROUNDS; round += 1) {
        const { result } = await fundsApi.funds(agentId, "cancel_all_limit_orders", {});
        const next = readCancelRound(result);
        if (!next) throw new Error("invalid_response");
        total = {
          known: total.known + next.known,
          cancelled: total.cancelled + next.cancelled,
          failed: total.failed + next.failed,
          remaining: next.remaining,
          complete: next.complete,
        };
        // A round that cancelled nothing will not do better when repeated.
        if (next.complete || next.cancelled === 0) return total;
      }
      return total;
    },
    onSettled: () =>
      Promise.all(
        ["limit-orders", "limit-order", "balances", "operations"].map((key) =>
          cache.invalidateQueries({ queryKey: [key, agentId] }),
        ),
      ),
  });
}
