import { agentApi } from "@/lib/agent-api/client";
import { type AgentRouteContext, withAgent } from "@/lib/http/handler";

/** One page of the executions the timelock holds; `?cursor=` continues from the last page. */
export async function GET(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  return withAgent("GET scheduled executions", agentId, async () =>
    agentApi().listScheduledExecutions(agentId, cursor ? { cursor } : {}),
  );
}
