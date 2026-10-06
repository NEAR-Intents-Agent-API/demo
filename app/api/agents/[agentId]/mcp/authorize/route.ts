import { z } from "zod";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgentMutation,
} from "@/lib/http/handler";
import { authorizeClient } from "@/lib/mcp/authorization";

const schema = z.strictObject({
  clientAccessId: z.string().min(1).max(64),
  challengeId: z.string().min(1).max(64).optional(),
  signedData: signedDataSchema.optional(),
  oauthQuery: z.string().min(1).max(16384).optional(),
});
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST MCP authorize", agentId, async ({ session, agent }) => {
    const parsed = schema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400);
    if (!agent.owner || !agent.wallet || agent.archived) return bffError("agent_not_bound", 409);
    return authorizeClient(request, session.userId, agentId, parsed.data);
  });
}
