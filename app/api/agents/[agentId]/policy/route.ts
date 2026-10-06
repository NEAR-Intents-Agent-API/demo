import { agentApi } from "@/lib/agent-api/client";
import { type AgentRouteContext, withAgent } from "@/lib/http/handler";
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET policy", agentId, () => agentApi().getPolicy(agentId));
}
