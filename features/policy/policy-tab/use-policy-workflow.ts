"use client";
import type { Policy } from "@near-intents-agent-api/sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IntentStep } from "@/features/intents";
import { signIntent } from "@/features/wallet/index";
import { policySchema } from "@/lib/agent-api/schemas";
import { DemoApiError } from "@/lib/http/request";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";
import { pendingChange, samePolicy } from "./pending-change";

/** A rules revision on the revision the browser loaded: the API refuses it if the rules moved on. */
export type PolicySave = { policy: Policy; expectedRevision: number };

/**
 * One owner signature per rules change. `save` signs exactly the rules it is given: an earlier
 * prepared change is reused only when it carries those same rules, otherwise a fresh one is
 * prepared, and a change already past its signature is never signed again. `setFrozen` is its
 * own ceremony and never carries a rulebook.
 */
export function usePolicyWorkflow(agentId: string) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState("");
  const key = queryKeys.workflow(agentId);
  const saved = useQuery({ queryKey: key, queryFn: () => policyApi.workflow(agentId) });

  // `remember` keeps a rules change where the editor resumes it. A freeze is its own ceremony
  // and must never appear there as a rules change the owner started earlier.
  const signAndSubmit = async (prepared: IntentStep, remember: boolean) => {
    let step = prepared;
    if (remember) queryClient.setQueryData(key, step);
    if (step.operation.status === "PENDING_SIGNATURE") {
      setStage("Confirm in your wallet…");
      const signedData = await signIntent(step.generated);
      setStage("Applying policy…");
      step = await policyApi.resumeWorkflow(agentId, step.generated.correlation_id, {
        signedData,
      });
      if (remember) queryClient.setQueryData(key, step);
    }
    return step;
  };

  const settle = async () => {
    setStage("");
    await Promise.all(
      [
        key,
        queryKeys.policy(agentId),
        queryKeys.destinations(agentId),
        queryKeys.agent(agentId),
        // The accounts list shows the Frozen state.
        queryKeys.agents(),
        queryKeys.controls(agentId),
        queryKeys.scheduled(agentId),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  };

  const save = useMutation({
    mutationFn: async ({ policy, expectedRevision }: PolicySave) => {
      setStage("Preparing…");
      const change = pendingChange(saved.data, expectedRevision);
      if (change.kind === "in_flight") throw new DemoApiError("policy_change_in_flight", 409);
      const target = policySchema.parse(policy);
      const step =
        change.kind === "signable" && samePolicy(change.policy, target)
          ? await policyApi.resumeWorkflow(agentId, change.step.generated.correlation_id)
          : await policyApi.beginWorkflow(agentId, target, expectedRevision);
      return signAndSubmit(step, true);
    },
    onSettled: settle,
  });

  const setFrozen = useMutation({
    mutationFn: async (frozen: boolean) => {
      setStage("Preparing…");
      return signAndSubmit(await policyApi.freezeWorkflow(agentId, frozen), false);
    },
    onSettled: settle,
  });

  /** Observes an unfinished change without signing anything. */
  const check = useMutation({
    mutationFn: async (correlationId: string) =>
      queryClient.setQueryData(key, await policyApi.resumeWorkflow(agentId, correlationId)),
    onSettled: settle,
  });

  return { save, setFrozen, check, saved, stage };
}
