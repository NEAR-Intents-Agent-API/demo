"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAgent } from "@/features/agents/data";
import { queryKeys } from "@/lib/query/keys";
import { mcpApi } from "../api";
import { useMcpAuthorization } from "./use-mcp-authorization";

export function useMcpConsent(agentId: string, clientId: string, oauthQuery: string) {
  const agent = useAgent(agentId);
  const client = useQuery({
    queryKey: queryKeys.oauthClient(clientId),
    queryFn: () => mcpApi.publicClient(clientId),
    enabled: Boolean(clientId),
  });
  const access = useQuery({
    queryKey: queryKeys.mcp(agentId),
    queryFn: () => mcpApi.agent(agentId),
    enabled: Boolean(agent.data?.wallet),
  });
  const existing = access.data?.clients.find(
    (item) =>
      item.oauthClientId === clientId &&
      item.prepared &&
      item.status !== "revoked" &&
      item.status !== "expired",
  );
  const authorize = useMcpAuthorization(agentId, oauthQuery);
  const deny = useMutation({
    mutationFn: () => mcpApi.consent({ accept: false, agentId, oauthQuery }),
    onSuccess: (result) => window.location.assign(result.redirect_uri),
  });
  const error = authorize.error ?? deny.error ?? access.error;
  const disabled =
    authorize.isPending ||
    deny.isPending ||
    access.isPending ||
    Boolean(access.error) ||
    !agent.data?.wallet;
  const label = authorize.isPending
    ? "Authorizing…"
    : existing?.status === "authorized"
      ? "Continue with existing client permission"
      : "Sign grant and authorize client";
  return {
    agent,
    client,
    existing,
    authorize,
    deny,
    error,
    disabled,
    label,
  };
}
