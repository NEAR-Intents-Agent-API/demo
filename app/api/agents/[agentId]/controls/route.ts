import { readAccountControls } from "@/lib/agent-api/controls";
import { type AgentRouteContext, withAgent } from "@/lib/http/handler";

/** `GET /api/agents/[agentId]/controls`: the account's rules, budget, delay and access at once. */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/controls", agentId, () =>
    readAccountControls(agentId),
  );
}
