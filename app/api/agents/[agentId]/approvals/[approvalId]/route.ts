import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/** `GET /api/agents/[agentId]/approvals/[approvalId]`: one approval, whatever its outcome. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string; approvalId: string }> },
) {
  const { agentId, approvalId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/approvals/[approvalId]", agentId, async () =>
    NextResponse.json(await agentApi().getApproval(agentId, approvalId)),
  );
}
