import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

/** Grant and destination signatures can change every account view of permission. */
export function refreshPermissions(cache: QueryClient, agentId: string) {
  return Promise.all(
    [
      queryKeys.access(agentId),
      queryKeys.destinations(agentId),
      queryKeys.grants(agentId),
      queryKeys.policy(agentId),
      queryKeys.agent(agentId),
      queryKeys.operations(agentId),
      queryKeys.controls(agentId),
      queryKeys.scheduled(agentId),
      queryKeys.workflow(agentId),
    ].map((queryKey) => cache.invalidateQueries({ queryKey })),
  );
}
