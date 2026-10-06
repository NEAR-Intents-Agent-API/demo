import { beginPolicyWorkflow } from "@/lib/agent-api/policy-workflow";
import { policySchema } from "@/lib/agent-api/schemas";
import {
  type AgentRouteContext,
  bffError,
  readJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";

export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST policy/workflows", agentId, async ({ session, log }) => {
    const body = (await readJson(request)) as { policy?: unknown } | undefined;
    const policy = policySchema.safeParse(body?.policy);
    if (!policy.success) return bffError("invalid_request", 400, log);
    return beginPolicyWorkflow(session, agentId, policy.data);
  });
}

export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET policy/workflows", agentId, async ({ session }) =>
    latestPolicyWorkflow(session.userId, agentId),
  );
}

import { latestPolicyWorkflow } from "@/lib/agent-api/policy-workflow";
