"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";

/** The account's rules as the provider reports them, one read shared by every panel. */
export function usePolicyView(agentId: string) {
  return useQuery({
    queryKey: queryKeys.policy(agentId),
    queryFn: () => policyApi.policy(agentId),
  });
}
