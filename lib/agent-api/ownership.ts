import type { AgentView } from "@near-intents-agent-api/sdk";

/**
 * Cross-user isolation boundary. An agent is visible only when the Agent API reports the
 * signed-in demo user as `externalUserId`. Tenants are shared, so this predicate — not the
 * API key — is what separates users.
 */
export function agentBelongsToUser(agent: AgentView, userId: string): boolean {
  return agent.external_user_id !== null && agent.external_user_id === userId;
}
