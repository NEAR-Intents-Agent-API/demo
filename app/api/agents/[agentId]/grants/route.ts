import { NextResponse } from "next/server";
import { accessViews } from "@/lib/agent-api/access";
import { agentApi } from "@/lib/agent-api/client";
import { dashboardCommitments } from "@/lib/agent-api/grant-credentials";
import { type AgentRouteContext, withAgent } from "@/lib/http/handler";

/**
 * `GET /api/agents/[agentId]/grants`: every owner grant on the agent, by the label the owner
 * signed (the dashboard, each MCP connection, or another app). Active grants come first, then
 * the revoked and expired ones with their dates. Each active grant is revoked on its own.
 */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/grants", agentId, async ({ session }) => {
    const [grants, dashboard] = await Promise.all([
      agentApi().listGrants(agentId),
      dashboardCommitments(session.userId, agentId),
    ]);
    return NextResponse.json({ data: accessViews(grants, dashboard) });
  });
}
