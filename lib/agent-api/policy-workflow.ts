import type { Policy } from "@near-intents-agent-api/sdk";
import { ownerIntents } from "@/lib/agent-api/intents";

/**
 * Prepares a rules revision on top of `expectedRevision`, the revision the owner's browser
 * loaded. The API refuses it with `policy_revision_conflict` when the rules moved on since, so a
 * stale tab can never overwrite a newer change.
 */
export async function beginPolicyWorkflow(
  userId: string,
  agentId: string,
  policy: Policy,
  expectedRevision: number,
) {
  return ownerIntents().generate(userId, {
    type: "policy_update",
    agent_id: agentId,
    policy,
    expected_revision: expectedRevision,
  });
}

/**
 * Freezing and unfreezing restate the rules the API has applied, with only the flag changed, so a
 * stale browser can never sign an older rulebook through the emergency stop.
 */
export async function beginFreezeWorkflow(userId: string, agentId: string, frozen: boolean) {
  return ownerIntents().generate(userId, {
    type: frozen ? "agent_freeze" : "agent_unfreeze",
    agent_id: agentId,
  });
}

export const latestPolicyWorkflow = (userId: string, agentId: string) =>
  ownerIntents().latest(userId, agentId, "policy_update");
