import { type AgentRouteContext, bffError, withAgent } from "@/lib/http/handler";
import { serveAgentMcp } from "@/lib/mcp/handler";
import { agentMcpView } from "@/lib/mcp/view";

export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET agent MCP", agentId, async ({ session, agent }) => {
    if (!agent.wallet || !agent.owner) return bffError("agent_not_bound", 409);
    return agentMcpView(session.userId, agentId);
  });
}

export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return serveAgentMcp(request, agentId);
}
