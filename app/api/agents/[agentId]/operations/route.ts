import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/** The API's page maximum: the activity feed joins up to 50 client requests against this list. */
const HISTORY_LIMIT = 100;

export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/operations", agentId, async () =>
    NextResponse.json(await agentApi().getHistory(agentId, { limit: HISTORY_LIMIT })),
  );
}
