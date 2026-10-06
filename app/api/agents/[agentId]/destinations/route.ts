import { NextResponse } from "next/server";
import { z } from "zod";
import { agentApi } from "@/lib/agent-api/client";
import { ownerIntents } from "@/lib/agent-api/intents";
import { defaultDestinationRule, destinationRuleSchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";

const updateSchema = z.strictObject({
  rule: destinationRuleSchema,
  expectedRevision: z.number().int().nonnegative(),
});

/** The account's one destination rule: where the dashboard and every client may send. */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET destinations", agentId, async () => {
    const policy = await agentApi().getPolicy(agentId);
    return NextResponse.json({
      rule:
        policy.status === "APPLIED"
          ? (policy.policy?.destinations ?? defaultDestinationRule)
          : defaultDestinationRule,
      revision: policy.revision,
      availableAt: policy.cooldowns.policy_change_available_at,
    });
  });
}

/** A destination edit is a signed policy revision: no new grant and no blockchain transaction. */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST destinations", agentId, async ({ session, log }) => {
    const input = updateSchema.safeParse(await readGuardedJson(request));
    if (!input.success) return bffError("invalid_request", 400, log);
    const current = await agentApi().getPolicy(agentId);
    if (!current.policy || current.status !== "APPLIED")
      return bffError("policy_not_ready", 409, log);
    if (current.revision !== input.data.expectedRevision)
      return bffError("policy_revision_conflict", 409, log);
    return ownerIntents().generate(session.userId, {
      type: "policy_update",
      agent_id: agentId,
      expected_revision: input.data.expectedRevision,
      policy: { ...current.policy, destinations: input.data.rule },
    });
  });
}
