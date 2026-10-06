import type { AgentView } from "@near-intents-agent-api/sdk";
import { agentApi } from "@/lib/agent-api/client";
import { type AgentAccessReason, decideAgentAccess } from "@/lib/agent-api/decision";
import { type NetworkGateFailure, requireConfiguredNetwork } from "@/lib/agent-api/network";
import { currentSession, type DemoSession } from "@/lib/auth/session";
import { bffError, networkGateError, type RouteLog } from "@/lib/http/errors";
import { errorFields, logger } from "@/lib/http/logger";

/**
 * Resolves the session and the agent together. Cross-user access is rejected here, before
 * any provider call, so the shared tenant API key never widens a browser request. The
 * network gate fails closed before any agent data is returned.
 */
export async function requireOwnedAgent(
  agentId: string,
): Promise<
  | { ok: true; session: DemoSession; agent: AgentView; log: RouteLog }
  | { ok: false; response: ReturnType<typeof bffError> }
> {
  const log: RouteLog = {
    requestId: crypto.randomUUID(),
    route: `agent:${agentId}`,
    startedAt: Date.now(),
  };
  const session = await currentSession();
  let networkFailure: NetworkGateFailure | null = null;
  if (session) {
    const gate = await requireConfiguredNetwork();
    if (!gate.ok) networkFailure = gate;
  }
  const networkOk = networkFailure === null;
  const agent =
    session && networkOk
      ? await agentApi()
          .getAgent(agentId)
          .catch((error: unknown) => {
            logger.warn("agent_lookup_failed", {
              request_id: log.requestId,
              agent_id: agentId,
              ...errorFields(error),
            });
            return null;
          })
      : null;
  const access = decideAgentAccess({ session, networkOk, agent });
  if (!access.ok) {
    logger.warn("agent_access_denied", {
      request_id: log.requestId,
      agent_id: agentId,
      reason: access.reason,
    });
    // The gate distinguishes "wrong network" from "unreachable"; both fail closed.
    if (networkFailure) return { ok: false, response: networkGateError(networkFailure, log) };
    return { ok: false, response: accessResponse(access.reason, log) };
  }
  return { ...access, log };
}

function accessResponse(reason: AgentAccessReason, log: RouteLog) {
  switch (reason) {
    case "login_required":
      return bffError("login_required", 401, log);
    case "network_mismatch":
      return networkGateError({ ok: false, reason: "network_mismatch" }, log);
    case "agent_not_found":
      return bffError("agent_not_found", 404, log);
  }
}
