"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { type IntentStep, intentsApi, operationFailure } from "@/features/intents";
import {
  type ConsentChallenge,
  ConsentDialog,
  type ConsentStage,
  signIntent,
} from "@/features/wallet/index";
import { errorMessage } from "@/lib/http/messages";
import { fundsApi } from "../api";
import type { AccessDuration } from "./access-form-utils";
import { refreshPermissions } from "./refresh-permission-utils";
import { useDestinationsFlow } from "./use-destinations-flow";

const enableDialog = "Authorize dashboard";
const revokeDialog = "Revoke dashboard access";

/** Dashboard grant signing and account destination management stay separate. */
export function useAccessFlow(agent: AgentView, onEnabled?: () => void) {
  const cache = useQueryClient();
  const destinations = useDestinationsFlow(agent.id);
  const router = useRouter();
  const [pending, setPending] = useState<{
    step: IntentStep;
    consent: ConsentChallenge;
    kind: "enable" | "revoke";
  } | null>(null);
  const [stage, setStage] = useState<ConsentStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const prepare = useMutation({
    mutationFn: async (input: { kind: "enable"; days: AccessDuration } | { kind: "revoke" }) => {
      const step =
        input.kind === "enable"
          ? await fundsApi.enableAccess(agent.id, {
              days: input.days,
            })
          : await fundsApi.revokeAccess(agent.id);
      const consent: ConsentChallenge = {
        owner: step.generated.signer,
        message: step.generated.preview,
        displayMessage: JSON.stringify(step.generated.intent.payload, null, 2),
      };
      return { step, consent, kind: input.kind };
    },
    onSuccess: (prepared) => {
      setError(null);
      setStage("idle");
      setPending(prepared);
    },
    onError: (cause: Error) => setError(errorMessage(cause.message)),
  });

  const sign = useCallback(async () => {
    if (!pending) return;
    setStage("signing");
    setError(null);
    try {
      const signed = await signIntent(pending.step.generated);
      setStage("submitting");
      const submitted = await intentsApi.submit(
        agent.id,
        pending.step.generated.correlation_id,
        signed,
      );
      if (submitted.operation.status !== "SUCCESS")
        throw new Error(
          operationFailure(submitted.operation.status, submitted.operation.failure_code) ??
            "permission_update_pending",
        );
      await refreshPermissions(cache, agent.id);
      setStage("idle");
      setPending(null);
      if (pending.kind === "enable") {
        if (onEnabled) onEnabled();
        else router.push(`/agents/${encodeURIComponent(agent.id)}`);
      }
    } catch (cause) {
      setStage("error");
      setError(cause instanceof Error ? errorMessage(cause.message) : "signing_failed");
      await refreshPermissions(cache, agent.id);
    }
  }, [agent.id, cache, onEnabled, pending, router]);

  const openForm = useCallback(
    () => router.push(`/agents/${encodeURIComponent(agent.id)}/access`),
    [agent.id, router],
  );
  const enable = (days: AccessDuration) => prepare.mutate({ kind: "enable", days });
  const revoke = useCallback(() => prepare.mutate({ kind: "revoke" }), [prepare]);
  const revoking = prepare.isPending && prepare.variables?.kind === "revoke";

  // Stable identity: the dialogs are a prop of the wallet screen and cannot re-render it.
  const dialogs = useMemo(
    () => () => (
      <>
        {destinations.dialogs}
        <ConsentDialog
          open={pending !== null}
          onOpenChange={(open) => {
            if (!open && stage !== "signing" && stage !== "submitting") setPending(null);
          }}
          title={pending?.kind === "revoke" ? revokeDialog : enableDialog}
          description={
            pending?.kind === "revoke"
              ? "You sign to end the grant. Anything already dispatched still completes."
              : "You sign dashboard access until the selected date. Account rules apply to every grant."
          }
          challenge={pending?.consent ?? null}
          stage={stage}
          error={error}
          confirmLabel={
            pending?.kind === "revoke" ? "Sign to revoke access" : "Sign to authorize dashboard"
          }
          onSign={sign}
        />
      </>
    ),
    [destinations.dialogs, error, pending, sign, stage],
  );

  return {
    openForm,
    manageDestinations: destinations.manageDestinations,
    enable,
    error,
    revoke,
    revoking,
    dialogs,
    active: pending !== null || prepare.isPending || destinations.busy,
  };
}
