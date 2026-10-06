"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { observeIntent, operationFailure } from "@/features/intents";
import { signIntent } from "@/features/wallet/index";
import { queryKeys } from "@/lib/query/keys";
import { type McpClientView, mcpApi } from "../api";
import { useMcpAgent } from "./use-mcp-agent";

/** Client grants, the API-key dialog and revocation, all against one shared account read. */
export function useMcpClients(agentId: string) {
  const cache = useQueryClient();
  const [dialog, setDialog] = useState<{ client?: McpClientView } | null>(null);
  const view = useMcpAgent(agentId);
  const revoke = useMutation({
    mutationFn: async (clientAccessId: string) => {
      let result = await mcpApi.revokeClient(agentId, clientAccessId);
      await cache.invalidateQueries({ queryKey: queryKeys.mcp(agentId) });
      if (
        !result.submitted &&
        result.generated &&
        result.operation?.status === "PENDING_SIGNATURE"
      ) {
        result = await mcpApi.revokeClient(
          agentId,
          clientAccessId,
          await signIntent(result.generated),
        );
      }
      if (result.revoked) return result;
      return observeIntent({
        read: () => mcpApi.revokeClient(agentId, clientAccessId),
        done: (value) => value.revoked,
        failure: (value) =>
          value.operation
            ? operationFailure(value.operation.status, value.operation.failure_code)
            : undefined,
        timeoutCode: "grant_revocation_pending",
      });
    },
    onSettled: () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: queryKeys.mcp(agentId) }),
        cache.invalidateQueries({ queryKey: queryKeys.grants(agentId) }),
      ]),
  });
  return { view, revoke, dialog, setDialog };
}
