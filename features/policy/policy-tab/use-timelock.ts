"use client";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { intentsApi, signAndSubmitIntent } from "@/features/intents";
import { signIntent } from "@/features/wallet/index";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";

export function useTimelock(agentId: string) {
  const cache = useQueryClient();
  /** Earliest release first, one page at a time; the list is complete only without a next page. */
  const scheduled = useInfiniteQuery({
    queryKey: queryKeys.scheduled(agentId),
    queryFn: ({ pageParam }) => policyApi.scheduled(agentId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: queryKeys.policy(agentId) }),
      cache.invalidateQueries({ queryKey: queryKeys.scheduled(agentId) }),
      cache.invalidateQueries({ queryKey: queryKeys.controls(agentId) }),
      cache.invalidateQueries({ queryKey: queryKeys.operations(agentId) }),
    ]);
  };
  const cancel = useMutation({
    mutationFn: async (operationId: string) => {
      const prepared = await intentsApi.generate(agentId, {
        type: "execution_cancel",
        agent_id: agentId,
        correlation_id: operationId,
      });
      return signAndSubmitIntent(agentId, prepared, signIntent);
    },
    onSettled: refresh,
  });
  return { scheduled, cancel, refresh };
}
