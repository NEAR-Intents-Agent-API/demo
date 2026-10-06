import { z } from "zod";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgentMutation,
} from "@/lib/http/handler";
import { prepareClientGrant } from "@/lib/mcp/authorization";

const schema = z.strictObject({
  name: z.string().trim().min(1).max(100).optional(),
  oauthQuery: z.string().min(1).max(16384).optional(),
  clientAccessId: z.string().min(1).max(64).optional(),
});
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST MCP challenge", agentId, async ({ session, agent }) => {
    const parsed = schema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400);
    if (!agent.owner || !agent.wallet || agent.archived) return bffError("agent_not_bound", 409);
    return prepareClientGrant(request, session.userId, agentId, parsed.data);
  });
}
