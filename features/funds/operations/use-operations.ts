"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";

export function useOperations(agentId: string) {
  return useQuery({
    queryKey: queryKeys.operations(agentId),
    queryFn: () => fundsApi.operations(agentId),
  });
}
