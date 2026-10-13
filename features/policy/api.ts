import type {
  BalancesView,
  Policy,
  PolicyView,
  ScheduledPage,
  SignedData,
} from "@near-intents-agent-api/sdk";
import type { IntentStep } from "@/features/intents";
import type { AccountControls } from "@/lib/agent-api/controls";
import { DemoApiError, request } from "@/lib/http/request";

function requireWorkflowId(id: unknown): string {
  if (typeof id !== "string" || !id.trim() || id.trim() === "undefined" || id.trim() === "null") {
    throw new DemoApiError("policy_workflow_not_found", 404);
  }
  return id;
}

function requireIntentStep(value: unknown): IntentStep {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DemoApiError("policy_workflow_not_found", 404);
  }
  requireWorkflowId(
    ((value as Record<string, unknown>).generated as Record<string, unknown>)?.correlation_id,
  );
  return value as IntentStep;
}

export const policyApi = {
  policy: (agentId: string) => request<PolicyView>(`/api/agents/${agentId}/policy`),
  /** The private balance, read under the same cache key as the Funds screen's. */
  privateBalances: (agentId: string) =>
    request<BalancesView>(`/api/agents/${agentId}/balances?source=confidential`),
  controls: (agentId: string) => request<AccountControls>(`/api/agents/${agentId}/controls`),
  scheduled: (agentId: string, cursor?: string) =>
    request<ScheduledPage>(
      `/api/agents/${agentId}/executions/scheduled${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  workflow: async (agentId: string) => {
    const workflow = await request<unknown>(`/api/agents/${agentId}/policy/workflows`);
    return workflow === null ? null : requireIntentStep(workflow);
  },
  beginWorkflow: async (agentId: string, policy: Policy, expectedRevision: number) => {
    const workflow = await request<unknown>(`/api/agents/${agentId}/policy/workflows`, {
      method: "POST",
      body: JSON.stringify({ policy, expectedRevision }),
    });
    return requireIntentStep(workflow);
  },
  freezeWorkflow: async (agentId: string, frozen: boolean) => {
    const workflow = await request<unknown>(`/api/agents/${agentId}/policy/workflows`, {
      method: "POST",
      body: JSON.stringify({ frozen }),
    });
    return requireIntentStep(workflow);
  },
  resumeWorkflow: async (
    agentId: string,
    workflowId: string,
    input: { signedData?: SignedData } = {},
  ) => {
    const id = requireWorkflowId(workflowId);
    const workflow = await request<unknown>(
      `/api/agents/${agentId}/policy/workflows/${encodeURIComponent(id)}`,
      { method: "POST", body: JSON.stringify(input) },
    );
    return requireIntentStep(workflow);
  },
};
