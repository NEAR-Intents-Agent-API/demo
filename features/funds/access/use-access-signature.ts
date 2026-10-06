"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { type IntentStep, intentsApi, operationFailure } from "@/features/intents";
import { type ConsentStage, signIntent } from "@/features/wallet";
import { errorMessage } from "@/lib/http/messages";
import { refreshPermissions } from "./refresh-permission-utils";

/** One server-prepared signature; success means installation, never merely wallet approval. */
export function useAccessSignature(agentId: string, onDone: () => void) {
  const cache = useQueryClient();
  const [stage, setStage] = useState<ConsentStage>("idle");
  const [prepared, setPrepared] = useState<IntentStep | null>(null);
  const refresh = () => refreshPermissions(cache, agentId);
  const mutation = useMutation({
    mutationFn: async (prepare: () => Promise<IntentStep>) => {
      setStage("preparing");
      setPrepared(null);
      const step = await prepare();
      setPrepared(step);
      setStage("signing");
      const signed = await signIntent(step.generated);
      setStage("submitting");
      const submitted = await intentsApi.submit(agentId, step.generated.correlation_id, signed);
      if (submitted.operation.status !== "SUCCESS")
        throw new Error(
          operationFailure(submitted.operation.status, submitted.operation.failure_code) ??
            "permission_update_pending",
        );
    },
    onSuccess: async () => {
      await refresh();
      setStage("idle");
      onDone();
    },
    onError: async () => {
      setStage("error");
      await refresh();
    },
  });
  const reset = useCallback(() => {
    mutation.reset();
    setPrepared(null);
    setStage("idle");
  }, [mutation.reset]);
  return {
    stage,
    prepared,
    busy: mutation.isPending,
    error: mutation.error ? errorMessage(mutation.error.message) : null,
    sign: mutation.mutate,
    reset,
  };
}
