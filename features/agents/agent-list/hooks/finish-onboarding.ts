"use client";

import type { IntentStep } from "@/features/intents";
import { observeIntent, operationFailure } from "@/features/intents";
import { signIntent } from "@/features/wallet/index";
import { agentsApi } from "../../api/agents-api";

/**
 * Takes a pending agent live: one owner signature over the prepared request, then observation
 * until the chain and provider confirm it. Safe to call again after an interruption; a request
 * that was already submitted is only observed, never signed twice.
 */
export async function finishOnboarding(
  state: IntentStep,
  onStage: (stage: string) => void,
): Promise<IntentStep> {
  const agentId = state.generated.agent_id;
  let current = state;
  if (current.operation.status === "PENDING_SIGNATURE") {
    onStage("Confirm in your wallet…");
    const signature = await signIntent(current.generated);
    onStage("Activating agent. Gas is sponsored…");
    current = await agentsApi.submitOnboarding(agentId, signature);
  }
  onStage("Waiting for confirmation…");
  return observeIntent<IntentStep>({
    read: () => agentsApi.refreshOnboarding(agentId),
    done: (step) => step.operation.status === "SUCCESS",
    failure: (step) => operationFailure(step.operation.status, step.operation.failure_code),
    timeoutCode: "onboarding_confirmation_timeout",
    deadlineMs: 120_000,
    intervalMs: 1_000,
  });
}
