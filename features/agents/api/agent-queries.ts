"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { agentsApi } from "./agents-api";

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: ({ signal }) => agentsApi.list(signal),
  });
}

export function useAgent(agentId: string, initialData?: AgentView) {
  return useQuery({
    queryKey: queryKeys.agent(agentId),
    initialData,
    queryFn: ({ signal }) => agentsApi.detail(agentId, signal),
  });
}
