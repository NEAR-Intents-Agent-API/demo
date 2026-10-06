"use client";
import type { Policy } from "@near-intents-agent-api/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { signIntent } from "@/features/wallet/index";
import { policySchema, terminalStatuses } from "@/lib/agent-api/schemas";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";

/**
 * One owner signature per policy revision. `save(policy)` prepares the revision, asks the wallet
 * to sign it and submits it; a revision left half-way (a closed tab, a rejected prompt) resumes
 * instead of starting a second one.
 */
export function usePolicyWorkflow(agentId: string) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState("");
  const key = queryKeys.workflow(agentId);
  const saved = useQuery({ queryKey: key, queryFn: () => policyApi.workflow(agentId) });
  const pending = Boolean(saved.data && !terminalStatuses.includes(saved.data.operation.status));
  const save = useMutation({
    mutationFn: async (policy: Policy | null) => {
      setStage("Preparing…");
      let step =
        pending && saved.data
          ? await policyApi.resumeWorkflow(agentId, saved.data.generated.correlation_id)
          : await policyApi.beginWorkflow(agentId, policySchema.parse(policy));
      queryClient.setQueryData(key, step);
      if (step.operation.status === "PENDING_SIGNATURE") {
        setStage("Confirm in your wallet…");
        const signedData = await signIntent(step.generated);
        setStage("Applying policy…");
        step = await policyApi.resumeWorkflow(agentId, step.generated.correlation_id, {
          signedData,
        });
        queryClient.setQueryData(key, step);
      }
      return step;
    },
    onSettled: async () => {
      setStage("");
      await Promise.all(
        [
          key,
          queryKeys.policy(agentId),
          queryKeys.destinations(agentId),
          queryKeys.agent(agentId),
          queryKeys.controls(agentId),
          queryKeys.scheduled(agentId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
  return { save, saved, pending, stage };
}
