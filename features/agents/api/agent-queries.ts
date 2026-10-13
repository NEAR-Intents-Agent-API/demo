"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgentListItem } from "@/lib/agent-api/agent-list";
import { queryKeys } from "@/lib/query/keys";
import { agentsApi } from "./agents-api";

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: ({ signal }) => agentsApi.list(signal),
  });
}

/** The accounts page: the list plus each account's frozen flag. */
export function useAgentsWithFrozen() {
  return useQuery({
    queryKey: queryKeys.agentsWithFrozen(),
    queryFn: ({ signal }) => agentsApi.listWithFrozen(signal),
  });
}

/** The server-rendered account has no frozen flag, so it counts as stale and loads one at once. */
export function useAgent(agentId: string, initialData?: AgentListItem) {
  return useQuery({
    queryKey: queryKeys.agent(agentId),
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
    queryFn: ({ signal }) => agentsApi.detail(agentId, signal),
  });
}
