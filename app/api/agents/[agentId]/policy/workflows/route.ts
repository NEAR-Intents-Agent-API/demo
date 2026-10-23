import { z } from "zod";
import {
  beginFreezeWorkflow,
  beginPolicyWorkflow,
  latestPolicyWorkflow,
} from "@/lib/agent-api/policy-workflow";
import { policySchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";

const inputSchema = z.union([
  z.strictObject({ policy: policySchema, expectedRevision: z.number().int().nonnegative() }),
  z.strictObject({ frozen: z.boolean() }),
]);

/** A rules revision on the revision the browser loaded, or a freeze / unfreeze of the account. */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST policy/workflows", agentId, async ({ session, log }) => {
    const input = inputSchema.safeParse(await readJson(request));
    if (!input.success) return bffError("validation_failed", 400, log);
    return "frozen" in input.data
      ? beginFreezeWorkflow(session.userId, agentId, input.data.frozen)
      : beginPolicyWorkflow(
          session.userId,
          agentId,
          input.data.policy,
          input.data.expectedRevision,
        );
  });
}

export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET policy/workflows", agentId, async ({ session }) =>
    latestPolicyWorkflow(session.userId, agentId),
  );
}
