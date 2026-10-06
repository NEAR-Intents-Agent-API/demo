import type { BalancesView, DestinationRule, StatusResponse } from "@near-intents-agent-api/sdk";
import type { IntentStep } from "@/features/intents";
import { request } from "@/lib/http/request";

export type FundsTool =
  | "swap_quote"
  | "withdraw_preview"
  | "swap"
  | "withdraw"
  | "intents_transfer"
  | "confidential_transfer"
  | "shield"
  | "unshield"
  | "create_cross_chain_deposit";

/** What the Agent API says about a live owner grant; the signed message itself stays server-side. */
export type AccessGrantView = {
  grantId: string;
  label: string;
  issuedAt: string;
  expiresAt: string;
};

/** The account's destination rule, shared by the dashboard and every connected client. */
export type DestinationSettings = {
  rule: DestinationRule;
  revision: number | null;
  availableAt: string | null;
};

export type FundsResult = {
  status: string;
  operationId: string | null;
  result: unknown;
};

export const fundsApi = {
  balances: (agentId: string, source: "public" | "confidential") =>
    request<BalancesView>(`/api/agents/${agentId}/balances?source=${source}`),
  access: (agentId: string) =>
    request<{ access: AccessGrantView | null }>(`/api/agents/${agentId}/access`),
  enableAccess: (agentId: string, input: { days: 1 | 7 | 30 }) =>
    request<IntentStep>(`/api/agents/${agentId}/access`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  destinations: (agentId: string) =>
    request<DestinationSettings>(`/api/agents/${agentId}/destinations`),
  updateDestinations: (
    agentId: string,
    input: { rule: DestinationRule; expectedRevision: number },
  ) =>
    request<IntentStep>(`/api/agents/${agentId}/destinations`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  grants: (agentId: string) =>
    request<{ data: AccessGrantView[] }>(`/api/agents/${agentId}/grants`),
  revokeAccess: (agentId: string) =>
    request<IntentStep>(`/api/agents/${agentId}/access`, { method: "DELETE" }),
  funds: (agentId: string, tool: FundsTool, args: Record<string, unknown>) =>
    request<FundsResult>(`/api/agents/${agentId}/funds`, {
      method: "POST",
      body: JSON.stringify({ tool, args }),
    }),
  operations: (agentId: string) =>
    request<{ data: StatusResponse[] }>(`/api/agents/${agentId}/operations`),
  operation: (
    agentId: string,
    correlationId: string,
    refresh = false,
    waitMs = 0,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams();
    if (refresh) query.set("refresh", "true");
    if (waitMs > 0) query.set("wait_ms", String(waitMs));
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return request<StatusResponse>(
      `/api/agents/${agentId}/operations/${encodeURIComponent(correlationId)}${suffix}`,
      { signal },
    );
  },
};
