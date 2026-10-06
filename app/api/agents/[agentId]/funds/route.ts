import { NextResponse } from "next/server";
import { z } from "zod";
import { agentApi } from "@/lib/agent-api/client";
import { FUNDS_TOOLS, type FundsTool, isFundsTool, runFundsTool } from "@/lib/agent-api/funds";
import { heldGrant } from "@/lib/agent-api/grant-credentials";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgentMutation,
} from "@/lib/http/handler";
import { type ToolContext, ToolDeniedError } from "@/lib/mcp/tools";

const requestSchema = z.strictObject({
  tool: z.enum(FUNDS_TOOLS),
  args: z.record(z.string(), z.unknown()),
});

async function fundsContext(
  tool: FundsTool,
  userId: string,
  agentId: string,
): Promise<ToolContext | null> {
  const api = agentApi();
  if (tool === "create_cross_chain_deposit") return { agentId, client: api };
  const held = await heldGrant(api, { userId, agentId, holder: "dashboard" });
  return held ? { agentId, client: held.client } : null;
}

/**
 * `POST /api/agents/[agentId]/funds`
 *
 * One door for every money movement the dashboard offers: quotes, swaps, transfers, withdrawals
 * and moves between the public and confidential balances. It is deliberately the same set of
 * operations an MCP harness gets. Inbound deposit addresses require no spending grant; other
 * tools still run under the dashboard's own live owner grant.
 *
 * The session and agent ownership are checked first; the dashboard's live grant is then read
 * from the Agent API on every call rather than remembered.
 */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST funds", agentId, async ({ session, log }) => {
    const parsed = requestSchema.safeParse(await readGuardedJson(request));
    if (!parsed.success || !isFundsTool(parsed.data.tool))
      return bffError("invalid_request", 400, log);

    const authority = await fundsContext(parsed.data.tool, session.userId, agentId);
    if (!authority) return bffError("access_required", 409, log);
    try {
      const outcome = await runFundsTool(parsed.data.tool, parsed.data.args, authority);
      return NextResponse.json({
        status: outcome.status,
        operationId: outcome.operationId,
        result: outcome.result,
      });
    } catch (error) {
      if (error instanceof ToolDeniedError) return bffError(error.code, 403, log);
      if (error instanceof z.ZodError) return bffError("invalid_request", 400, log);
      throw error;
    }
  });
}
