import type {
  GenerateIntentRequest,
  GenerateIntentResponse,
  SignedData,
  StatusResponse,
} from "@near-intents-agent-api/sdk";
import { request } from "@/lib/http/request";

/** Every owner-authorized action funnels through this pair: prepare, then submit one signature. */
export type IntentStep = { generated: GenerateIntentResponse; operation: StatusResponse };

export const intentsApi = {
  generate: (agentId: string, input: Exclude<GenerateIntentRequest, { type: "agent_create" }>) =>
    request<IntentStep>(`/api/agents/${agentId}/intents`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  submit: (agentId: string, correlationId: string, signedData: SignedData) =>
    request<IntentStep>(`/api/agents/${agentId}/intents/${encodeURIComponent(correlationId)}`, {
      method: "POST",
      body: JSON.stringify({ signedData }),
    }),
};

/**
 * The one prepare→sign→submit path shared by every owner ceremony that goes through the
 * generic intents route: grants, execution cancels, approvals and dashboard access. Flows with
 * their own endpoint (MCP grant, policy workflow, onboarding) keep their own submit but sign
 * the same prepared payload with `signIntent`.
 */
export async function signAndSubmitIntent(
  agentId: string,
  step: IntentStep,
  sign: (intent: GenerateIntentResponse) => Promise<SignedData>,
): Promise<IntentStep> {
  return intentsApi.submit(agentId, step.generated.correlation_id, await sign(step.generated));
}
