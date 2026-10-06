import { AgentApi } from "@near-intents-agent-api/sdk";
import { parseDemoEnv } from "@/lib/config/env";

let client: AgentApi | undefined;

/** Server-only Agent API client. `NEAR_INTENTS_AGENT_API_KEY` never leaves this process. */
export function agentApi(): AgentApi {
  client ??= new AgentApi({
    baseUrl: parseDemoEnv().NEAR_INTENTS_AGENT_API_URL,
    apiKey: parseDemoEnv().NEAR_INTENTS_AGENT_API_KEY,
    // Mainnet policy writes wait for finality plus provider readback and can exceed 30s.
    timeoutMs: 180_000,
  });
  return client;
}
