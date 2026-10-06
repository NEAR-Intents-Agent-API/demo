import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

/** Refresh account facts, including cached tabs, without replaying quotes or signing drafts. */
export async function refreshAgentQueries(cache: QueryClient, agentId: string) {
  const keys = [
    queryKeys.agent(agentId),
    queryKeys.balances(agentId, "public"),
    queryKeys.balances(agentId, "confidential"),
    queryKeys.access(agentId),
    queryKeys.grants(agentId),
    queryKeys.policy(agentId),
    queryKeys.controls(agentId),
    queryKeys.scheduled(agentId),
    queryKeys.operations(agentId),
    queryKeys.approvals(agentId),
    queryKeys.mcp(agentId),
    queryKeys.catalog(),
  ];
  await Promise.all(
    keys.map((queryKey) => cache.invalidateQueries({ queryKey, refetchType: "all" })),
  );
}
