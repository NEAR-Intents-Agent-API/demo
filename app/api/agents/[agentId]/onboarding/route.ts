import { ownerIntents } from "@/lib/agent-api/intents";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent(
    "GET onboarding",
    agentId,
    async ({ session }) =>
      (await ownerIntents().latest(session.userId, agentId, "agent_create")) ??
      bffError("intent_not_found", 404),
  );
}
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST onboarding", agentId, async ({ session }) => {
    const parsed = signedDataSchema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400);
    const current = await ownerIntents().latest(session.userId, agentId, "agent_create");
    if (!current) return bffError("intent_not_found", 404);
    return ownerIntents().submit(
      session.userId,
      agentId,
      current.generated.correlation_id,
      parsed.data,
    );
  });
}
