"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { observeIntent, operationFailure } from "@/features/intents";
import { signIntent } from "@/features/wallet/index";
import { queryKeys } from "@/lib/query/keys";
import { type McpGrantChallenge, mcpApi } from "../api";

/** Keep persisted identity across canceled signing and lost submission responses. */
export function useMcpAuthorization(agentId: string, oauthQuery?: string) {
  const cache = useQueryClient();
  const prepared = useRef<McpGrantChallenge | null>(null);
  return useMutation({
    mutationFn: async (input: { name?: string; clientAccessId?: string }) => {
      const step = await mcpApi.challenge(agentId, {
        name: input.name,
        oauthQuery,
        clientAccessId: prepared.current?.clientAccessId ?? input.clientAccessId,
      });
      prepared.current = step;
      const signedData =
        !step.submitted && step.operation.status === "PENDING_SIGNATURE"
          ? await signIntent(step.generated)
          : undefined;
      const first = await mcpApi.authorize(agentId, {
        clientAccessId: step.clientAccessId,
        challengeId: step.challengeId,
        signedData,
        oauthQuery,
      });
      const result = first.authorized
        ? first
        : await observeIntent({
            read: () =>
              mcpApi.authorize(agentId, { clientAccessId: step.clientAccessId, oauthQuery }),
            done: (value) => value.authorized,
            failure: (value) =>
              value.operation
                ? operationFailure(value.operation.status, value.operation.failure_code)
                : undefined,
            timeoutCode: "grant_authorization_pending",
            intervalMs: 1_500,
          });
      prepared.current = null;
      return result;
    },
    onSettled: () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: queryKeys.mcp(agentId) }),
        cache.invalidateQueries({ queryKey: queryKeys.grants(agentId) }),
      ]),
  });
}
