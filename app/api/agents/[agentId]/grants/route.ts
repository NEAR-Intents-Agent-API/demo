import { NextResponse } from "next/server";
import { accessView } from "@/lib/agent-api/access";
import { agentApi } from "@/lib/agent-api/client";
import { type AgentRouteContext, withAgent } from "@/lib/http/handler";

/**
 * `GET /api/agents/[agentId]/grants`: every live owner grant on the agent, by the label the owner
 * signed (the dashboard, each MCP connection, or another app). Each is revoked on its own.
 */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/grants", agentId, async () => {
    const now = Date.now();
    const live = (await agentApi().listGrants(agentId)).filter(
      (grant) => grant.revoked_at === null && Date.parse(grant.expires_at) > now,
    );
    return NextResponse.json({ data: live.map(accessView) });
  });
}
