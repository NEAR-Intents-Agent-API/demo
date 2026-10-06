import type { AgentView } from "@near-intents-agent-api/sdk";

/** Owner approval is a NEAR-owner feature: only a NEAR owner can vote on a held move. */
export function ownerCanApprove(agent: AgentView): boolean {
  return agent.owner?.type === "near" && agent.owner_account !== null;
}
