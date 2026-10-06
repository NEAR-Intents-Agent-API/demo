import { AgentApiError, type NetworkView } from "@near-intents-agent-api/sdk";
import { agentApi } from "@/lib/agent-api/client";
import { demoEnv } from "@/lib/config/runtime";

export type NetworkGateFailure = {
  ok: false;
  reason: "agent_api_unreachable" | "network_mismatch";
  actual?: string;
};

export type NetworkGate = { ok: true; network: NetworkView } | NetworkGateFailure;

const SUCCESS_TTL_MS = 60_000;

let cachedSuccess: { at: number; network: NetworkView } | undefined;

/**
 * Fails closed unless the Agent API reports the network the demo is configured for. This is
 * the same check the acceptance criteria name, and it prevents a mainnet demo from silently
 * operating against a mainnet tenant.
 *
 * Only a successful match is cached, and only briefly. A mismatch or an unreachable API is
 * re-checked on every request, so a transient outage or a corrected deployment recovers
 * without a process restart.
 */
export async function requireConfiguredNetwork(): Promise<NetworkGate> {
  if (cachedSuccess && Date.now() - cachedSuccess.at < SUCCESS_TTL_MS)
    return { ok: true, network: cachedSuccess.network };
  try {
    const network = await agentApi().getNetwork();
    if (network.network !== (await demoEnv()).AGENT_NETWORK)
      return { ok: false, reason: "network_mismatch", actual: network.network };
    cachedSuccess = { at: Date.now(), network };
    return { ok: true, network };
  } catch (error) {
    if (error instanceof AgentApiError)
      return { ok: false, reason: "agent_api_unreachable", actual: String(error.status) };
    return { ok: false, reason: "agent_api_unreachable" };
  }
}
