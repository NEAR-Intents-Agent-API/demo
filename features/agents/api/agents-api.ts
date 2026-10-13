import type { Policy, SignedData } from "@near-intents-agent-api/sdk";
import type { IntentStep } from "@/features/intents";
import type { AgentListItem } from "@/lib/agent-api/agent-list";
import { request } from "@/lib/http/request";

export const agentsApi = {
  list: (signal?: AbortSignal) => request<{ agents: AgentListItem[] }>("/api/agents", { signal }),
  create: (name: string, policy: Policy) =>
    request<IntentStep>("/api/agents", {
      method: "POST",
      body: JSON.stringify({ name, policy }),
    }),
  onboarding: (agentId: string, signal?: AbortSignal) =>
    request<IntentStep>(`/api/agents/${encodeURIComponent(agentId)}/onboarding`, { signal }),
  submitOnboarding: (agentId: string, signature: SignedData) =>
    request<IntentStep>(`/api/agents/${encodeURIComponent(agentId)}/onboarding`, {
      method: "POST",
      body: JSON.stringify(signature),
    }),
  refreshOnboarding: (agentId: string) =>
    request<IntentStep>(`/api/agents/${encodeURIComponent(agentId)}/onboarding/refresh`, {
      method: "POST",
      body: "{}",
    }),
  detail: (agentId: string, signal?: AbortSignal) =>
    request<AgentListItem>(`/api/agents/${encodeURIComponent(agentId)}`, { signal }),
};
