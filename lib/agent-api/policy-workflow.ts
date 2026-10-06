import type { Policy } from "@near-intents-agent-api/sdk";
import { agentApi } from "@/lib/agent-api/client";
import { ownerIntents } from "@/lib/agent-api/intents";
import type { DemoSession } from "@/lib/auth/session";

export async function beginPolicyWorkflow(session: DemoSession, agentId: string, policy: Policy) {
  const current = await agentApi().getPolicy(agentId);
  return ownerIntents().generate(session.userId, {
    type: "policy_update",
    agent_id: agentId,
    policy,
    expected_revision: current.revision ?? 0,
  });
}
export const latestPolicyWorkflow = (userId: string, agentId: string) =>
  ownerIntents().latest(userId, agentId, "policy_update");
