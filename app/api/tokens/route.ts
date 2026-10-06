import { agentApi } from "@/lib/agent-api/client";
import { withSession } from "@/lib/http/handler";

/**
 * `GET /api/tokens`: the Agent API's public token list (OutLayer's supported assets with 1Click
 * chains and USD prices), the one catalogue every screen draws tokens from.
 */
export function GET() {
  return withSession(async () => ({ data: await agentApi().getTokens() }), "GET /api/tokens");
}
