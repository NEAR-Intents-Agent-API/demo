"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { queryKeys } from "@/lib/query/keys";
import { finishOnboarding } from "../../agent-list/hooks/finish-onboarding";
import { agentsApi } from "../../api/agents-api";

export function useOnboarding(agentId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [stage, setStage] = useState("");
  const onboarding = useQuery({
    queryKey: queryKeys.onboarding(agentId),
    queryFn: ({ signal }) => agentsApi.onboarding(agentId, signal),
  });
  const agent = useQuery({
    queryKey: queryKeys.agent(agentId),
    queryFn: ({ signal }) => agentsApi.detail(agentId, signal),
  });
  const refresh = async () => {
    setStage("");
    await Promise.all(
      [queryKeys.onboarding(agentId), queryKeys.agent(agentId), queryKeys.agents()].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };
  const finish = useMutation({
    mutationFn: async () => finishOnboarding(await agentsApi.onboarding(agentId), setStage),
    onSettled: refresh,
  });
  // An expired or failed request can never go live. The owner asks for a fresh one, which is a
  // new account with the same name and the rules they were shown; the old request stays unsigned.
  const restart = useMutation({
    mutationFn: async () => {
      const { name } = agent.data ?? (await agentsApi.detail(agentId));
      const { generated } = await agentsApi.onboarding(agentId);
      if (!generated.preview.policy) throw new Error("onboarding_unavailable");
      setStage("Creating a fresh request…");
      return finishOnboarding(await agentsApi.create(name, generated.preview.policy), setStage);
    },
    onSuccess: (state) =>
      router.replace(
        `/agents/${encodeURIComponent(state.generated.agent_id)}?tab=activity&setup=fund`,
      ),
    onSettled: refresh,
  });

  return { onboarding, finish, restart, stage };
}
