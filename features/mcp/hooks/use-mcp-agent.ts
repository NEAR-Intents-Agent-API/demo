"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { type AgentMcpView, mcpApi } from "../api";

/** This account's endpoint, client grants and activity, one read shared by Connect and Activity. */
export function useMcpAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.mcp(agentId),
    queryFn: (): Promise<AgentMcpView> => mcpApi.agent(agentId),
  });
}
