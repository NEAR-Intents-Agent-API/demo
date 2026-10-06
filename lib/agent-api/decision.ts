import type { AgentView } from "@near-intents-agent-api/sdk";
import { agentBelongsToUser } from "@/lib/agent-api/ownership";
import type { DemoSession } from "@/lib/auth/session";

export type AgentAccessReason = "login_required" | "network_mismatch" | "agent_not_found";

export type AgentAccess =
  | { ok: true; session: DemoSession; agent: AgentView }
  | { ok: false; reason: AgentAccessReason };

/**
 * Pure access decision for every agent BFF route, separated from request plumbing so it can
 * be tested directly.
 *
 * Cross-user access resolves to `agent_not_found`, not `forbidden`: a shared tenant must not
 * reveal that another user's agent exists. `externalUserId` is the only thing separating
 * users, because every demo user shares one partner API key.
 */
export function decideAgentAccess(input: {
  session: DemoSession | null;
  networkOk: boolean;
  agent: AgentView | null;
}): AgentAccess {
  if (!input.session) return { ok: false, reason: "login_required" };
  if (!input.networkOk) return { ok: false, reason: "network_mismatch" };
  if (!input.agent || !agentBelongsToUser(input.agent, input.session.userId))
    return { ok: false, reason: "agent_not_found" };
  return { ok: true, session: input.session, agent: input.agent };
}
