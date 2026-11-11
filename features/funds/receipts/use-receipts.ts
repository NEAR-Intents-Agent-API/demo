"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";

/** Newest first, one page at a time; the list is complete only without a next page. */
export function useReceipts(agentId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.receipts(agentId),
    queryFn: ({ pageParam }) => fundsApi.receipts(agentId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
}

/** Runs only when asked: a check reads the transparency log, so it is never done on render. */
export function useReceiptVerification(agentId: string, correlationId: string) {
  return useQuery({
    queryKey: queryKeys.receiptVerification(agentId, correlationId),
    queryFn: () => fundsApi.receiptVerification(agentId, correlationId),
    enabled: false,
    // A verdict is a fact about the log; a `retry` is only worth repeating by hand.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
  });
}
