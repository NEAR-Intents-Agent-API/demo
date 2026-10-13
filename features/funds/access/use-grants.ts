"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";

/** Every owner grant on this account, active first and then ended, read-only. Each surface revokes where it connected. */
export function useGrants(agentId: string) {
  const view = useQuery({
    queryKey: queryKeys.grants(agentId),
    queryFn: () => fundsApi.grants(agentId),
  });
  return { view };
}
