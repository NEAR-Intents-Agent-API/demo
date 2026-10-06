"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/lib/query/keys";
import { finishOnboarding } from "../../agent-list/hooks/finish-onboarding";
import { agentsApi } from "../../api/agents-api";

export function useOnboarding(agentId: string) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState("");
  const onboarding = useQuery({
    queryKey: queryKeys.onboarding(agentId),
    queryFn: ({ signal }) => agentsApi.onboarding(agentId, signal),
  });
  const finish = useMutation({
    mutationFn: async () => finishOnboarding(await agentsApi.onboarding(agentId), setStage),
    onSettled: async () => {
      setStage("");
      await Promise.all(
        [queryKeys.onboarding(agentId), queryKeys.agent(agentId), queryKeys.agents()].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });

  return { onboarding, finish, stage };
}
