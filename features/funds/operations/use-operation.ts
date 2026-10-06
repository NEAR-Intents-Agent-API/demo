"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { terminalStatuses } from "@/lib/agent-api/schemas";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";

/** Long-poll window per read; the provider caps here and the BFF clamps to the same bound. */
const waitMs = 25_000;

/**
 * One operation, observed by long-poll rather than a polling timer: each read waits on the
 * provider side for up to 25s, so a pending move costs a handful of requests instead of one
 * every 3 seconds. Each response updates the cache immediately, including deposit addresses
 * needed before settlement. `NEEDS_REVIEW` is a final answer — repeating the read cannot change it.
 *
 * The React Query `signal` is forwarded, so leaving the screen cancels the observation instead
 * of leaving a loop running against an unmounted component.
 */
export function useOperation(agentId: string, operationId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.operation(agentId, operationId);
  const operation = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      for (let firstRead = true; ; firstRead = false) {
        const status = await fundsApi.operation(
          agentId,
          operationId,
          true,
          firstRead ? 0 : waitMs,
          signal,
        );
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        queryClient.setQueryData(queryKey, status);
        if (terminalStatuses.includes(status.status)) return status;
      }
    },
  });
  const refresh = useMutation({
    mutationFn: () => fundsApi.operation(agentId, operationId, true),
    onSuccess: (status) => queryClient.setQueryData(queryKey, status),
  });
  return { operation, refresh };
}
