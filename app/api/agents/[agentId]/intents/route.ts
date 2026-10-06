import { ownerIntents } from "@/lib/agent-api/intents";
import { generateIntentRequestSchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgentMutation,
} from "@/lib/http/handler";
/**
 * Owner intents the browser may prepare directly. Grants are issued only by the access and MCP
 * flows, which create and keep the grant token the owner's signature commits to.
 */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST intents", agentId, async ({ session }) => {
    const parsed = generateIntentRequestSchema.safeParse(await readGuardedJson(request));
    if (
      !parsed.success ||
      parsed.data.type === "agent_create" ||
      parsed.data.type === "grant_issue" ||
      parsed.data.agent_id !== agentId
    )
      return bffError("invalid_request", 400);
    return ownerIntents().generate(session.userId, parsed.data);
  });
}
