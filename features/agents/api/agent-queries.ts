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

export function useAgent(agentId: string, initialData?: AgentListItem) {
  return useQuery({
    queryKey: queryKeys.agent(agentId),
    initialData,
    queryFn: ({ signal }) => agentsApi.detail(agentId, signal),
  });
}
