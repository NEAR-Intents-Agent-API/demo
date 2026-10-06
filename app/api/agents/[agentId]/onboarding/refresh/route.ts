import { ownerIntents } from "@/lib/agent-api/intents";
import { type AgentRouteContext, withAgentMutation } from "@/lib/http/handler";

/** Long-poll window for one refresh; the client loops, so this only bounds a single request. */
const refreshWaitMs = 25_000;

export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST onboarding/refresh", agentId, ({ session }) =>
    ownerIntents().latest(session.userId, agentId, "agent_create", { waitMs: refreshWaitMs }),
  );
}
