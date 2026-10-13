"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";

/**
 * The account's rules as the provider reports them, one read shared by every panel. It refetches
 * when the tab regains focus, so a tab left open while another changed the rules catches up
 * before its owner edits on top of them.
 */
export function usePolicyView(agentId: string) {
  return useQuery({
    queryKey: queryKeys.policy(agentId),
    queryFn: () => policyApi.policy(agentId),
    refetchOnWindowFocus: true,
  });
}
