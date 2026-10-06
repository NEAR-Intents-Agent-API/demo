import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/**
 * `GET /api/agents/[agentId]/approvals`: pending provider approvals for the custody wallet.
 *
 * Approvals are provider state; the demo never keeps its own queue.
 */
export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/approvals", agentId, async () =>
    NextResponse.json(
      await agentApi()
        .listApprovals(agentId)
        .then((data) => ({ data })),
    ),
  );
}
